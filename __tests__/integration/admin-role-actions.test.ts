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

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
  clerkClient: () =>
    Promise.resolve({
      users: {
        getUser: () =>
          Promise.resolve({
            firstName: "Role",
            lastName: "Admin",
            username: "roleadmin",
          }),
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

// --- Constants ---

const TEST_PREFIX = "test_roles_";
const SUPER_ADMIN_CLERK = `${TEST_PREFIX}superadmin`;

// Must use vi.hoisted to set env before lib/admin.ts loads (runs before all imports)
vi.hoisted(() => {
  process.env.ADMIN_USER_IDS = "test_roles_superadmin";
});

// Import AFTER mocks and env setup
import {
  setUserRole,
  searchProfilesByName,
} from "@/app/admin/roles/actions";

// --- Helpers ---

function testClerkId() {
  return `${TEST_PREFIX}${crypto.randomUUID()}`;
}

// --- Shared state ---

let adminClerk: string;
let adminProfileId: string;
let targetClerk: string;
let targetProfileId: string;
let modClerk: string;
let superAdminProfileId: string;

// --- Setup / Teardown ---

beforeAll(async () => {
  const { ensureProfile } = await import("@/lib/db/ensure-profile");

  // Admin
  adminClerk = testClerkId();
  const adminProfile = await ensureProfile(adminClerk);
  adminProfileId = adminProfile!.id;
  await db
    .update(profiles)
    .set({ role: "admin" })
    .where(eq(profiles.id, adminProfileId));

  // Target user
  targetClerk = testClerkId();
  const targetProfile = await ensureProfile(targetClerk);
  targetProfileId = targetProfile!.id;

  // Moderator
  modClerk = testClerkId();
  const modProfile = await ensureProfile(modClerk);
  await db
    .update(profiles)
    .set({ role: "moderator" })
    .where(eq(profiles.id, modProfile!.id));

  // Super-admin
  const superAdminProfile = await ensureProfile(SUPER_ADMIN_CLERK);
  superAdminProfileId = superAdminProfile!.id;
  await db
    .update(profiles)
    .set({ role: "admin" })
    .where(eq(profiles.id, superAdminProfileId));
});

beforeEach(async () => {
  mockAuth.mockReset();
  mockAuth.mockResolvedValue({ userId: adminClerk });
  mockCaptureException.mockReset();

  // Reset target role to 'user'
  await db
    .update(profiles)
    .set({ role: "user" })
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
// setUserRole
// ========================================================================

describe("setUserRole", () => {
  it("sets role from user to moderator", async () => {
    const result = await setUserRole({
      profileId: targetProfileId,
      role: "moderator",
    });
    expect(result).toEqual({ success: true });

    const target = await db.query.profiles.findFirst({
      where: eq(profiles.id, targetProfileId),
    });
    expect(target!.role).toBe("moderator");
  });

  it("creates audit log entry with old/new role", async () => {
    await setUserRole({ profileId: targetProfileId, role: "moderator" });

    const log = await db.query.adminAuditLog.findFirst({
      where: and(
        eq(adminAuditLog.actorProfileId, adminProfileId),
        eq(adminAuditLog.action, "set_role"),
        eq(adminAuditLog.targetProfileId, targetProfileId)
      ),
    });
    expect(log).toBeDefined();
    const metadata = JSON.parse(log!.metadata!);
    expect(metadata.oldRole).toBe("user");
    expect(metadata.newRole).toBe("moderator");
  });

  it("returns success as no-op when setting same role", async () => {
    // Target is already 'user'
    const result = await setUserRole({
      profileId: targetProfileId,
      role: "user",
    });
    expect(result).toEqual({ success: true });
  });

  it("returns error when not admin", async () => {
    mockAuth.mockResolvedValue({ userId: modClerk });
    const result = await setUserRole({
      profileId: targetProfileId,
      role: "moderator",
    });
    expect(result).toEqual({
      success: false,
      error: "Only admins can manage roles",
    });
  });

  it("returns error when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const result = await setUserRole({
      profileId: targetProfileId,
      role: "moderator",
    });
    expect(result).toEqual({
      success: false,
      error: "Only admins can manage roles",
    });
  });

  it("returns error for non-existent target", async () => {
    const result = await setUserRole({
      profileId: "00000000-0000-0000-0000-000000000000",
      role: "moderator",
    });
    expect(result).toEqual({ success: false, error: "User not found" });
  });

  it("returns error when changing super-admin role", async () => {
    const result = await setUserRole({
      profileId: superAdminProfileId,
      role: "user",
    });
    expect(result).toEqual({
      success: false,
      error: "Cannot change a super-admin's role",
    });
  });

  it("returns error when changing own role", async () => {
    const result = await setUserRole({
      profileId: adminProfileId,
      role: "user",
    });
    expect(result).toEqual({
      success: false,
      error: "Cannot change your own role",
    });
  });
});

// ========================================================================
// searchProfilesByName
// ========================================================================

describe("searchProfilesByName", () => {
  beforeAll(async () => {
    await db
      .update(profiles)
      .set({ displayName: "RoleSearchTestUser" })
      .where(eq(profiles.id, targetProfileId));
  });

  it("returns matching profiles by display name", async () => {
    const results = await searchProfilesByName("RoleSearchTest");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((p) => p.id === targetProfileId)).toBe(true);
  });

  it("returns matching profiles by username", async () => {
    // Set a searchable username
    const searchUsername = `${TEST_PREFIX}searchable${crypto.randomUUID().slice(0, 4)}`;
    await db
      .update(profiles)
      .set({ username: searchUsername })
      .where(eq(profiles.id, targetProfileId));

    const results = await searchProfilesByName(searchUsername.slice(0, 15));
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((p) => p.id === targetProfileId)).toBe(true);
  });

  it("returns empty array for short query", async () => {
    const results = await searchProfilesByName("a");
    expect(results).toEqual([]);
  });

  it("returns empty array for empty query", async () => {
    const results = await searchProfilesByName("");
    expect(results).toEqual([]);
  });
});
