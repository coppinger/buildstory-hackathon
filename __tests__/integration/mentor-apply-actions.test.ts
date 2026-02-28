import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterAll,
} from "vitest";
import { db } from "@/lib/db";
import { mentorApplications } from "@/lib/db/schema";
import { like } from "drizzle-orm";

// --- Mocks ---

const mockCaptureException = vi.fn();
vi.mock("@sentry/nextjs", () => ({
  captureException: (...args: unknown[]) => mockCaptureException(...args),
}));

const mockNotifyMentorApplication = vi.fn();
vi.mock("@/lib/discord", () => ({
  notifyMentorApplication: (...args: unknown[]) =>
    mockNotifyMentorApplication(...args),
  notifySignup: vi.fn(),
  notifyProject: vi.fn(),
}));

// Import AFTER mocks
import { submitMentorApplication } from "@/app/mentor-apply/actions";

// --- Constants & helpers ---

const TEST_PREFIX = "test_mentor_apply_";

function testEmail() {
  return `${TEST_PREFIX}${crypto.randomUUID().slice(0, 8)}@example.com`;
}

function buildApplicationData(
  overrides: Partial<{
    name: string;
    email: string;
    discordHandle: string;
    twitterHandle: string;
    websiteUrl: string;
    githubHandle: string;
    mentorTypes: string[];
    background: string;
    availability: string;
  }> = {}
) {
  return {
    name: overrides.name ?? "Test Mentor",
    email: overrides.email ?? testEmail(),
    discordHandle: overrides.discordHandle ?? "testmentor#1234",
    twitterHandle: overrides.twitterHandle ?? "",
    websiteUrl: overrides.websiteUrl ?? "",
    githubHandle: overrides.githubHandle ?? "",
    mentorTypes: overrides.mentorTypes ?? ["technical"],
    background: overrides.background ?? "10 years of building",
    availability: overrides.availability ?? "Weekends",
  };
}

// --- Setup / Teardown ---

beforeEach(() => {
  mockCaptureException.mockReset();
  mockNotifyMentorApplication.mockReset();
});

afterAll(async () => {
  await db
    .delete(mentorApplications)
    .where(like(mentorApplications.email, `${TEST_PREFIX}%`));
});

// ========================================================================
// submitMentorApplication
// ========================================================================

describe("submitMentorApplication", () => {
  it("submits application successfully", async () => {
    const data = buildApplicationData();
    const result = await submitMentorApplication(data);
    expect(result).toEqual({ success: true });
    expect(mockNotifyMentorApplication).toHaveBeenCalledWith(
      data.name,
      data.mentorTypes
    );
  });

  it("trims and lowercases email", async () => {
    const rawEmail = `  ${TEST_PREFIX}UPPER@EXAMPLE.COM  `;
    const data = buildApplicationData({ email: rawEmail });
    const result = await submitMentorApplication(data);
    expect(result).toEqual({ success: true });

    const app = await db.query.mentorApplications.findFirst({
      where: like(
        mentorApplications.email,
        `${TEST_PREFIX}upper@example.com`
      ),
    });
    expect(app).toBeDefined();
    expect(app!.email).toBe(`${TEST_PREFIX}upper@example.com`);
  });

  // --- Required field validation ---

  it("returns error for empty name", async () => {
    const data = buildApplicationData({ name: "" });
    const result = await submitMentorApplication(data);
    expect(result).toEqual({ success: false, error: "Name is required" });
  });

  it("returns error for invalid email", async () => {
    const data = buildApplicationData({ email: "not-email" });
    const result = await submitMentorApplication(data);
    expect(result).toEqual({
      success: false,
      error: "Valid email is required",
    });
  });

  it("returns error for empty email", async () => {
    const data = buildApplicationData({ email: "" });
    const result = await submitMentorApplication(data);
    expect(result).toEqual({
      success: false,
      error: "Valid email is required",
    });
  });

  it("returns error for empty Discord handle", async () => {
    const data = buildApplicationData({ discordHandle: "" });
    const result = await submitMentorApplication(data);
    expect(result).toEqual({
      success: false,
      error: "Discord handle is required",
    });
  });

  it("returns error for empty mentor types", async () => {
    const data = buildApplicationData({ mentorTypes: [] });
    const result = await submitMentorApplication(data);
    expect(result).toEqual({
      success: false,
      error: "Select at least one mentor type",
    });
  });

  it("filters invalid mentor types and returns error if none remain", async () => {
    const data = buildApplicationData({ mentorTypes: ["invalid", "fake"] });
    const result = await submitMentorApplication(data);
    expect(result).toEqual({
      success: false,
      error: "Select at least one mentor type",
    });
  });

  it("returns error for empty background", async () => {
    const data = buildApplicationData({ background: "" });
    const result = await submitMentorApplication(data);
    expect(result).toEqual({
      success: false,
      error: "Background is required",
    });
  });

  it("returns error for empty availability", async () => {
    const data = buildApplicationData({ availability: "" });
    const result = await submitMentorApplication(data);
    expect(result).toEqual({
      success: false,
      error: "Availability is required",
    });
  });

  // --- Length limits ---

  it("returns error for name too long", async () => {
    const data = buildApplicationData({ name: "a".repeat(201) });
    const result = await submitMentorApplication(data);
    expect(result).toEqual({ success: false, error: "Name is too long" });
  });

  it("returns error for email too long", async () => {
    const data = buildApplicationData({
      email: `${"a".repeat(310)}@example.com`,
    });
    const result = await submitMentorApplication(data);
    expect(result).toEqual({ success: false, error: "Email is too long" });
  });

  it("returns error for Discord handle too long", async () => {
    const data = buildApplicationData({
      discordHandle: "d".repeat(101),
    });
    const result = await submitMentorApplication(data);
    expect(result).toEqual({
      success: false,
      error: "Discord handle is too long",
    });
  });

  it("returns error for background too long", async () => {
    const data = buildApplicationData({ background: "b".repeat(5001) });
    const result = await submitMentorApplication(data);
    expect(result).toEqual({
      success: false,
      error: "Background is too long (max 5000 characters)",
    });
  });

  it("returns error for availability too long", async () => {
    const data = buildApplicationData({ availability: "a".repeat(501) });
    const result = await submitMentorApplication(data);
    expect(result).toEqual({
      success: false,
      error: "Availability is too long",
    });
  });

  // --- Optional field validation ---

  it("returns error for website URL without protocol", async () => {
    const data = buildApplicationData({ websiteUrl: "example.com" });
    const result = await submitMentorApplication(data);
    expect(result).toEqual({
      success: false,
      error: "Website URL must start with http:// or https://",
    });
  });

  it("returns error for invalid Twitter handle", async () => {
    const data = buildApplicationData({ twitterHandle: "user name!" });
    const result = await submitMentorApplication(data);
    expect(result).toEqual({
      success: false,
      error: "Invalid Twitter handle",
    });
  });

  it("returns error for invalid GitHub handle", async () => {
    const data = buildApplicationData({ githubHandle: "user name!" });
    const result = await submitMentorApplication(data);
    expect(result).toEqual({
      success: false,
      error: "Invalid GitHub handle",
    });
  });

  it("accepts Twitter handle with @ prefix", async () => {
    const data = buildApplicationData({ twitterHandle: "@validuser" });
    const result = await submitMentorApplication(data);
    expect(result).toEqual({ success: true });
  });

  it("accepts valid website URL", async () => {
    const data = buildApplicationData({
      websiteUrl: "https://example.com",
    });
    const result = await submitMentorApplication(data);
    expect(result).toEqual({ success: true });
  });

  // --- Uniqueness ---

  it("returns error for duplicate email", async () => {
    const email = testEmail();
    const data1 = buildApplicationData({ email });
    const result1 = await submitMentorApplication(data1);
    expect(result1).toEqual({ success: true });

    const data2 = buildApplicationData({ email });
    const result2 = await submitMentorApplication(data2);
    expect(result2).toEqual({
      success: false,
      error: "An application with this email already exists.",
    });
  });
});
