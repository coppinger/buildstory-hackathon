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
import { profiles, mentorApplications, adminAuditLog } from "@/lib/db/schema";
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
            firstName: "Mentor",
            lastName: "Admin",
            username: "mentoradmin",
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
  notifyMentorApplication: vi.fn(),
}));

vi.mock("@/lib/milestones", () => ({
  checkSignupMilestone: vi.fn(),
  checkProjectMilestone: vi.fn(),
}));

// Import AFTER mocks
import {
  approveMentorApplication,
  declineMentorApplication,
} from "@/app/admin/mentors/actions";

// --- Constants & helpers ---

const TEST_PREFIX = "test_mentor_admin_";

function testClerkId() {
  return `${TEST_PREFIX}${crypto.randomUUID()}`;
}

function testEmail() {
  return `${TEST_PREFIX}${crypto.randomUUID().slice(0, 8)}@example.com`;
}

// --- Shared state ---

let adminClerk: string;
let adminProfileId: string;
let modClerk: string;
let pendingAppId: string;

const createdAppIds: string[] = [];

async function createPendingApplication(): Promise<string> {
  const [app] = await db
    .insert(mentorApplications)
    .values({
      name: "Pending Mentor",
      email: testEmail(),
      discordHandle: "pendingmentor#1234",
      mentorTypes: ["technical"],
      background: "Test background",
      availability: "Weekends",
    })
    .returning();
  createdAppIds.push(app.id);
  return app.id;
}

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

  // Moderator user
  modClerk = testClerkId();
  await ensureProfile(modClerk);
  // Moderator role defaults to 'user', set it to 'moderator'
  const modProfile = await db.query.profiles.findFirst({
    where: eq(profiles.clerkId, modClerk),
  });
  await db
    .update(profiles)
    .set({ role: "moderator" })
    .where(eq(profiles.id, modProfile!.id));
});

beforeEach(async () => {
  mockAuth.mockReset();
  mockAuth.mockResolvedValue({ userId: adminClerk });
  mockCaptureException.mockReset();

  // Create a fresh pending application for each test
  pendingAppId = await createPendingApplication();
});

afterAll(async () => {
  // Clean up tracked applications
  for (const id of createdAppIds) {
    await db
      .delete(mentorApplications)
      .where(eq(mentorApplications.id, id));
  }
  // Clean up all FK references to test profiles
  const testProfiles = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(like(profiles.clerkId, `${TEST_PREFIX}%`));
  const profileIds = testProfiles.map((p) => p.id);
  if (profileIds.length > 0) {
    // Audit logs (actor or target)
    await db
      .delete(adminAuditLog)
      .where(
        or(
          inArray(adminAuditLog.actorProfileId, profileIds),
          inArray(adminAuditLog.targetProfileId, profileIds)
        )
      );
    // Mentor applications reviewed by test profiles
    await db
      .delete(mentorApplications)
      .where(inArray(mentorApplications.reviewedBy, profileIds));
  }

  await db
    .delete(profiles)
    .where(like(profiles.clerkId, `${TEST_PREFIX}%`));
});

// ========================================================================
// approveMentorApplication
// ========================================================================

describe("approveMentorApplication", () => {
  it("approves pending application", async () => {
    const result = await approveMentorApplication({
      applicationId: pendingAppId,
    });
    expect(result).toEqual({ success: true });

    const app = await db.query.mentorApplications.findFirst({
      where: eq(mentorApplications.id, pendingAppId),
    });
    expect(app!.status).toBe("approved");
    expect(app!.reviewedBy).toBe(adminProfileId);
    expect(app!.reviewedAt).not.toBeNull();
  });

  it("creates audit log entry", async () => {
    await approveMentorApplication({ applicationId: pendingAppId });

    const logs = await db.query.adminAuditLog.findMany({
      where: and(
        eq(adminAuditLog.actorProfileId, adminProfileId),
        eq(adminAuditLog.action, "approve_mentor")
      ),
    });
    const log = logs.find(
      (l) => JSON.parse(l.metadata!).applicationId === pendingAppId
    );
    expect(log).toBeDefined();
  });

  it("returns error when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const result = await approveMentorApplication({
      applicationId: pendingAppId,
    });
    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });

  it("returns error for non-admin (moderator)", async () => {
    mockAuth.mockResolvedValue({ userId: modClerk });
    const result = await approveMentorApplication({
      applicationId: pendingAppId,
    });
    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });

  it("returns error for non-existent application", async () => {
    const result = await approveMentorApplication({
      applicationId: "00000000-0000-0000-0000-000000000000",
    });
    expect(result).toEqual({
      success: false,
      error: "Application not found",
    });
  });

  it("returns error when application not pending (already approved)", async () => {
    await approveMentorApplication({ applicationId: pendingAppId });
    const result = await approveMentorApplication({
      applicationId: pendingAppId,
    });
    expect(result).toEqual({
      success: false,
      error: "Application is not pending",
    });
  });
});

// ========================================================================
// declineMentorApplication
// ========================================================================

describe("declineMentorApplication", () => {
  it("declines pending application", async () => {
    const result = await declineMentorApplication({
      applicationId: pendingAppId,
    });
    expect(result).toEqual({ success: true });

    const app = await db.query.mentorApplications.findFirst({
      where: eq(mentorApplications.id, pendingAppId),
    });
    expect(app!.status).toBe("declined");
    expect(app!.reviewedBy).toBe(adminProfileId);
    expect(app!.reviewedAt).not.toBeNull();
  });

  it("creates audit log entry", async () => {
    await declineMentorApplication({ applicationId: pendingAppId });

    const log = await db.query.adminAuditLog.findFirst({
      where: and(
        eq(adminAuditLog.actorProfileId, adminProfileId),
        eq(adminAuditLog.action, "decline_mentor")
      ),
    });
    expect(log).toBeDefined();
  });

  it("returns error when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const result = await declineMentorApplication({
      applicationId: pendingAppId,
    });
    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });

  it("returns error for non-admin", async () => {
    mockAuth.mockResolvedValue({ userId: modClerk });
    const result = await declineMentorApplication({
      applicationId: pendingAppId,
    });
    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });

  it("returns error for non-existent application", async () => {
    const result = await declineMentorApplication({
      applicationId: "00000000-0000-0000-0000-000000000000",
    });
    expect(result).toEqual({
      success: false,
      error: "Application not found",
    });
  });

  it("returns error when application not pending (already declined)", async () => {
    await declineMentorApplication({ applicationId: pendingAppId });
    const result = await declineMentorApplication({
      applicationId: pendingAppId,
    });
    expect(result).toEqual({
      success: false,
      error: "Application is not pending",
    });
  });
});
