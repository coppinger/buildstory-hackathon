"use server";

import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import { mentorApplications } from "@/lib/db/schema";
import { notifyMentorApplication } from "@/lib/discord";
import { isUniqueViolation } from "@/lib/db/errors";
import { submitMentorApplicationSchema, parseInput } from "@/lib/db/validations";

type ActionResult = { success: true } | { success: false; error: string };

export async function submitMentorApplication(data: {
  name: string;
  email: string;
  discordHandle: string;
  twitterHandle: string;
  websiteUrl: string;
  githubHandle: string;
  mentorTypes: string[];
  background: string;
  availability: string;
}): Promise<ActionResult> {
  try {
    // Strip leading @ from Twitter handle before validation (same as old behavior)
    const twitterHandle = data.twitterHandle
      ? data.twitterHandle.replace(/^@/, "")
      : "";

    // Filter to valid mentor types before validation (same as old behavior)
    const VALID_MENTOR_TYPES = ["design", "technical", "growth"];
    const mentorTypes = data.mentorTypes.filter((t) =>
      VALID_MENTOR_TYPES.includes(t)
    );

    const parsed = parseInput(submitMentorApplicationSchema, {
      name: data.name,
      email: data.email,
      discordHandle: data.discordHandle,
      twitterHandle: twitterHandle || null,
      websiteUrl: data.websiteUrl || null,
      githubHandle: data.githubHandle || null,
      mentorTypes,
      background: data.background,
      availability: data.availability,
    });
    if (!parsed.success) return parsed;
    const v = parsed.data;

    await db.insert(mentorApplications).values({
      name: v.name,
      email: v.email,
      discordHandle: v.discordHandle,
      twitterHandle: v.twitterHandle || null,
      websiteUrl: v.websiteUrl || null,
      githubHandle: v.githubHandle || null,
      mentorTypes: v.mentorTypes as string[],
      background: v.background,
      availability: v.availability,
    });

    notifyMentorApplication(v.name, v.mentorTypes as string[]);

    return { success: true };
  } catch (error) {
    if (isUniqueViolation(error, "mentor_applications_email_unique")) {
      return {
        success: false,
        error: "An application with this email already exists.",
      };
    }
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "submitMentorApplication" },
      extra: { email: data.email },
    });
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
