import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  beforeEach,
  afterAll,
} from "vitest";
import { db } from "@/lib/db";
import { profiles, adminAuditLog } from "@/lib/db/schema";
import { eq, like, and, inArray, or } from "drizzle-orm";

// --- Mocks ---

const mockAuth = vi.fn();
const mockClerkBanUser = vi.fn();
const mockClerkUnbanUser = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
  clerkClient: () =>
    Promise.resolve({
      users: {
        getUser: () =>
          Promise.resolve({
            firstName: "Admin",
            lastName: "Tester",
            username: "admintester",
          }),
        banUser: (...args: unknown[]) => mockClerkBanUser(...args),
        unbanUser: (...args: unknown[]) => mockClerkUnbanUser(...args),
      },
    }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockCaptureException = vi.fn();
vi.mock("@sentry/nextjs", () => ({
  captureException: (...args: unknown[]) => mockCaptureException(...args),
}));

vi.mock("@/lib/discord", () => ({
  notifySignup: vi.fn(),
  notifyProject: vi.fn(),
}));

vi.mock("@/lib/milestones", () => ({
  checkSignupMilestone: vi.fn(),
  checkProjectMilestone: vi.fn(),
}));

// Import AFTER mocks
import {
  hideUser,
  unhideUser,
  banUser,
  unbanUser,
} from "@/app/admin/users/actions";

// --- Constants & helpers ---

const TEST_PREFIX = "test_adminuser_";
const SUPER_ADMIN_CLERK = `${TEST_PREFIX}superadmin`;

// Must use vi.hoisted to set env before lib/admin.ts loads (runs before all imports)
vi.hoisted(() => {
  process.env.ADMIN_USER_IDS = "test_adminuser_superadmin";
});

function testClerkId() {
  return `${TEST_PREFIX}${crypto.randomUUID()}`;
}

// --- Shared state ---

let adminClerk: string;
let adminProfileId: string;
let modClerk: string;
let modProfileId: string;
let targetClerk: string;
let targetProfileId: string;
let superAdminProfileId: string;

const createdProfileClerkIds: string[] = [];

// --- Setup / Teardown ---

beforeAll(async () => {
  const { ensureProfile } = await import("@/lib/db/ensure-profile");

  // Admin user
  adminClerk = testClerkId();
  const adminProfile = await ensureProfile(adminClerk);
  adminProfileId = adminProfile!.id;
  await db
    .update(profiles)
    .set({ role: "admin" })
    .where(eq(profiles.id, adminProfileId));
  createdProfileClerkIds.push(adminClerk);

  // Moderator user
  modClerk = testClerkId();
  const modProfile = await ensureProfile(modClerk);
  modProfileId = modProfile!.id;
  await db
    .update(profiles)
    .set({ role: "moderator" })
    .where(eq(profiles.id, modProfileId));
  createdProfileClerkIds.push(modClerk);

  // Regular target user
  targetClerk = testClerkId();
  const targetProfile = await ensureProfile(targetClerk);
  targetProfileId = targetProfile!.id;
  createdProfileClerkIds.push(targetClerk);

  // Super-admin user
  const superAdminProfile = await ensureProfile(SUPER_ADMIN_CLERK);
  superAdminProfileId = superAdminProfile!.id;
  await db
    .update(profiles)
    .set({ role: "admin" })
    .where(eq(profiles.id, superAdminProfileId));
  createdProfileClerkIds.push(SUPER_ADMIN_CLERK);
});

beforeEach(async () => {
  mockAuth.mockReset();
  mockAuth.mockResolvedValue({ userId: adminClerk });
  mockCaptureException.mockReset();
  mockClerkBanUser.mockReset();
  mockClerkUnbanUser.mockReset();

  // Reset target user state before each test
  await db
    .update(profiles)
    .set({
      hiddenAt: null,
      hiddenBy: null,
      bannedAt: null,
      bannedBy: null,
      banReason: null,
    })
    .where(eq(profiles.id, targetProfileId));
});

afterAll(async () => {
  // Clean up all audit logs referencing test profiles (as actor or target)
  const testProfiles = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(like(profiles.clerkId, `${TEST_PREFIX}%`));
  const profileIds = testProfiles.map((p) => p.id);
  if (profileIds.length > 0) {
    await db
      .delete(adminAuditLog)
      .where(
        or(
          inArray(adminAuditLog.actorProfileId, profileIds),
          inArray(adminAuditLog.targetProfileId, profileIds)
        )
      );
  }

  await db
    .delete(profiles)
    .where(like(profiles.clerkId, `${TEST_PREFIX}%`));
});

// ========================================================================
// hideUser
// ========================================================================

describe("hideUser", () => {
  it("hides user successfully as admin", async () => {
    const result = await hideUser({ profileId: targetProfileId });
    expect(result).toEqual({ success: true });

    const target = await db.query.profiles.findFirst({
      where: eq(profiles.id, targetProfileId),
    });
    expect(target!.hiddenAt).not.toBeNull();
    expect(target!.hiddenBy).toBe(adminProfileId);
  });

  it("hides user successfully as moderator", async () => {
    mockAuth.mockResolvedValue({ userId: modClerk });
    const result = await hideUser({ profileId: targetProfileId });
    expect(result).toEqual({ success: true });

    const target = await db.query.profiles.findFirst({
      where: eq(profiles.id, targetProfileId),
    });
    expect(target!.hiddenAt).not.toBeNull();
    expect(target!.hiddenBy).toBe(modProfileId);
  });

  it("creates audit log entry", async () => {
    await hideUser({ profileId: targetProfileId });

    const log = await db.query.adminAuditLog.findFirst({
      where: and(
        eq(adminAuditLog.actorProfileId, adminProfileId),
        eq(adminAuditLog.action, "hide_user"),
        eq(adminAuditLog.targetProfileId, targetProfileId)
      ),
    });
    expect(log).toBeDefined();
  });

  it("returns error when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const result = await hideUser({ profileId: targetProfileId });
    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });

  it("returns error for regular user", async () => {
    mockAuth.mockResolvedValue({ userId: targetClerk });
    const result = await hideUser({ profileId: targetProfileId });
    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });

  it("returns error for non-existent target", async () => {
    const result = await hideUser({
      profileId: "00000000-0000-0000-0000-000000000000",
    });
    expect(result).toEqual({ success: false, error: "User not found" });
  });

  it("returns error when target already hidden", async () => {
    await hideUser({ profileId: targetProfileId });
    const result = await hideUser({ profileId: targetProfileId });
    expect(result).toEqual({
      success: false,
      error: "User is already hidden",
    });
  });

  it("returns error when target is super-admin", async () => {
    const result = await hideUser({ profileId: superAdminProfileId });
    expect(result).toEqual({
      success: false,
      error: "Cannot hide a super-admin",
    });
  });
});

// ========================================================================
// unhideUser
// ========================================================================

describe("unhideUser", () => {
  it("unhides user successfully", async () => {
    // Hide first
    await hideUser({ profileId: targetProfileId });

    const result = await unhideUser({ profileId: targetProfileId });
    expect(result).toEqual({ success: true });

    const target = await db.query.profiles.findFirst({
      where: eq(profiles.id, targetProfileId),
    });
    expect(target!.hiddenAt).toBeNull();
    expect(target!.hiddenBy).toBeNull();
  });

  it("returns error when target is not hidden", async () => {
    const result = await unhideUser({ profileId: targetProfileId });
    expect(result).toEqual({ success: false, error: "User is not hidden" });
  });

  it("returns error when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const result = await unhideUser({ profileId: targetProfileId });
    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });

  it("returns error for non-existent target", async () => {
    const result = await unhideUser({
      profileId: "00000000-0000-0000-0000-000000000000",
    });
    expect(result).toEqual({ success: false, error: "User not found" });
  });
});

// ========================================================================
// banUser
// ========================================================================

describe("banUser", () => {
  it("bans user successfully as admin", async () => {
    const result = await banUser({
      profileId: targetProfileId,
      reason: "Spam",
    });
    expect(result).toEqual({ success: true });

    const target = await db.query.profiles.findFirst({
      where: eq(profiles.id, targetProfileId),
    });
    expect(target!.bannedAt).not.toBeNull();
    expect(target!.bannedBy).toBe(adminProfileId);
    expect(target!.banReason).toBe("Spam");
    expect(mockClerkBanUser).toHaveBeenCalledWith(targetClerk);
  });

  it("bans user successfully as moderator (target is regular user)", async () => {
    mockAuth.mockResolvedValue({ userId: modClerk });
    const result = await banUser({ profileId: targetProfileId });
    expect(result).toEqual({ success: true });
  });

  it("creates audit log entry with reason", async () => {
    // Clean up any previous ban_user audit entries for this target
    await db
      .delete(adminAuditLog)
      .where(
        and(
          eq(adminAuditLog.action, "ban_user"),
          eq(adminAuditLog.targetProfileId, targetProfileId)
        )
      );

    await banUser({ profileId: targetProfileId, reason: "Bad behavior" });

    const log = await db.query.adminAuditLog.findFirst({
      where: and(
        eq(adminAuditLog.actorProfileId, adminProfileId),
        eq(adminAuditLog.action, "ban_user"),
        eq(adminAuditLog.targetProfileId, targetProfileId)
      ),
    });
    expect(log).toBeDefined();
    const metadata = JSON.parse(log!.metadata!);
    expect(metadata.reason).toBe("Bad behavior");
  });

  it("stores null for empty ban reason", async () => {
    await banUser({ profileId: targetProfileId, reason: "" });

    const target = await db.query.profiles.findFirst({
      where: eq(profiles.id, targetProfileId),
    });
    expect(target!.banReason).toBeNull();
  });

  it("returns error when moderator tries to ban admin", async () => {
    mockAuth.mockResolvedValue({ userId: modClerk });
    // Target the admin user
    const result = await banUser({ profileId: adminProfileId });
    expect(result).toEqual({
      success: false,
      error: "Moderators cannot ban admins",
    });
  });

  it("returns error when user is already banned", async () => {
    await banUser({ profileId: targetProfileId });
    const result = await banUser({ profileId: targetProfileId });
    expect(result).toEqual({
      success: false,
      error: "User is already banned",
    });
  });

  it("returns error for super-admin target", async () => {
    const result = await banUser({ profileId: superAdminProfileId });
    expect(result).toEqual({
      success: false,
      error: "Cannot ban a super-admin",
    });
  });

  it("returns error for self-ban", async () => {
    const result = await banUser({ profileId: adminProfileId });
    expect(result).toEqual({ success: false, error: "Cannot ban yourself" });
  });

  it("continues even if Clerk ban fails", async () => {
    mockClerkBanUser.mockRejectedValue(new Error("Clerk API error"));

    const result = await banUser({ profileId: targetProfileId });
    expect(result).toEqual({ success: true });

    // DB ban still took effect
    const target = await db.query.profiles.findFirst({
      where: eq(profiles.id, targetProfileId),
    });
    expect(target!.bannedAt).not.toBeNull();

    // Sentry captured the Clerk error
    expect(mockCaptureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        tags: { component: "server-action", action: "banUser-clerk" },
      })
    );
  });

  it("returns error when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const result = await banUser({ profileId: targetProfileId });
    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });
});

// ========================================================================
// unbanUser
// ========================================================================

describe("unbanUser", () => {
  it("unbans user successfully as admin", async () => {
    // Ban first
    await banUser({ profileId: targetProfileId });
    mockCaptureException.mockReset();
    mockClerkUnbanUser.mockReset();

    const result = await unbanUser({ profileId: targetProfileId });
    expect(result).toEqual({ success: true });

    const target = await db.query.profiles.findFirst({
      where: eq(profiles.id, targetProfileId),
    });
    expect(target!.bannedAt).toBeNull();
    expect(target!.bannedBy).toBeNull();
    expect(target!.banReason).toBeNull();
    expect(target!.hiddenAt).toBeNull();
    expect(target!.hiddenBy).toBeNull();
    expect(mockClerkUnbanUser).toHaveBeenCalledWith(targetClerk);
  });

  it("creates audit log entry", async () => {
    await banUser({ profileId: targetProfileId });
    await unbanUser({ profileId: targetProfileId });

    const log = await db.query.adminAuditLog.findFirst({
      where: and(
        eq(adminAuditLog.actorProfileId, adminProfileId),
        eq(adminAuditLog.action, "unban_user")
      ),
    });
    expect(log).toBeDefined();
  });

  it("returns error when user is not banned", async () => {
    const result = await unbanUser({ profileId: targetProfileId });
    expect(result).toEqual({ success: false, error: "User is not banned" });
  });

  it("returns error for moderators", async () => {
    mockAuth.mockResolvedValue({ userId: modClerk });
    const result = await unbanUser({ profileId: targetProfileId });
    expect(result).toEqual({
      success: false,
      error: "Only admins can unban users",
    });
  });

  it("continues even if Clerk unban fails", async () => {
    await banUser({ profileId: targetProfileId });
    mockCaptureException.mockReset();
    mockClerkUnbanUser.mockRejectedValue(new Error("Clerk API error"));

    const result = await unbanUser({ profileId: targetProfileId });
    expect(result).toEqual({ success: true });

    // DB unban still took effect
    const target = await db.query.profiles.findFirst({
      where: eq(profiles.id, targetProfileId),
    });
    expect(target!.bannedAt).toBeNull();

    expect(mockCaptureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        tags: { component: "server-action", action: "unbanUser-clerk" },
      })
    );
  });

  it("returns error when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const result = await unbanUser({ profileId: targetProfileId });
    expect(result).toEqual({
      success: false,
      error: "Only admins can unban users",
    });
  });

  it("returns error for non-existent target", async () => {
    const result = await unbanUser({
      profileId: "00000000-0000-0000-0000-000000000000",
    });
    expect(result).toEqual({ success: false, error: "User not found" });
  });
});
