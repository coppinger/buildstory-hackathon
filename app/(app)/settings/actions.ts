"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { ensureProfile } from "@/lib/db/ensure-profile";
import { isUniqueViolation } from "@/lib/db/errors";
import { updateProfileSchema, parseInput } from "@/lib/db/validations";

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

    const parsed = parseInput(updateProfileSchema, {
      displayName: data.displayName,
      username: data.username,
      bio: data.bio || null,
      websiteUrl: data.websiteUrl || null,
      twitterHandle: data.twitterHandle || null,
      githubHandle: data.githubHandle || null,
      twitchUrl: data.twitchUrl || null,
      streamUrl: data.streamUrl || null,
      country: data.country || null,
      region: data.region || null,
      experienceLevel: data.experienceLevel,
    });
    if (!parsed.success) return parsed;
    const v = parsed.data;

    // Check username uniqueness — allow the current user to keep their own username
    const existingWithUsername = await db.query.profiles.findFirst({
      where: eq(profiles.username, v.username!),
      columns: { id: true },
    });

    if (existingWithUsername && existingWithUsername.id !== profile.id) {
      return { success: false, error: "Username is already taken" };
    }

    // Clean social handles (post-parse)
    let twitterHandle = v.twitterHandle || null;
    if (twitterHandle) {
      twitterHandle = twitterHandle.replace(/^@/, "");
    }

    let githubHandle = v.githubHandle || null;
    if (githubHandle) {
      githubHandle = githubHandle
        .replace(/^https?:\/\/(www\.)?github\.com\//, "")
        .replace(/\/$/, "");
    }

    await db
      .update(profiles)
      .set({
        displayName: v.displayName,
        username: v.username,
        bio: v.bio || null,
        websiteUrl: v.websiteUrl || null,
        twitterHandle,
        githubHandle,
        twitchUrl: v.twitchUrl || null,
        streamUrl: v.streamUrl || null,
        country: v.country?.toUpperCase() || null,
        region: v.region || null,
        experienceLevel: v.experienceLevel,
        ...(data.allowInvites !== undefined && { allowInvites: data.allowInvites }),
      })
      .where(eq(profiles.id, profile.id));

    revalidatePath("/settings");
    revalidatePath(`/members/${v.username}`);
    if (profile.username && profile.username !== v.username) {
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
