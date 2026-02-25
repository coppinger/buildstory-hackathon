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
            firstName: "Onboard",
            lastName: "Tester",
            username: "onboardtester",
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

// Import actions AFTER mocks are set up
import {
  completeRegistration,
  createOnboardingProject,
  checkUsernameAvailability,
  checkProjectSlugAvailability,
  searchUsers,
  searchProjects,
} from "@/app/(onboarding)/hackathon/actions";

// --- Constants & helpers ---

const TEST_PREFIX = "test_onboard_";

function testClerkId() {
  return `${TEST_PREFIX}${crypto.randomUUID()}`;
}

// --- Shared state ---

let testClerk: string;
let testEventId: string;
let testProfileId: string;

// Track all created IDs for cleanup
const createdEventIds: string[] = [];
const createdProjectIds: string[] = [];

async function createTestEvent(
  overrides: Partial<{
    name: string;
    slug: string;
    status: "draft" | "open" | "active" | "judging" | "complete";
  }> = {}
) {
  const slug = overrides.slug ?? `${TEST_PREFIX}${crypto.randomUUID()}`;
  const [event] = await db
    .insert(events)
    .values({
      name: overrides.name ?? "Onboard Test Event",
      slug,
      description: "An onboarding test event",
      startsAt: new Date("2026-03-01"),
      endsAt: new Date("2026-03-08"),
      registrationOpensAt: new Date("2025-01-01"),
      registrationClosesAt: new Date("2027-12-31"),
      status: overrides.status ?? "open",
    })
    .returning();
  createdEventIds.push(event.id);
  return event;
}

// --- Setup / Teardown ---

beforeAll(async () => {
  testClerk = testClerkId();

  const { ensureProfile } = await import("@/lib/db/ensure-profile");
  const profile = await ensureProfile(testClerk);
  testProfileId = profile!.id;

  const event = await createTestEvent();
  testEventId = event.id;
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
// completeRegistration
// ========================================================================

describe("completeRegistration", () => {
  function buildRegistrationData(
    overrides: Partial<{
      displayName: string;
      username: string;
      experienceLevel: "getting_started" | "built_a_few" | "ships_constantly";
      teamPreference: "solo" | "has_team" | "has_team_open" | "looking_for_team";
      eventId: string;
    }> = {}
  ) {
    return {
      displayName: overrides.displayName ?? "Test Builder",
      username: overrides.username ?? `${TEST_PREFIX}user${crypto.randomUUID().slice(0, 8)}`,
      experienceLevel: overrides.experienceLevel ?? "built_a_few",
      teamPreference: overrides.teamPreference ?? "solo",
      eventId: overrides.eventId ?? testEventId,
    };
  }

  it("registers successfully for an open event", async () => {
    const data = buildRegistrationData();
    const result = await completeRegistration(data);
    expect(result).toEqual({ success: true });

    // Verify profile was updated
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, testProfileId),
    });
    expect(profile!.displayName).toBe(data.displayName);
    expect(profile!.username).toBe(data.username.trim().toLowerCase());
    expect(profile!.experienceLevel).toBe("built_a_few");

    // Verify registration was created
    const reg = await db.query.eventRegistrations.findFirst({
      where: and(
        eq(eventRegistrations.eventId, testEventId),
        eq(eventRegistrations.profileId, testProfileId)
      ),
    });
    expect(reg).toBeDefined();
    expect(reg!.teamPreference).toBe("solo");
  });

  it("returns error for invalid username format", async () => {
    const data = buildRegistrationData({ username: "x" }); // too short
    const result = await completeRegistration(data);
    expect(result).toEqual({ success: false, error: "Invalid username format" });
  });

  it("returns error for username with special characters", async () => {
    const data = buildRegistrationData({ username: "bad@user!name" });
    const result = await completeRegistration(data);
    expect(result).toEqual({ success: false, error: "Invalid username format" });
  });

  it("returns error for empty display name", async () => {
    const data = buildRegistrationData({ displayName: "   " });
    const result = await completeRegistration(data);
    expect(result).toEqual({ success: false, error: "Display name is required" });
  });

  it("returns error for non-existent event", async () => {
    const data = buildRegistrationData({
      eventId: "00000000-0000-0000-0000-000000000000",
    });
    const result = await completeRegistration(data);
    expect(result).toEqual({ success: false, error: "Event not found" });
  });

  it("returns error when event is not open or active", async () => {
    const draftEvent = await createTestEvent({ status: "draft" });
    const data = buildRegistrationData({ eventId: draftEvent.id });
    const result = await completeRegistration(data);
    expect(result).toEqual({
      success: false,
      error: "Event is not accepting registrations",
    });
  });

  it("returns error for username already taken", async () => {
    // Create another user with a known username
    const otherClerk = testClerkId();
    const takenUsername = `${TEST_PREFIX}taken${crypto.randomUUID().slice(0, 6)}`;
    const { ensureProfile } = await import("@/lib/db/ensure-profile");
    const otherProfile = await ensureProfile(otherClerk);
    await db
      .update(profiles)
      .set({ username: takenUsername })
      .where(eq(profiles.id, otherProfile!.id));

    // Try to register with the same username
    const data = buildRegistrationData({ username: takenUsername });
    const result = await completeRegistration(data);
    expect(result).toEqual({ success: false, error: "Username is already taken" });
  });

  it("returns error when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const data = buildRegistrationData();
    const result = await completeRegistration(data);
    expect(result.success).toBe(false);
    expect(mockCaptureException).toHaveBeenCalled();
  });

  it("handles duplicate registration idempotently", async () => {
    // First registration happened in the first test; calling again should not error
    const data = buildRegistrationData({ teamPreference: "looking_for_team" });
    const result = await completeRegistration(data);
    expect(result).toEqual({ success: true });
  });
});

// ========================================================================
// createOnboardingProject
// ========================================================================

describe("createOnboardingProject", () => {
  // Ensure the test user is registered for the event before project tests
  beforeAll(async () => {
    await db
      .insert(eventRegistrations)
      .values({
        eventId: testEventId,
        profileId: testProfileId,
        teamPreference: "solo",
      })
      .onConflictDoNothing();
  });

  function buildProjectData(
    overrides: Partial<{
      name: string;
      slug: string;
      description: string;
      startingPoint: "new" | "existing";
      goalText: string;
      repoUrl: string;
      eventId: string;
    }> = {}
  ) {
    return {
      name: overrides.name ?? "Test Onboarding Project",
      slug: overrides.slug ?? `${TEST_PREFIX}proj-${crypto.randomUUID().slice(0, 8)}`,
      description: overrides.description ?? "A project for testing",
      startingPoint: overrides.startingPoint ?? "new",
      goalText: overrides.goalText ?? "Ship it",
      repoUrl: overrides.repoUrl ?? "",
      eventId: overrides.eventId ?? testEventId,
    };
  }

  it("creates project and links to event", async () => {
    const data = buildProjectData({
      name: "My Onboarding Project",
      repoUrl: "https://github.com/test/repo",
    });
    const result = await createOnboardingProject(data);
    expect(result).toEqual({ success: true });

    // Verify project was created
    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.profileId, testProfileId),
        eq(projects.name, "My Onboarding Project")
      ),
    });
    expect(project).toBeDefined();
    expect(project!.githubUrl).toBe("https://github.com/test/repo");
    expect(project!.startingPoint).toBe("new");
    createdProjectIds.push(project!.id);

    // Verify linked to event
    const ep = await db.query.eventProjects.findFirst({
      where: and(
        eq(eventProjects.eventId, testEventId),
        eq(eventProjects.projectId, project!.id)
      ),
    });
    expect(ep).toBeDefined();
  });

  it("returns error for empty project name", async () => {
    const data = buildProjectData({ name: "" });
    const result = await createOnboardingProject(data);
    expect(result).toEqual({ success: false, error: "Project name is required" });
  });

  it("returns error for whitespace-only project name", async () => {
    const data = buildProjectData({ name: "   " });
    const result = await createOnboardingProject(data);
    expect(result).toEqual({ success: false, error: "Project name is required" });
  });

  it("returns error for empty description", async () => {
    const data = buildProjectData({ description: "" });
    const result = await createOnboardingProject(data);
    expect(result).toEqual({ success: false, error: "Description is required" });
  });

  it("sanitizes javascript: URL to null (XSS prevention)", async () => {
    const data = buildProjectData({
      name: "XSS Test Onboarding",
      repoUrl: "javascript:alert(1)",
    });
    const result = await createOnboardingProject(data);
    expect(result).toEqual({ success: true });

    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.profileId, testProfileId),
        eq(projects.name, "XSS Test Onboarding")
      ),
    });
    expect(project).toBeDefined();
    expect(project!.githubUrl).toBeNull();
    createdProjectIds.push(project!.id);
  });

  it("sanitizes invalid URL to null", async () => {
    const data = buildProjectData({
      name: "Bad URL Onboarding",
      repoUrl: "not-a-url",
    });
    const result = await createOnboardingProject(data);
    expect(result).toEqual({ success: true });

    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.profileId, testProfileId),
        eq(projects.name, "Bad URL Onboarding")
      ),
    });
    expect(project).toBeDefined();
    expect(project!.githubUrl).toBeNull();
    createdProjectIds.push(project!.id);
  });

  it("preserves valid https URL", async () => {
    const data = buildProjectData({
      name: "Good URL Onboarding",
      repoUrl: "https://github.com/cool/project",
    });
    const result = await createOnboardingProject(data);
    expect(result).toEqual({ success: true });

    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.profileId, testProfileId),
        eq(projects.name, "Good URL Onboarding")
      ),
    });
    expect(project).toBeDefined();
    expect(project!.githubUrl).toBe("https://github.com/cool/project");
    createdProjectIds.push(project!.id);
  });

  it("stores null for empty repoUrl and goalText", async () => {
    const data = buildProjectData({
      name: "Minimal Onboarding Project",
      repoUrl: "",
      goalText: "",
    });
    const result = await createOnboardingProject(data);
    expect(result).toEqual({ success: true });

    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.profileId, testProfileId),
        eq(projects.name, "Minimal Onboarding Project")
      ),
    });
    expect(project).toBeDefined();
    expect(project!.githubUrl).toBeNull();
    expect(project!.goalText).toBeNull();
    createdProjectIds.push(project!.id);
  });

  it("returns error for duplicate slug", async () => {
    const sharedSlug = `${TEST_PREFIX}dupslug-${crypto.randomUUID().slice(0, 6)}`;

    // Create first project with the slug
    const data1 = buildProjectData({
      name: "First Slug Project",
      slug: sharedSlug,
    });
    const result1 = await createOnboardingProject(data1);
    expect(result1).toEqual({ success: true });

    const project1 = await db.query.projects.findFirst({
      where: eq(projects.slug, sharedSlug),
    });
    createdProjectIds.push(project1!.id);

    // Try second project with the same slug
    const data2 = buildProjectData({
      name: "Second Slug Project",
      slug: sharedSlug,
    });
    const result2 = await createOnboardingProject(data2);
    expect(result2).toEqual({ success: false, error: "Project URL is already taken" });
  });

  it("returns error when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const data = buildProjectData();
    const result = await createOnboardingProject(data);
    expect(result.success).toBe(false);
    expect(mockCaptureException).toHaveBeenCalled();
  });
});

// ========================================================================
// checkUsernameAvailability
// ========================================================================

describe("checkUsernameAvailability", () => {
  it("returns available for a fresh username", async () => {
    const result = await checkUsernameAvailability(
      `${TEST_PREFIX}avail${crypto.randomUUID().slice(0, 6)}`
    );
    expect(result).toEqual({ success: true, data: { available: true } });
  });

  it("returns unavailable for a taken username", async () => {
    // Set a known username on the test profile
    const knownUsername = `${TEST_PREFIX}known${crypto.randomUUID().slice(0, 6)}`;
    await db
      .update(profiles)
      .set({ username: knownUsername })
      .where(eq(profiles.id, testProfileId));

    const result = await checkUsernameAvailability(knownUsername);
    expect(result).toEqual({ success: true, data: { available: false } });
  });

  it("returns unavailable for invalid format (too short)", async () => {
    const result = await checkUsernameAvailability("a");
    expect(result).toEqual({ success: true, data: { available: false } });
  });

  it("returns unavailable for invalid format (special chars)", async () => {
    const result = await checkUsernameAvailability("user@name!");
    expect(result).toEqual({ success: true, data: { available: false } });
  });
});

// ========================================================================
// checkProjectSlugAvailability
// ========================================================================

describe("checkProjectSlugAvailability", () => {
  it("returns available for a fresh slug", async () => {
    const result = await checkProjectSlugAvailability(
      `${TEST_PREFIX}slug-${crypto.randomUUID().slice(0, 8)}`
    );
    expect(result).toEqual({ success: true, data: { available: true } });
  });

  it("returns unavailable for a taken slug", async () => {
    // Create a project with a known slug
    const knownSlug = `${TEST_PREFIX}taken-slug-${crypto.randomUUID().slice(0, 6)}`;
    const [project] = await db
      .insert(projects)
      .values({
        profileId: testProfileId,
        name: `${TEST_PREFIX}slug_check_project`,
        slug: knownSlug,
      })
      .returning();
    createdProjectIds.push(project.id);

    const result = await checkProjectSlugAvailability(knownSlug);
    expect(result).toEqual({ success: true, data: { available: false } });
  });

  it("returns unavailable for slug that is too short", async () => {
    const result = await checkProjectSlugAvailability("x");
    expect(result).toEqual({ success: true, data: { available: false } });
  });

  it("returns unavailable for empty slug", async () => {
    const result = await checkProjectSlugAvailability("");
    expect(result).toEqual({ success: true, data: { available: false } });
  });
});

// ========================================================================
// searchUsers
// ========================================================================

describe("searchUsers", () => {
  beforeAll(async () => {
    // Set a recognizable display name on the test profile for search
    await db
      .update(profiles)
      .set({ displayName: "OnboardSearchUser" })
      .where(eq(profiles.id, testProfileId));
  });

  it("returns matching results by display name", async () => {
    const result = await searchUsers("OnboardSearch");
    expect(result.success).toBe(true);
    expect(result.success && result.data!.length).toBeGreaterThanOrEqual(1);
    expect(
      result.success && result.data!.some((u) => u.id === testProfileId)
    ).toBe(true);
  });

  it("returns empty array for short query", async () => {
    const result = await searchUsers("a");
    expect(result).toEqual({ success: true, data: [] });
  });

  it("returns error when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const result = await searchUsers("test");
    expect(result.success).toBe(false);
    expect(mockCaptureException).toHaveBeenCalled();
  });
});

// ========================================================================
// searchProjects
// ========================================================================

describe("searchProjects", () => {
  let searchProjectId: string;

  beforeAll(async () => {
    // Create a project with a searchable name
    const [project] = await db
      .insert(projects)
      .values({
        profileId: testProfileId,
        name: `${TEST_PREFIX}SearchableProject`,
        description: "A project for search testing",
      })
      .returning();
    searchProjectId = project.id;
    createdProjectIds.push(searchProjectId);
  });

  it("returns matching results", async () => {
    const result = await searchProjects("SearchableProject");
    expect(result.success).toBe(true);
    expect(result.success && result.data!.length).toBeGreaterThanOrEqual(1);
    expect(
      result.success && result.data!.some((p) => p.id === searchProjectId)
    ).toBe(true);
  });

  it("filters by profileId when provided", async () => {
    // Search with the correct profileId
    const result = await searchProjects("SearchableProject", testProfileId);
    expect(result.success).toBe(true);
    expect(result.success && result.data!.length).toBeGreaterThanOrEqual(1);

    // Search with a bogus profileId
    const result2 = await searchProjects(
      "SearchableProject",
      "00000000-0000-0000-0000-000000000000"
    );
    expect(result2.success).toBe(true);
    expect(result2.success && result2.data!.length).toBe(0);
  });

  it("returns empty array for short query", async () => {
    const result = await searchProjects("a");
    expect(result).toEqual({ success: true, data: [] });
  });

  it("returns error when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const result = await searchProjects("test");
    expect(result.success).toBe(false);
    expect(mockCaptureException).toHaveBeenCalled();
  });
});
