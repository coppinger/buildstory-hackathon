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
  eventSubmissions,
  hackathonReviews,
  posts,
  postComments,
  reactions,
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
  notifySubmission: vi.fn(),
}));

vi.mock("@/lib/milestones", () => ({
  checkSignupMilestone: vi.fn(),
  checkProjectMilestone: vi.fn(),
  checkSubmissionMilestone: vi.fn(),
}));

// Import actions AFTER mocks
import {
  createProject,
  updateProject,
  deleteProject,
} from "@/app/(app)/projects/actions";
import { submitProject } from "@/app/(app)/projects/[slug]/submit/actions";

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

  // Create a test event in "active" status (submissions are open)
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const [event] = await db
    .insert(events)
    .values({
      name: "Project Test Event",
      slug: `${TEST_PREFIX}event-${crypto.randomUUID().slice(0, 8)}`,
      description: "Event for project tests",
      startsAt: yesterday,
      endsAt: nextWeek,
      registrationOpensAt: yesterday,
      registrationClosesAt: nextWeek,
      status: "active",
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
    await db.delete(eventSubmissions).where(eq(eventSubmissions.projectId, pid));
    await db.delete(hackathonReviews).where(eq(hackathonReviews.projectId, pid));
    await db.delete(eventProjects).where(eq(eventProjects.projectId, pid));
    await db.delete(projects).where(eq(projects.id, pid));
  }
  for (const eid of createdEventIds) {
    await db.delete(eventRegistrations).where(eq(eventRegistrations.eventId, eid));
    await db.delete(eventSubmissions).where(eq(eventSubmissions.eventId, eid));
    await db.delete(hackathonReviews).where(eq(hackathonReviews.eventId, eid));
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
      // Posts/comments/reactions referencing these projects are polymorphic
      // (no FK) — clean them up explicitly.
      const orphanPosts = await db
        .select({ id: posts.id })
        .from(posts)
        .where(
          and(
            eq(posts.contextType, "project"),
            inArray(posts.contextId, ownedProjectIds)
          )
        );
      const orphanPostIds = orphanPosts.map((p) => p.id);
      if (orphanPostIds.length > 0) {
        const orphanComments = await db
          .select({ id: postComments.id })
          .from(postComments)
          .where(inArray(postComments.postId, orphanPostIds));
        const orphanCommentIds = orphanComments.map((c) => c.id);
        if (orphanCommentIds.length > 0) {
          await db
            .delete(reactions)
            .where(
              and(
                eq(reactions.targetType, "comment"),
                inArray(reactions.targetId, orphanCommentIds)
              )
            );
        }
        await db
          .delete(reactions)
          .where(
            and(
              eq(reactions.targetType, "post"),
              inArray(reactions.targetId, orphanPostIds)
            )
          );
        await db.delete(postComments).where(inArray(postComments.postId, orphanPostIds));
        await db.delete(posts).where(inArray(posts.id, orphanPostIds));
      }
      await db.delete(projectMembers).where(inArray(projectMembers.projectId, ownedProjectIds));
      await db.delete(teamInvites).where(inArray(teamInvites.projectId, ownedProjectIds));
      await db.delete(eventSubmissions).where(inArray(eventSubmissions.projectId, ownedProjectIds));
      await db.delete(hackathonReviews).where(inArray(hackathonReviews.projectId, ownedProjectIds));
      await db.delete(eventProjects).where(inArray(eventProjects.projectId, ownedProjectIds));
      await db.delete(projects).where(inArray(projects.id, ownedProjectIds));
    }
    // Drop any reactions/posts authored by test profiles outside their own
    // projects (e.g., reactions left on the cleanup target rows above).
    await db.delete(reactions).where(inArray(reactions.profileId, profileIds));
    await db.delete(postComments).where(inArray(postComments.authorId, profileIds));
    await db.delete(posts).where(inArray(posts.authorId, profileIds));
    await db.delete(eventSubmissions).where(inArray(eventSubmissions.profileId, profileIds));
    await db.delete(hackathonReviews).where(inArray(hackathonReviews.reviewerProfileId, profileIds));
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
  it("deletes project and cleans up related rows", async () => {
    const [project] = await db
      .insert(projects)
      .values({
        profileId: testProfileId,
        name: "Deletable Project",
        description: "Will be deleted",
      })
      .returning();

    const result = await deleteProject({ projectId: project.id });
    expect(result.success).toBe(true);

    const deleted = await db.query.projects.findFirst({
      where: eq(projects.id, project.id),
    });
    expect(deleted).toBeUndefined();
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

  it("deletes a submitted+reviewed project and cleans up submissions, reviews, posts, comments, and reactions", async () => {
    // Owner project linked to the test event with a submission, a review by
    // another profile, a post in the project context with a comment, and
    // reactions on both the post and the comment.
    const [project] = await db
      .insert(projects)
      .values({
        profileId: testProfileId,
        name: "Submitted+Reviewed Project",
        description: "Has all the related rows",
      })
      .returning();

    await db
      .insert(eventProjects)
      .values({ eventId: testEventId, projectId: project.id });

    const [submission] = await db
      .insert(eventSubmissions)
      .values({
        eventId: testEventId,
        projectId: project.id,
        profileId: testProfileId,
        whatBuilt: "A thing",
      })
      .returning();

    const [review] = await db
      .insert(hackathonReviews)
      .values({
        eventId: testEventId,
        reviewerProfileId: otherProfileId,
        projectId: project.id,
        feedback: "Nice work",
      })
      .returning();

    const [post] = await db
      .insert(posts)
      .values({
        authorId: testProfileId,
        body: "Update on the project",
        contextType: "project",
        contextId: project.id,
      })
      .returning();

    const [comment] = await db
      .insert(postComments)
      .values({
        postId: post.id,
        authorId: otherProfileId,
        body: "Looks great",
      })
      .returning();

    const [postReaction] = await db
      .insert(reactions)
      .values({
        profileId: otherProfileId,
        targetType: "post",
        targetId: post.id,
        emoji: "fire",
      })
      .returning();

    const [commentReaction] = await db
      .insert(reactions)
      .values({
        profileId: testProfileId,
        targetType: "comment",
        targetId: comment.id,
        emoji: "fire",
      })
      .returning();

    const result = await deleteProject({ projectId: project.id });
    expect(result).toEqual({ success: true });

    const remainingProject = await db.query.projects.findFirst({
      where: eq(projects.id, project.id),
    });
    expect(remainingProject).toBeUndefined();

    const remainingSubmission = await db.query.eventSubmissions.findFirst({
      where: eq(eventSubmissions.id, submission.id),
    });
    expect(remainingSubmission).toBeUndefined();

    const remainingReview = await db.query.hackathonReviews.findFirst({
      where: eq(hackathonReviews.id, review.id),
    });
    expect(remainingReview).toBeUndefined();

    const remainingPost = await db.query.posts.findFirst({
      where: eq(posts.id, post.id),
    });
    expect(remainingPost).toBeUndefined();

    const remainingComment = await db.query.postComments.findFirst({
      where: eq(postComments.id, comment.id),
    });
    expect(remainingComment).toBeUndefined();

    const remainingPostReaction = await db.query.reactions.findFirst({
      where: eq(reactions.id, postReaction.id),
    });
    expect(remainingPostReaction).toBeUndefined();

    const remainingCommentReaction = await db.query.reactions.findFirst({
      where: eq(reactions.id, commentReaction.id),
    });
    expect(remainingCommentReaction).toBeUndefined();

    const remainingLink = await db.query.eventProjects.findFirst({
      where: and(
        eq(eventProjects.eventId, testEventId),
        eq(eventProjects.projectId, project.id)
      ),
    });
    expect(remainingLink).toBeUndefined();
  });
});

// ========================================================================
// submitProject
// ========================================================================

describe("submitProject", () => {
  it("creates the event_projects link lazily when the project isn't linked yet", async () => {
    // Project deliberately created WITHOUT an eventProjects row — this is the
    // exact case the production fix targets (older projects that were never
    // linked to the event but whose owners should still be able to submit).
    const [project] = await db
      .insert(projects)
      .values({
        profileId: testProfileId,
        name: "Unlinked Submission Project",
        description: "No eventProjects row",
      })
      .returning();
    createdProjectIds.push(project.id);

    // Sanity check: no link exists yet.
    const before = await db.query.eventProjects.findFirst({
      where: and(
        eq(eventProjects.eventId, testEventId),
        eq(eventProjects.projectId, project.id)
      ),
    });
    expect(before).toBeUndefined();

    const result = await submitProject({
      projectId: project.id,
      eventId: testEventId,
      whatBuilt: "Built the thing",
      demoUrl: null,
      demoMediaUrl: null,
      demoMediaType: null,
      repoUrl: null,
      lessonLearned: null,
      toolIds: [],
    });
    expect(result).toEqual({ success: true });

    // Link should now exist.
    const after = await db.query.eventProjects.findFirst({
      where: and(
        eq(eventProjects.eventId, testEventId),
        eq(eventProjects.projectId, project.id)
      ),
    });
    expect(after).toBeDefined();

    // Submission row should exist.
    const submission = await db.query.eventSubmissions.findFirst({
      where: and(
        eq(eventSubmissions.eventId, testEventId),
        eq(eventSubmissions.projectId, project.id)
      ),
    });
    expect(submission).toBeDefined();
    expect(submission!.whatBuilt).toBe("Built the thing");
  });

  it("succeeds when the event_projects link already exists", async () => {
    const [project] = await db
      .insert(projects)
      .values({
        profileId: testProfileId,
        name: "Pre-Linked Submission Project",
        description: "Has an eventProjects row already",
      })
      .returning();
    createdProjectIds.push(project.id);

    await db
      .insert(eventProjects)
      .values({ eventId: testEventId, projectId: project.id });

    const result = await submitProject({
      projectId: project.id,
      eventId: testEventId,
      whatBuilt: "Already linked",
      demoUrl: null,
      demoMediaUrl: null,
      demoMediaType: null,
      repoUrl: null,
      lessonLearned: null,
      toolIds: [],
    });
    expect(result).toEqual({ success: true });

    const submission = await db.query.eventSubmissions.findFirst({
      where: and(
        eq(eventSubmissions.eventId, testEventId),
        eq(eventSubmissions.projectId, project.id)
      ),
    });
    expect(submission).toBeDefined();
  });
});
