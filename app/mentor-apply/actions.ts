"use server";

import * as Sentry from "@sentry/nextjs";
import { NeonDbError } from "@neondatabase/serverless";
import { db } from "@/lib/db";
import { mentorApplications } from "@/lib/db/schema";
import { notifyMentorApplication } from "@/lib/discord";

type ActionResult = { success: true } | { success: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const VALID_MENTOR_TYPES = ["design", "technical", "growth"];
const HANDLE_RE = /^[\w.-]+$/;

function isUniqueViolation(error: unknown, constraintName: string): boolean {
  const cause =
    error instanceof Error && error.cause instanceof NeonDbError
      ? error.cause
      : error instanceof NeonDbError
        ? error
        : null;
  return cause?.code === "23505" && cause?.constraint === constraintName;
}

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
    const name = data.name.trim();
    const email = data.email.trim().toLowerCase();
    const discordHandle = data.discordHandle.trim();
    const twitterHandle = data.twitterHandle.trim() || null;
    const websiteUrl = data.websiteUrl.trim() || null;
    const githubHandle = data.githubHandle.trim() || null;
    const mentorTypes = data.mentorTypes.filter((t) =>
      VALID_MENTOR_TYPES.includes(t)
    );
    const background = data.background.trim();
    const availability = data.availability.trim();

    // Required field checks
    if (!name) return { success: false, error: "Name is required" };
    if (!email || !EMAIL_RE.test(email))
      return { success: false, error: "Valid email is required" };
    if (!discordHandle)
      return { success: false, error: "Discord handle is required" };
    if (mentorTypes.length === 0)
      return { success: false, error: "Select at least one mentor type" };
    if (!background)
      return { success: false, error: "Background is required" };
    if (!availability)
      return { success: false, error: "Availability is required" };

    // Length limits
    if (name.length > 200)
      return { success: false, error: "Name is too long" };
    if (email.length > 320)
      return { success: false, error: "Email is too long" };
    if (discordHandle.length > 100)
      return { success: false, error: "Discord handle is too long" };
    if (background.length > 5000)
      return {
        success: false,
        error: "Background is too long (max 5000 characters)",
      };
    if (availability.length > 500)
      return { success: false, error: "Availability is too long" };

    // Optional field validation
    if (twitterHandle && twitterHandle.length > 100)
      return { success: false, error: "Twitter handle is too long" };
    if (websiteUrl && websiteUrl.length > 500)
      return { success: false, error: "Website URL is too long" };
    if (githubHandle && githubHandle.length > 100)
      return { success: false, error: "GitHub handle is too long" };

    // URL protocol validation
    if (websiteUrl && !/^https?:\/\//i.test(websiteUrl))
      return {
        success: false,
        error: "Website URL must start with http:// or https://",
      };

    // Handle format validation
    if (twitterHandle && !HANDLE_RE.test(twitterHandle.replace(/^@/, "")))
      return { success: false, error: "Invalid Twitter handle" };
    if (githubHandle && !HANDLE_RE.test(githubHandle))
      return { success: false, error: "Invalid GitHub handle" };

    await db.insert(mentorApplications).values({
      name,
      email,
      discordHandle,
      twitterHandle,
      websiteUrl,
      githubHandle,
      mentorTypes,
      background,
      availability,
    });

    notifyMentorApplication(name, mentorTypes);

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
