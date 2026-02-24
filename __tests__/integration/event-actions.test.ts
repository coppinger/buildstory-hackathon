import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from "vitest";
import { db } from "@/lib/db";
import {
  events,
  profiles,
  eventRegistrations,
  projects,
  eventProjects,
} from "@/lib/db/schema";
import { eq, like, and } from "drizzle-orm";

// --- Mocks ---

const mockAuth = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
  clerkClient: () =>
    Promise.resolve({
      users: {
        getUser: () =>
          Promise.resolve({
            firstName: "Action",
            lastName: "Tester",
            username: "actiontester",
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

// Import actions AFTER mocks are set up
import {
  registerForEvent,
  createProject,
  enterProjectInEvent,
  removeProjectFromEvent,
} from "@/app/event/[slug]/actions";

// --- Constants & helpers ---

const TEST_PREFIX = "test_action_";

function testClerkId() {
  return `${TEST_PREFIX}${crypto.randomUUID()}`;
}

function buildProjectFormData(
  overrides: Partial<{ name: string; description: string; githubUrl: string }> = {}
) {
  const fd = new FormData();
  fd.set("name", overrides.name ?? "Test Project");
  if (overrides.description !== undefined) fd.set("description", overrides.description);
  if (overrides.githubUrl !== undefined) fd.set("githubUrl", overrides.githubUrl);
  return fd;
}

// --- Shared state ---

let testClerk: string;
let testEventId: string;
let testEventSlug: string;
let testProfileId: string;

// Track all created IDs for cleanup
const createdEventIds: string[] = [];
const createdProjectIds: string[] = [];

async function createTestEvent(
  overrides: Partial<{
    name: string;
    slug: string;
    status: "draft" | "open" | "active" | "judging" | "complete";
    registrationOpensAt: Date | null;
    registrationClosesAt: Date | null;
  }> = {}
) {
  const slug = overrides.slug ?? `${TEST_PREFIX}${crypto.randomUUID()}`;
  const [event] = await db
    .insert(events)
    .values({
      name: overrides.name ?? "Test Event",
      slug,
      description: "A test event",
      startsAt: new Date("2026-03-01"),
      endsAt: new Date("2026-03-08"),
      registrationOpensAt: overrides.registrationOpensAt ?? new Date("2025-01-01"),
      registrationClosesAt: overrides.registrationClosesAt ?? new Date("2027-12-31"),
      status: overrides.status ?? "open",
    })
    .returning();
  createdEventIds.push(event.id);
  return event;
}

// --- Setup / Teardown ---

beforeAll(async () => {
  testClerk = testClerkId();

  // Create test profile via ensureProfile (uses mocked clerkClient)
  const { ensureProfile } = await import("@/lib/db/ensure-profile");
  const profile = await ensureProfile(testClerk);
  testProfileId = profile!.id;

  // Create a default open event
  const event = await createTestEvent();
  testEventId = event.id;
  testEventSlug = event.slug;
});

beforeEach(() => {
  mockAuth.mockReset();
  mockAuth.mockResolvedValue({ userId: testClerk });
  mockCaptureException.mockReset();
});

afterAll(async () => {
  // Delete in FK order
  for (const eid of createdEventIds) {
    await db.delete(eventProjects).where(eq(eventProjects.eventId, eid));
    await db.delete(eventRegistrations).where(eq(eventRegistrations.eventId, eid));
  }
  for (const pid of createdProjectIds) {
    await db.delete(eventProjects).where(eq(eventProjects.projectId, pid));
    await db.delete(projects).where(eq(projects.id, pid));
  }
  for (const eid of createdEventIds) {
    await db.delete(events).where(eq(events.id, eid));
  }
  await db.delete(profiles).where(like(profiles.clerkId, `${TEST_PREFIX}%`));
});

// ========================================================================
// registerForEvent
// ========================================================================

describe("registerForEvent", () => {
  it("registers successfully for an open event", async () => {
    const result = await registerForEvent(testEventId, "solo");
    expect(result).toEqual({ success: true });

    const reg = await db.query.eventRegistrations.findFirst({
      where: and(
        eq(eventRegistrations.eventId, testEventId),
        eq(eventRegistrations.profileId, testProfileId)
      ),
    });
    expect(reg).toBeDefined();
    expect(reg!.teamPreference).toBe("solo");
  });

  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const result = await registerForEvent(testEventId, "solo");
    expect(result.success).toBe(false);
    expect(mockCaptureException).toHaveBeenCalled();
  });

  it("returns error for non-existent event", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const result = await registerForEvent(fakeId, "solo");
    expect(result).toEqual({ success: false, error: "Event not found" });
  });

  it("returns error when event status is draft", async () => {
    const draftEvent = await createTestEvent({ status: "draft" });
    const result = await registerForEvent(draftEvent.id, "solo");
    expect(result).toEqual({
      success: false,
      error: "Event is not accepting registrations",
    });
  });

  it("returns error when registration has closed", async () => {
    const closedEvent = await createTestEvent({
      registrationClosesAt: new Date("2020-01-01"),
    });
    const result = await registerForEvent(closedEvent.id, "solo");
    expect(result).toEqual({ success: false, error: "Registration has closed" });
  });

  it("returns error when registration has not opened yet", async () => {
    const futureEvent = await createTestEvent({
      registrationOpensAt: new Date("2099-01-01"),
    });
    const result = await registerForEvent(futureEvent.id, "solo");
    expect(result).toEqual({
      success: false,
      error: "Registration has not opened yet",
    });
  });

  it("handles duplicate registration idempotently", async () => {
    // First registration already happened in the first test
    const result = await registerForEvent(testEventId, "looking_for_team");
    expect(result).toEqual({ success: true });
  });
});

// ========================================================================
// createProject
// ========================================================================

describe("createProject", () => {
  it("creates project and auto-enters in event", async () => {
    const fd = buildProjectFormData({
      name: "My Cool Project",
      description: "A test project",
      githubUrl: "https://github.com/test/repo",
    });
    const result = await createProject(fd, testEventId);
    expect(result).toEqual({ success: true });

    // Verify project was created
    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.profileId, testProfileId),
        eq(projects.name, "My Cool Project")
      ),
    });
    expect(project).toBeDefined();
    createdProjectIds.push(project!.id);

    // Verify it was entered in the event
    const ep = await db.query.eventProjects.findFirst({
      where: and(
        eq(eventProjects.eventId, testEventId),
        eq(eventProjects.projectId, project!.id)
      ),
    });
    expect(ep).toBeDefined();
  });

  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const fd = buildProjectFormData();
    const result = await createProject(fd, testEventId);
    expect(result.success).toBe(false);
    expect(mockCaptureException).toHaveBeenCalled();
  });

  it("returns error when not registered for event", async () => {
    // Create a different user who isn't registered
    const otherClerk = testClerkId();
    mockAuth.mockResolvedValue({ userId: otherClerk });
    const fd = buildProjectFormData();
    const result = await createProject(fd, testEventId);
    expect(result.success).toBe(false);
  });

  it("returns error when project name is empty", async () => {
    const fd = buildProjectFormData({ name: "" });
    const result = await createProject(fd, testEventId);
    expect(result).toEqual({ success: false, error: "Project name is required" });
  });

  it("returns error when project name is whitespace", async () => {
    const fd = buildProjectFormData({ name: "   " });
    const result = await createProject(fd, testEventId);
    expect(result).toEqual({ success: false, error: "Project name is required" });
  });

  it("sanitizes invalid GitHub URL to null", async () => {
    const fd = buildProjectFormData({
      name: "URL Test Project",
      githubUrl: "not-a-url",
    });
    const result = await createProject(fd, testEventId);
    expect(result).toEqual({ success: true });

    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.profileId, testProfileId),
        eq(projects.name, "URL Test Project")
      ),
    });
    expect(project).toBeDefined();
    expect(project!.githubUrl).toBeNull();
    createdProjectIds.push(project!.id);
  });

  it("rejects javascript: URL scheme (stores null)", async () => {
    const fd = buildProjectFormData({
      name: "XSS Test Project",
      githubUrl: "javascript:alert(1)",
    });
    const result = await createProject(fd, testEventId);
    expect(result).toEqual({ success: true });

    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.profileId, testProfileId),
        eq(projects.name, "XSS Test Project")
      ),
    });
    expect(project).toBeDefined();
    expect(project!.githubUrl).toBeNull();
    createdProjectIds.push(project!.id);
  });
});

// ========================================================================
// enterProjectInEvent
// ========================================================================

describe("enterProjectInEvent", () => {
  let ownedProjectId: string;

  beforeAll(async () => {
    // Create a standalone project for this describe block
    const [project] = await db
      .insert(projects)
      .values({
        profileId: testProfileId,
        name: `${TEST_PREFIX}enter_test_project`,
      })
      .returning();
    ownedProjectId = project.id;
    createdProjectIds.push(ownedProjectId);
  });

  it("enters an owned project in the event", async () => {
    const result = await enterProjectInEvent(testEventId, ownedProjectId);
    expect(result).toEqual({ success: true });

    const ep = await db.query.eventProjects.findFirst({
      where: and(
        eq(eventProjects.eventId, testEventId),
        eq(eventProjects.projectId, ownedProjectId)
      ),
    });
    expect(ep).toBeDefined();
  });

  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const result = await enterProjectInEvent(testEventId, ownedProjectId);
    expect(result.success).toBe(false);
    expect(mockCaptureException).toHaveBeenCalled();
  });

  it("returns error when user doesn't own the project", async () => {
    const otherClerk = testClerkId();
    mockAuth.mockResolvedValue({ userId: otherClerk });
    // This user exists (ensureProfile will create) but doesn't own the project

    // First register this user for the event so we don't hit the registration check
    const { ensureProfile } = await import("@/lib/db/ensure-profile");
    const otherProfile = await ensureProfile(otherClerk);
    await db
      .insert(eventRegistrations)
      .values({
        eventId: testEventId,
        profileId: otherProfile!.id,
        teamPreference: "solo",
      })
      .onConflictDoNothing();

    const result = await enterProjectInEvent(testEventId, ownedProjectId);
    expect(result).toEqual({ success: false, error: "Project not found" });
  });

  it("returns error when not registered for event", async () => {
    // Create a new event and don't register
    const newEvent = await createTestEvent();
    const result = await enterProjectInEvent(newEvent.id, ownedProjectId);
    expect(result.success).toBe(false);
  });

  it("handles duplicate entry idempotently", async () => {
    // Project was already entered in the first test
    const result = await enterProjectInEvent(testEventId, ownedProjectId);
    expect(result).toEqual({ success: true });
  });
});

// ========================================================================
// removeProjectFromEvent
// ========================================================================

describe("removeProjectFromEvent", () => {
  let removeProjectId: string;

  beforeAll(async () => {
    // Create a project and enter it in the event
    const [project] = await db
      .insert(projects)
      .values({
        profileId: testProfileId,
        name: `${TEST_PREFIX}remove_test_project`,
      })
      .returning();
    removeProjectId = project.id;
    createdProjectIds.push(removeProjectId);

    await db
      .insert(eventProjects)
      .values({ eventId: testEventId, projectId: removeProjectId })
      .onConflictDoNothing();
  });

  it("removes a project from the event", async () => {
    const result = await removeProjectFromEvent(testEventId, removeProjectId);
    expect(result).toEqual({ success: true });

    const ep = await db.query.eventProjects.findFirst({
      where: and(
        eq(eventProjects.eventId, testEventId),
        eq(eventProjects.projectId, removeProjectId)
      ),
    });
    expect(ep).toBeUndefined();
  });

  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const result = await removeProjectFromEvent(testEventId, removeProjectId);
    expect(result.success).toBe(false);
    expect(mockCaptureException).toHaveBeenCalled();
  });

  it("returns error when user doesn't own the project", async () => {
    const otherClerk = testClerkId();
    mockAuth.mockResolvedValue({ userId: otherClerk });

    const result = await removeProjectFromEvent(testEventId, removeProjectId);
    expect(result.success).toBe(false);
  });

  it("succeeds as no-op when project wasn't in event", async () => {
    // removeProjectId was already removed in the first test
    const result = await removeProjectFromEvent(testEventId, removeProjectId);
    expect(result).toEqual({ success: true });
  });
});
