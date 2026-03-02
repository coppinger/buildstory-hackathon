"use server";

import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { ensureProfile } from "@/lib/db/ensure-profile";
import { createLinearIssue } from "@/lib/linear";
import { feedbackSchema, parseInput } from "@/lib/db/validations";

type ActionResult = { success: true } | { success: false; error: string };

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

// In-memory rate limiting. Note: In serverless environments (Vercel), this Map
// resets per instance, so it provides best-effort spam prevention rather than
// guaranteed rate limiting. It still blocks rapid sequential submissions.
const lastSubmission = new Map<string, number>();

export async function submitFeedback(data: {
  title: string;
  description: string;
}): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const lastTime = lastSubmission.get(userId);
  if (lastTime && Date.now() - lastTime < COOLDOWN_MS) {
    const remainingSeconds = Math.ceil((COOLDOWN_MS - (Date.now() - lastTime)) / 1000);
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    return { success: false, error: `You're submitting feedback too quickly. Please wait ${timeStr}.` };
  }

  const parsed = parseInput(feedbackSchema, data);
  if (!parsed.success) return parsed;
  const { title, description } = parsed.data;

  try {
    const profile = await ensureProfile(userId);

    const submitterInfo = profile
      ? `\n\n---\n_Submitted by ${profile.displayName ?? "Unknown"}${profile.username ? ` (@${profile.username})` : ""}_`
      : "";

    const result = await createLinearIssue({
      title,
      description: description + submitterInfo,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    lastSubmission.set(userId, Date.now());

    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "submitFeedback" },
      extra: { userId },
    });
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
