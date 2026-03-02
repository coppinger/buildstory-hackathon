import { z } from "zod/v4";
import { createInsertSchema } from "drizzle-zod";
import {
  profiles,
  projects,
  mentorApplications,
  sponsorshipInquiries,
  twitchCategories,
} from "./schema";
import { USERNAME_REGEX } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const HANDLE_RE = /^[\w.-]+$/;

function isHttpUrl(val: string): boolean {
  try {
    const u = new URL(val);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/** Strict URL field — rejects invalid URLs with an error message.
 *  Normalizes valid URLs via `new URL(val).href` (adds trailing slash, etc.). */
function urlField(maxLen: number) {
  return z
    .string()
    .trim()
    .max(maxLen, "URL is too long")
    .url("Invalid URL")
    .refine(isHttpUrl, "URL must use http or https")
    .transform((val) => new URL(val).href);
}

/** Permissive URL field — silently converts invalid URLs to null instead of
 *  erroring. Used where the old `validateUrl()` function was used. */
function sanitizedUrlField(maxLen: number) {
  return z
    .string()
    .trim()
    .transform((val): string | null => {
      if (!val) return null;
      if (val.length > maxLen) return null;
      try {
        const u = new URL(val);
        if (u.protocol !== "https:" && u.protocol !== "http:") return null;
        return u.href;
      } catch {
        return null;
      }
    });
}

/**
 * Parse input with a Zod schema and return an ActionResult-compatible object.
 * On success: `{ success: true, data }` (data is the parsed/transformed value).
 * On failure: `{ success: false, error }` (first issue message).
 */
export function parseInput<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const firstIssue = result.error.issues[0];
  return { success: false, error: firstIssue?.message ?? "Validation failed" };
}

// ---------------------------------------------------------------------------
// Table schemas with refinements (via createInsertSchema)
// ---------------------------------------------------------------------------

export const profileInsertSchema = createInsertSchema(profiles, {
  displayName: (s) => s.trim().min(1, "Display name is required").max(100),
  username: (s) =>
    s
      .trim()
      .toLowerCase()
      .max(30)
      .regex(
        USERNAME_REGEX,
        "Username must be 3-30 characters, start and end with a letter or number, and contain only lowercase letters, numbers, hyphens, and underscores"
      ),
  bio: (s) => s.max(500),
  websiteUrl: () => urlField(2000),
  twitterHandle: (s) => s.max(39),
  githubHandle: (s) => s.max(39),
  twitchUrl: () => urlField(2000),
  streamUrl: () => urlField(2000),
  country: (s) => s.max(2),
  region: (s) => s.max(10),
  banReason: (s) => s.max(1000),
});

export const projectInsertSchema = createInsertSchema(projects, {
  name: (s) => s.trim().min(1, "Project name is required").max(100),
  slug: (s) =>
    s
      .trim()
      .toLowerCase()
      .max(100)
      .regex(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/, "Invalid project URL format"),
  description: (s) => s.min(1, "Description is required").max(2000),
  goalText: (s) => s.max(1000),
  githubUrl: () => sanitizedUrlField(2000),
  liveUrl: () => sanitizedUrlField(2000),
});

export const mentorApplicationInsertSchema = createInsertSchema(
  mentorApplications,
  {
    name: (s) => s.trim().min(1, "Name is required").max(200, "Name is too long"),
    email: (s) =>
      s
        .trim()
        .toLowerCase()
        .email("Valid email is required")
        .max(320, "Email is too long"),
    discordHandle: (s) =>
      s
        .trim()
        .min(1, "Discord handle is required")
        .max(100, "Discord handle is too long"),
    twitterHandle: (s) =>
      s.max(100, "Twitter handle is too long").regex(HANDLE_RE, "Invalid Twitter handle"),
    websiteUrl: () =>
      z
        .string()
        .trim()
        .max(500, "Website URL is too long")
        .url("Invalid URL")
        .refine(isHttpUrl, "Website URL must start with http:// or https://")
        .transform((val) => new URL(val).href),
    githubHandle: (s) =>
      s.max(100, "GitHub handle is too long").regex(HANDLE_RE, "Invalid GitHub handle"),
    mentorTypes: () =>
      z
        .array(z.enum(["design", "technical", "growth"]))
        .min(1, "Select at least one mentor type"),
    background: (s) =>
      s
        .trim()
        .min(1, "Background is required")
        .max(5000, "Background is too long (max 5000 characters)"),
    availability: (s) =>
      s.trim().min(1, "Availability is required").max(500, "Availability is too long"),
  }
);

export const sponsorshipInquiryInsertSchema = createInsertSchema(
  sponsorshipInquiries,
  {
    companyName: (s) =>
      s.trim().min(1, "Company name is required").max(200, "Company name is too long"),
    contactName: (s) =>
      s.trim().min(1, "Contact name is required").max(200, "Contact name is too long"),
    email: (s) =>
      s
        .trim()
        .toLowerCase()
        .email("Valid email is required")
        .max(320, "Email is too long"),
    websiteUrl: () =>
      z
        .string()
        .trim()
        .max(500, "Website URL is too long")
        .url("Invalid URL")
        .refine(isHttpUrl, "Website URL must start with http:// or https://")
        .transform((val) => new URL(val).href),
    offerDescription: (s) =>
      s
        .trim()
        .min(1, "Offer description is required")
        .max(5000, "Offer description is too long (max 5000 characters)"),
    additionalNotes: (s) =>
      s.max(2000, "Additional notes are too long (max 2000 characters)"),
  }
);

export const twitchCategoryInsertSchema = createInsertSchema(twitchCategories, {
  twitchId: (s) => s.min(1).max(100),
  name: (s) => s.min(1).max(200),
  boxArtUrl: () => urlField(2000),
});

// ---------------------------------------------------------------------------
// Action-specific schemas (derived via .pick())
// ---------------------------------------------------------------------------

export const updateProfileSchema = profileInsertSchema.pick({
  displayName: true,
  username: true,
  bio: true,
  websiteUrl: true,
  twitterHandle: true,
  githubHandle: true,
  twitchUrl: true,
  streamUrl: true,
  country: true,
  region: true,
  experienceLevel: true,
});

export const completeRegistrationSchema = profileInsertSchema.pick({
  displayName: true,
  username: true,
  country: true,
  region: true,
});

export const usernameSchema = profileInsertSchema.pick({
  username: true,
});

export const createProjectSchema = projectInsertSchema.pick({
  name: true,
  slug: true,
  description: true,
  startingPoint: true,
  goalText: true,
  githubUrl: true,
  liveUrl: true,
});

export const submitMentorApplicationSchema =
  mentorApplicationInsertSchema.pick({
    name: true,
    email: true,
    discordHandle: true,
    twitterHandle: true,
    websiteUrl: true,
    githubHandle: true,
    mentorTypes: true,
    background: true,
    availability: true,
  });

export const submitSponsorInquirySchema = sponsorshipInquiryInsertSchema.pick({
  companyName: true,
  contactName: true,
  email: true,
  websiteUrl: true,
  offerDescription: true,
  additionalNotes: true,
});

export const addTwitchCategorySchema = twitchCategoryInsertSchema.pick({
  twitchId: true,
  name: true,
  boxArtUrl: true,
});

// ---------------------------------------------------------------------------
// Non-table schemas (plain z.object())
// ---------------------------------------------------------------------------

export const searchQuerySchema = z.object({
  query: z.string().max(100).trim(),
});

export const feedbackSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().min(1, "Description is required").max(5000),
});

export const banReasonSchema = z.object({
  reason: z.string().max(1000).optional(),
});
