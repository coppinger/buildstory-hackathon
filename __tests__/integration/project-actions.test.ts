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
import {
  events,
  profiles,
  projects,
  eventProjects,
  eventRegistrations,
  projectMembers,
  teamInvites,
} from "@/lib/db/schema";
import { eq, like, and, inArray } from "drizzle-orm";

// --- Mocks ---

const mockAuth = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
  clerkClient: () =>
    Promise.resolve({
      users: {
        getUser: () =>
          Promise.resolve({
            firstName: "Project",
            lastName: "Tester",
            username: "projecttester",
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

// Import actions AFTER mocks
import {
  createProject,
  updateProject,
  deleteProject,
} from "@/app/(app)/projects/actions";

// --- Constants & helpers ---

const TEST_PREFIX = "test_proj_";

function testClerkId() {
  return `${TEST_PREFIX}${crypto.randomUUID()}`;
}

// --- Shared state ---

let testClerk: string;
let testProfileId: string;
let otherClerk: string;
let otherProfileId: string;
let testEventId: string;

const createdProjectIds: string[] = [];
const createdEventIds: string[] = [];

function buildProjectData(
  overrides: Partial<{
    name: string;
    slug: string;
    description: string;
    startingPoint: "new" | "existing";
    goalText: string;
    repoUrl: string;
    liveUrl: string;
    eventId: string;
  }> = {}
) {
  return {
    name: overrides.name ?? "Test Project",
    slug:
      overrides.slug ??
      `${TEST_PREFIX}proj-${crypto.randomUUID().slice(0, 8)}`,
    description: overrides.description ?? "A test project",
    startingPoint: overrides.startingPoint ?? "new",
    goalText: overrides.goalText ?? "Ship it",
    repoUrl: overrides.repoUrl ?? "",
    liveUrl: overrides.liveUrl ?? "",
    eventId: overrides.eventId,
  };
}

// --- Setup / Teardown ---

beforeAll(async () => {
  const { ensureProfile } = await import("@/lib/db/ensure-profile");

  testClerk = testClerkId();
  const profile = await ensureProfile(testClerk);
  testProfileId = profile!.id;

  otherClerk = testClerkId();
  const otherProfile = await ensureProfile(otherClerk);
  otherProfileId = otherProfile!.id;

  // Create a test event
  const [event] = await db
    .insert(events)
    .values({
      name: "Project Test Event",
      slug: `${TEST_PREFIX}event-${crypto.randomUUID().slice(0, 8)}`,
      description: "Event for project tests",
      startsAt: new Date("2026-03-01"),
      endsAt: new Date("2026-03-08"),
      registrationOpensAt: new Date("2025-01-01"),
      registrationClosesAt: new Date("2027-12-31"),
      status: "open",
    })
    .returning();
  testEventId = event.id;
  createdEventIds.push(event.id);
});

beforeEach(() => {
  mockAuth.mockReset();
  mockAuth.mockResolvedValue({ userId: testClerk });
  mockCaptureException.mockReset();
});

afterAll(async () => {
  // Delete tracked resources in FK order
  for (const pid of createdProjectIds) {
    await db.delete(projectMembers).where(eq(projectMembers.projectId, pid));
    await db.delete(teamInvites).where(eq(teamInvites.projectId, pid));
    await db.delete(eventProjects).where(eq(eventProjects.projectId, pid));
    await db.delete(projects).where(eq(projects.id, pid));
  }
  for (const eid of createdEventIds) {
    await db.delete(eventRegistrations).where(eq(eventRegistrations.eventId, eid));
    await db.delete(eventProjects).where(eq(eventProjects.eventId, eid));
    await db.delete(events).where(eq(events.id, eid));
  }
  // Catch-all: clean up all FK references to test profiles (handles untracked resources)
  const testProfiles = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(like(profiles.clerkId, `${TEST_PREFIX}%`));
  const profileIds = testProfiles.map((p) => p.id);
  if (profileIds.length > 0) {
    const ownedProjects = await db
      .select({ id: projects.id })
      .from(projects)
      .where(inArray(projects.profileId, profileIds));
    const ownedProjectIds = ownedProjects.map((p) => p.id);
    if (ownedProjectIds.length > 0) {
      await db.delete(projectMembers).where(inArray(projectMembers.projectId, ownedProjectIds));
      await db.delete(teamInvites).where(inArray(teamInvites.projectId, ownedProjectIds));
      await db.delete(eventProjects).where(inArray(eventProjects.projectId, ownedProjectIds));
      await db.delete(projects).where(inArray(projects.id, ownedProjectIds));
    }
    await db.delete(eventRegistrations).where(inArray(eventRegistrations.profileId, profileIds));
  }
  await db.delete(profiles).where(like(profiles.clerkId, `${TEST_PREFIX}%`));
});

// ========================================================================
// createProject
// ========================================================================

describe("createProject", () => {
  it("creates project successfully", async () => {
    const data = buildProjectData({
      name: "My New Project",
      repoUrl: "https://github.com/test/repo",
      liveUrl: "https://example.com",
    });
    const result = await createProject(data);
    expect(result.success).toBe(true);

    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.profileId, testProfileId),
        eq(projects.name, "My New Project")
      ),
    });
    expect(project).toBeDefined();
    expect(project!.githubUrl).toBe("https://github.com/test/repo");
    expect(project!.liveUrl).toBe("https://example.com/");
    createdProjectIds.push(project!.id);
  });

  it("links project to event when eventId provided", async () => {
    const data = buildProjectData({
      name: "Event-Linked Project",
      eventId: testEventId,
    });
    const result = await createProject(data);
    expect(result.success).toBe(true);

    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.profileId, testProfileId),
        eq(projects.name, "Event-Linked Project")
      ),
    });
    expect(project).toBeDefined();
    createdProjectIds.push(project!.id);

    const ep = await db.query.eventProjects.findFirst({
      where: and(
        eq(eventProjects.eventId, testEventId),
        eq(eventProjects.projectId, project!.id)
      ),
    });
    expect(ep).toBeDefined();
  });

  it("creates project without event link", async () => {
    const data = buildProjectData({ name: "Solo Project" });
    const result = await createProject(data);
    expect(result.success).toBe(true);

    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.profileId, testProfileId),
        eq(projects.name, "Solo Project")
      ),
    });
    expect(project).toBeDefined();
    createdProjectIds.push(project!.id);
  });

  it("returns error for empty name", async () => {
    const data = buildProjectData({ name: "" });
    const result = await createProject(data);
    expect(result).toEqual({ success: false, error: "Project name is required" });
  });

  it("returns error for whitespace-only name", async () => {
    const data = buildProjectData({ name: "   " });
    const result = await createProject(data);
    expect(result).toEqual({ success: false, error: "Project name is required" });
  });

  it("returns error for empty description", async () => {
    const data = buildProjectData({ description: "" });
    const result = await createProject(data);
    expect(result).toEqual({
      success: false,
      error: "Description is required",
    });
  });

  it("sanitizes invalid URL to null", async () => {
    const data = buildProjectData({
      name: "Bad URL Project",
      repoUrl: "not-a-url",
    });
    const result = await createProject(data);
    expect(result.success).toBe(true);

    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.profileId, testProfileId),
        eq(projects.name, "Bad URL Project")
      ),
    });
    expect(project).toBeDefined();
    expect(project!.githubUrl).toBeNull();
    createdProjectIds.push(project!.id);
  });

  it("sanitizes javascript: URL to null", async () => {
    const data = buildProjectData({
      name: "XSS Project",
      repoUrl: "javascript:alert(1)",
    });
    const result = await createProject(data);
    expect(result.success).toBe(true);

    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.profileId, testProfileId),
        eq(projects.name, "XSS Project")
      ),
    });
    expect(project).toBeDefined();
    expect(project!.githubUrl).toBeNull();
    createdProjectIds.push(project!.id);
  });

  it("sanitizes liveUrl the same way", async () => {
    const data = buildProjectData({
      name: "Bad Live URL Project",
      liveUrl: "ftp://bad.com",
    });
    const result = await createProject(data);
    expect(result.success).toBe(true);

    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.profileId, testProfileId),
        eq(projects.name, "Bad Live URL Project")
      ),
    });
    expect(project).toBeDefined();
    expect(project!.liveUrl).toBeNull();
    createdProjectIds.push(project!.id);
  });

  it("stores null for empty slug", async () => {
    const data = buildProjectData({ name: "No Slug Project", slug: "" });
    const result = await createProject(data);
    expect(result.success).toBe(true);

    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.profileId, testProfileId),
        eq(projects.name, "No Slug Project")
      ),
    });
    expect(project).toBeDefined();
    expect(project!.slug).toBeNull();
    createdProjectIds.push(project!.id);
  });

  it("returns error for duplicate slug", async () => {
    const sharedSlug = `${TEST_PREFIX}dup-${crypto.randomUUID().slice(0, 6)}`;

    const data1 = buildProjectData({ name: "First Dup", slug: sharedSlug });
    const result1 = await createProject(data1);
    expect(result1.success).toBe(true);

    const project1 = await db.query.projects.findFirst({
      where: eq(projects.slug, sharedSlug),
    });
    createdProjectIds.push(project1!.id);

    const data2 = buildProjectData({ name: "Second Dup", slug: sharedSlug });
    const result2 = await createProject(data2);
    expect(result2).toEqual({
      success: false,
      error: "Project URL is already taken",
    });
  });

  it("returns error when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const data = buildProjectData();
    const result = await createProject(data);
    expect(result.success).toBe(false);
    expect(mockCaptureException).toHaveBeenCalled();
  });
});

// ========================================================================
// updateProject
// ========================================================================

describe("updateProject", () => {
  let ownedProjectId: string;
  let ownedProjectSlug: string;

  beforeAll(async () => {
    const slug = `${TEST_PREFIX}upd-${crypto.randomUUID().slice(0, 8)}`;
    const [project] = await db
      .insert(projects)
      .values({
        profileId: testProfileId,
        name: "Updatable Project",
        slug,
        description: "Will be updated",
      })
      .returning();
    ownedProjectId = project.id;
    ownedProjectSlug = slug;
    createdProjectIds.push(project.id);
  });

  function buildUpdateData(
    overrides: Partial<{
      projectId: string;
      name: string;
      slug: string;
      description: string;
      startingPoint: "new" | "existing";
      goalText: string;
      repoUrl: string;
      liveUrl: string;
    }> = {}
  ) {
    return {
      projectId: overrides.projectId ?? ownedProjectId,
      name: overrides.name ?? "Updated Project",
      slug: overrides.slug ?? ownedProjectSlug,
      description: overrides.description ?? "Updated description",
      startingPoint: overrides.startingPoint ?? "new",
      goalText: overrides.goalText ?? "Updated goal",
      repoUrl: overrides.repoUrl ?? "",
      liveUrl: overrides.liveUrl ?? "",
    };
  }

  it("updates project successfully", async () => {
    const data = buildUpdateData({
      name: "Renamed Project",
      description: "New desc",
    });
    const result = await updateProject(data);
    expect(result.success).toBe(true);

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, ownedProjectId),
    });
    expect(project!.name).toBe("Renamed Project");
    expect(project!.description).toBe("New desc");
  });

  it("returns error for non-existent project", async () => {
    const data = buildUpdateData({
      projectId: "00000000-0000-0000-0000-000000000000",
    });
    const result = await updateProject(data);
    expect(result).toEqual({ success: false, error: "Project not found" });
  });

  it("returns error when user does not own project", async () => {
    // Create a project owned by another user
    const [otherProject] = await db
      .insert(projects)
      .values({
        profileId: otherProfileId,
        name: "Other User Project",
        description: "Not yours",
      })
      .returning();
    createdProjectIds.push(otherProject.id);

    const data = buildUpdateData({ projectId: otherProject.id });
    const result = await updateProject(data);
    expect(result).toEqual({
      success: false,
      error: "You do not own this project",
    });
  });

  it("returns error for empty name", async () => {
    const data = buildUpdateData({ name: "" });
    const result = await updateProject(data);
    expect(result).toEqual({
      success: false,
      error: "Project name is required",
    });
  });

  it("returns error for empty description", async () => {
    const data = buildUpdateData({ description: "" });
    const result = await updateProject(data);
    expect(result).toEqual({
      success: false,
      error: "Description is required",
    });
  });

  it("returns error for duplicate slug", async () => {
    const otherSlug = `${TEST_PREFIX}other-${crypto.randomUUID().slice(0, 6)}`;
    const [otherProject] = await db
      .insert(projects)
      .values({
        profileId: testProfileId,
        name: "Other Slug Project",
        slug: otherSlug,
        description: "Has a unique slug",
      })
      .returning();
    createdProjectIds.push(otherProject.id);

    const data = buildUpdateData({ slug: otherSlug });
    const result = await updateProject(data);
    expect(result).toEqual({
      success: false,
      error: "Project URL is already taken",
    });
  });

  it("sanitizes URLs on update", async () => {
    const data = buildUpdateData({
      repoUrl: "javascript:alert(1)",
      liveUrl: "ftp://bad",
    });
    const result = await updateProject(data);
    expect(result.success).toBe(true);

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, ownedProjectId),
    });
    expect(project!.githubUrl).toBeNull();
    expect(project!.liveUrl).toBeNull();
  });

  it("returns error when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const data = buildUpdateData();
    const result = await updateProject(data);
    expect(result.success).toBe(false);
    expect(mockCaptureException).toHaveBeenCalled();
  });
});

// ========================================================================
// deleteProject
// ========================================================================

describe("deleteProject", () => {
  it("fails with transaction error on neon-http driver", async () => {
    // NOTE: deleteProject uses db.transaction() which is not supported by the
    // Neon HTTP adapter. This test documents the current behavior. If the driver
    // or code is updated to support transactions, this test should be updated.
    const [project] = await db
      .insert(projects)
      .values({
        profileId: testProfileId,
        name: "Deletable Project",
        description: "Will be deleted",
      })
      .returning();
    createdProjectIds.push(project.id);

    const result = await deleteProject({ projectId: project.id });
    // Transaction not supported on neon-http → caught by Sentry, returns error
    expect(result.success).toBe(false);
    expect(mockCaptureException).toHaveBeenCalled();
  });

  it("returns error for non-existent project", async () => {
    const result = await deleteProject({
      projectId: "00000000-0000-0000-0000-000000000000",
    });
    expect(result).toEqual({ success: false, error: "Project not found" });
  });

  it("returns error when user does not own project", async () => {
    const [otherProject] = await db
      .insert(projects)
      .values({
        profileId: otherProfileId,
        name: "Not Mine To Delete",
        description: "Owned by someone else",
      })
      .returning();
    createdProjectIds.push(otherProject.id);

    const result = await deleteProject({ projectId: otherProject.id });
    expect(result).toEqual({
      success: false,
      error: "You do not own this project",
    });
  });

  it("returns error when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const result = await deleteProject({
      projectId: "00000000-0000-0000-0000-000000000000",
    });
    expect(result.success).toBe(false);
    expect(mockCaptureException).toHaveBeenCalled();
  });
});
