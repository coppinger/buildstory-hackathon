"use server";

import { auth } from "@clerk/nextjs/server";
import { eq, and, isNull } from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import { ensureProfile } from "@/lib/db/ensure-profile";
import { profiles } from "@/lib/db/schema";
import { isUniqueViolation } from "@/lib/db/errors";
import { usernameSchema, parseInput } from "@/lib/db/validations";

type ActionResult = { success: true } | { success: false; error: string };

export async function setUsernameAfterSignUp(
  username: string
): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Not authenticated" };

    const profile = await ensureProfile(userId);
    if (!profile) return { success: false, error: "Profile creation failed" };

    const parsed = parseInput(usernameSchema, { username });
    if (!parsed.success) return { success: false, error: "Invalid username format" };
    const trimmed = parsed.data.username!;

    // Only set username if not already claimed (prevents use as a backdoor
    // to bypass normal username-change flows in settings)
    const [updated] = await db
      .update(profiles)
      .set({ username: trimmed })
      .where(and(eq(profiles.id, profile.id), isNull(profiles.username)))
      .returning({ id: profiles.id });

    if (!updated) {
      return { success: false, error: "Username already set" };
    }

    return { success: true };
  } catch (error) {
    if (isUniqueViolation(error, "profiles_username_unique")) {
      return { success: false, error: "Username is already taken" };
    }
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "setUsernameAfterSignUp" },
      extra: { username },
    });
    return { success: false, error: "Failed to set username" };
  }
}
