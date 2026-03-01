"use server";

import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { ensureProfile } from "@/lib/db/ensure-profile";
import { createLinearIssue } from "@/lib/linear";

type ActionResult = { success: true } | { success: false; error: string };

export async function submitFeedback(data: {
  title: string;
  description: string;
}): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const title = data.title.trim();
  const description = data.description.trim();

  if (!title) {
    return { success: false, error: "Title is required" };
  }
  if (!description) {
    return { success: false, error: "Description is required" };
  }

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

    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "submitFeedback" },
      extra: { userId },
    });
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
