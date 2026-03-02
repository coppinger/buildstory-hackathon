"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

export async function dismissDiscordCard(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.clerkId, userId),
      columns: { id: true },
    });

    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    await db
      .update(profiles)
      .set({ discordCardDismissed: true })
      .where(eq(profiles.id, profile.id));

    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "dismissDiscordCard" },
    });
    return { success: false, error: "Failed to dismiss card" };
  }
}
