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
import { profiles } from "@/lib/db/schema";
import { eq, like } from "drizzle-orm";

// --- Mocks ---

const mockAuth = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
  clerkClient: () =>
    Promise.resolve({
      users: {
        getUser: () =>
          Promise.resolve({
            firstName: "Settings",
            lastName: "Tester",
            username: "settingstester",
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

// Import AFTER mocks
import { updateProfile } from "@/app/(app)/settings/actions";

// --- Constants & helpers ---

const TEST_PREFIX = "test_settings_";

function testClerkId() {
  return `${TEST_PREFIX}${crypto.randomUUID()}`;
}

// --- Shared state ---

let testClerk: string;
let testProfileId: string;
let otherClerk: string;

const baseUsername = `${TEST_PREFIX}user${crypto.randomUUID().slice(0, 6)}`;

function buildProfileData(
  overrides: Partial<{
    displayName: string;
    username: string;
    bio: string | null;
    websiteUrl: string | null;
    twitterHandle: string | null;
    githubHandle: string | null;
    twitchUrl: string | null;
    streamUrl: string | null;
    country: string | null;
    region: string | null;
    experienceLevel:
      | "getting_started"
      | "built_a_few"
      | "ships_constantly"
      | null;
    allowInvites: boolean;
  }> = {}
) {
  return {
    displayName: overrides.displayName ?? "Test Builder",
    username: overrides.username ?? baseUsername,
    bio: overrides.bio ?? null,
    websiteUrl: overrides.websiteUrl ?? null,
    twitterHandle: overrides.twitterHandle ?? null,
    githubHandle: overrides.githubHandle ?? null,
    twitchUrl: overrides.twitchUrl ?? null,
    streamUrl: overrides.streamUrl ?? null,
    country: overrides.country ?? null,
    region: overrides.region ?? null,
    experienceLevel: overrides.experienceLevel ?? null,
    allowInvites: overrides.allowInvites ?? true,
  };
}

// --- Setup / Teardown ---

beforeAll(async () => {
  const { ensureProfile } = await import("@/lib/db/ensure-profile");

  testClerk = testClerkId();
  const profile = await ensureProfile(testClerk);
  testProfileId = profile!.id;

  // Set an initial username
  await db
    .update(profiles)
    .set({ username: baseUsername })
    .where(eq(profiles.id, testProfileId));

  // Create another profile for username conflict tests
  otherClerk = testClerkId();
  await ensureProfile(otherClerk);
});

beforeEach(() => {
  mockAuth.mockReset();
  mockAuth.mockResolvedValue({ userId: testClerk });
  mockCaptureException.mockReset();
});

afterAll(async () => {
  await db
    .delete(profiles)
    .where(like(profiles.clerkId, `${TEST_PREFIX}%`));
});

// ========================================================================
// updateProfile
// ========================================================================

describe("updateProfile", () => {
  it("updates profile successfully with all fields", async () => {
    const data = buildProfileData({
      displayName: "Updated Builder",
      bio: "I build things",
      websiteUrl: "https://example.com",
      twitterHandle: "myhandle",
      githubHandle: "mygithub",
      country: "us",
      region: "US-CA",
      experienceLevel: "ships_constantly",
    });
    const result = await updateProfile(data);
    expect(result).toEqual({ success: true });

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, testProfileId),
    });
    expect(profile!.displayName).toBe("Updated Builder");
    expect(profile!.bio).toBe("I build things");
    expect(profile!.websiteUrl).toBe("https://example.com/");
    expect(profile!.twitterHandle).toBe("myhandle");
    expect(profile!.githubHandle).toBe("mygithub");
    expect(profile!.country).toBe("US");
    expect(profile!.region).toBe("US-CA");
    expect(profile!.experienceLevel).toBe("ships_constantly");
  });

  it("returns error for empty display name", async () => {
    const data = buildProfileData({ displayName: "   " });
    const result = await updateProfile(data);
    expect(result).toEqual({
      success: false,
      error: "Display name is required",
    });
  });

  it("returns error for invalid username (too short)", async () => {
    const data = buildProfileData({ username: "x" });
    const result = await updateProfile(data);
    expect(result.success).toBe(false);
    expect("error" in result && result.error).toContain("Username must be");
  });

  it("returns error for invalid username (special chars)", async () => {
    const data = buildProfileData({ username: "user@name!" });
    const result = await updateProfile(data);
    expect(result.success).toBe(false);
    expect("error" in result && result.error).toContain("Username must be");
  });

  it("returns error for invalid username (starts with hyphen)", async () => {
    const data = buildProfileData({ username: "-username" });
    const result = await updateProfile(data);
    expect(result.success).toBe(false);
    expect("error" in result && result.error).toContain("Username must be");
  });

  it("allows user to keep their own username", async () => {
    const data = buildProfileData({
      displayName: "Keep Username",
      username: baseUsername,
    });
    const result = await updateProfile(data);
    expect(result).toEqual({ success: true });
  });

  it("returns error for username taken by another user", async () => {
    const otherUsername = `${TEST_PREFIX}other${crypto.randomUUID().slice(0, 6)}`;
    // Set username on other profile
    const otherProfile = await db.query.profiles.findFirst({
      where: eq(profiles.clerkId, otherClerk),
    });
    await db
      .update(profiles)
      .set({ username: otherUsername })
      .where(eq(profiles.id, otherProfile!.id));

    const data = buildProfileData({ username: otherUsername });
    const result = await updateProfile(data);
    expect(result).toEqual({
      success: false,
      error: "Username is already taken",
    });
  });

  it("returns error for invalid website URL", async () => {
    const data = buildProfileData({ websiteUrl: "not-a-url" });
    const result = await updateProfile(data);
    expect(result).toEqual({ success: false, error: "Invalid URL" });
  });

  it("returns error for invalid Twitch URL", async () => {
    const data = buildProfileData({ twitchUrl: "ftp://bad" });
    const result = await updateProfile(data);
    expect(result).toEqual({
      success: false,
      error: "URL must use http or https",
    });
  });

  it("returns error for invalid stream URL", async () => {
    const data = buildProfileData({ streamUrl: "javascript:alert(1)" });
    const result = await updateProfile(data);
    expect(result).toEqual({
      success: false,
      error: "URL must use http or https",
    });
  });

  it("strips @ prefix from Twitter handle", async () => {
    const data = buildProfileData({ twitterHandle: "@myhandle" });
    const result = await updateProfile(data);
    expect(result).toEqual({ success: true });

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, testProfileId),
    });
    expect(profile!.twitterHandle).toBe("myhandle");
  });

  it("strips GitHub URL prefix from GitHub handle", async () => {
    const data = buildProfileData({
      githubHandle: "https://github.com/someuser/",
    });
    const result = await updateProfile(data);
    expect(result).toEqual({ success: true });

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, testProfileId),
    });
    expect(profile!.githubHandle).toBe("someuser");
  });

  it("uppercases country code", async () => {
    const data = buildProfileData({ country: "gb" });
    const result = await updateProfile(data);
    expect(result).toEqual({ success: true });

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, testProfileId),
    });
    expect(profile!.country).toBe("GB");
  });

  it("stores null for empty optional fields", async () => {
    const data = buildProfileData({
      bio: "",
      websiteUrl: "",
      twitterHandle: "",
      githubHandle: "",
      twitchUrl: "",
      streamUrl: "",
    });
    const result = await updateProfile(data);
    expect(result).toEqual({ success: true });

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, testProfileId),
    });
    expect(profile!.bio).toBeNull();
    expect(profile!.websiteUrl).toBeNull();
    expect(profile!.twitterHandle).toBeNull();
    expect(profile!.githubHandle).toBeNull();
    expect(profile!.twitchUrl).toBeNull();
    expect(profile!.streamUrl).toBeNull();
  });

  it("updates allowInvites flag", async () => {
    const data = buildProfileData({ allowInvites: false });
    const result = await updateProfile(data);
    expect(result).toEqual({ success: true });

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, testProfileId),
    });
    expect(profile!.allowInvites).toBe(false);
  });

  it("returns error when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const data = buildProfileData();
    const result = await updateProfile(data);
    expect(result).toEqual({ success: false, error: "Not authenticated" });
  });
});
