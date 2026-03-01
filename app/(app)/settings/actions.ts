"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { NeonDbError } from "@neondatabase/serverless";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { ensureProfile } from "@/lib/db/ensure-profile";

type ActionResult =
  | { success: true }
  | { success: false; error: string };

export async function syncAvatarUrl(data: {
  avatarUrl: string | null;
}): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Not authenticated" };

    const profile = await ensureProfile(userId);
    if (!profile) return { success: false, error: "Profile not found" };

    // Validate URL is from Clerk's image CDN (or null for removal)
    if (data.avatarUrl !== null) {
      try {
        const parsed = new URL(data.avatarUrl);
        if (
          parsed.protocol !== "https:" ||
          (!parsed.hostname.endsWith(".clerk.com") &&
            !parsed.hostname.endsWith(".clerk.dev"))
        ) {
          return { success: false, error: "Invalid avatar URL" };
        }
      } catch {
        return { success: false, error: "Invalid avatar URL" };
      }
    }

    await db
      .update(profiles)
      .set({ avatarUrl: data.avatarUrl })
      .where(eq(profiles.id, profile.id));

    revalidatePath("/settings");
    revalidatePath("/members");
    if (profile.username) {
      revalidatePath(`/members/${profile.username}`);
    }

    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "syncAvatarUrl" },
    });
    return { success: false, error: "Failed to sync avatar" };
  }
}

const USERNAME_REGEX = /^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$/;

function validateUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

function isUniqueViolation(error: unknown, constraintName: string): boolean {
  const cause =
    error instanceof Error && error.cause instanceof NeonDbError
      ? error.cause
      : error instanceof NeonDbError
        ? error
        : null;
  return cause?.code === "23505" && cause?.constraint === constraintName;
}

export async function updateProfile(data: {
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
  experienceLevel: "getting_started" | "built_a_few" | "ships_constantly" | null;
  allowInvites?: boolean;
}): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Not authenticated" };

    const profile = await ensureProfile(userId);
    if (!profile) return { success: false, error: "Profile not found" };

    // Validate required fields
    const trimmedDisplayName = data.displayName.trim();
    if (!trimmedDisplayName) {
      return { success: false, error: "Display name is required" };
    }

    const trimmedUsername = data.username.trim().toLowerCase();
    if (!USERNAME_REGEX.test(trimmedUsername)) {
      return {
        success: false,
        error:
          "Username must be 3-30 characters, start and end with a letter or number, and contain only lowercase letters, numbers, hyphens, and underscores",
      };
    }

    // Check username uniqueness — allow the current user to keep their own username
    const existingWithUsername = await db.query.profiles.findFirst({
      where: eq(profiles.username, trimmedUsername),
      columns: { id: true },
    });

    if (existingWithUsername && existingWithUsername.id !== profile.id) {
      return { success: false, error: "Username is already taken" };
    }

    // Validate URLs
    const websiteUrl = data.websiteUrl?.trim() ? validateUrl(data.websiteUrl) : null;
    if (data.websiteUrl?.trim() && !websiteUrl) {
      return { success: false, error: "Invalid website URL" };
    }

    const twitchUrl = data.twitchUrl?.trim() ? validateUrl(data.twitchUrl) : null;
    if (data.twitchUrl?.trim() && !twitchUrl) {
      return { success: false, error: "Invalid Twitch URL" };
    }

    const streamUrl = data.streamUrl?.trim() ? validateUrl(data.streamUrl) : null;
    if (data.streamUrl?.trim() && !streamUrl) {
      return { success: false, error: "Invalid stream URL" };
    }

    // Clean social handles
    let twitterHandle = data.twitterHandle?.trim() || null;
    if (twitterHandle) {
      twitterHandle = twitterHandle.replace(/^@/, "");
    }

    let githubHandle = data.githubHandle?.trim() || null;
    if (githubHandle) {
      githubHandle = githubHandle
        .replace(/^https?:\/\/(www\.)?github\.com\//, "")
        .replace(/\/$/, "");
    }

    await db
      .update(profiles)
      .set({
        displayName: trimmedDisplayName,
        username: trimmedUsername,
        bio: data.bio?.trim() || null,
        websiteUrl,
        twitterHandle,
        githubHandle,
        twitchUrl,
        streamUrl,
        country: data.country?.toUpperCase() || null,
        region: data.region?.trim() || null,
        experienceLevel: data.experienceLevel,
        ...(data.allowInvites !== undefined && { allowInvites: data.allowInvites }),
      })
      .where(eq(profiles.id, profile.id));

    revalidatePath("/settings");
    revalidatePath(`/members/${trimmedUsername}`);
    if (profile.username && profile.username !== trimmedUsername) {
      revalidatePath(`/members/${profile.username}`);
    }

    return { success: true };
  } catch (error) {
    if (isUniqueViolation(error, "profiles_username_unique")) {
      return { success: false, error: "Username is already taken" };
    }

    Sentry.captureException(error, {
      tags: { component: "server-action", action: "updateProfile" },
      extra: { displayName: data.displayName, username: data.username },
    });
    return { success: false, error: "Failed to update profile" };
  }
}
