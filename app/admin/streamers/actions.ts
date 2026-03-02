"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import { twitchCategories, profiles, adminAuditLog } from "@/lib/db/schema";
import { isAdmin } from "@/lib/admin";
import { searchCategories } from "@/lib/twitch";
import { tooLong, MAX_SEARCH_QUERY, MAX_URL } from "@/lib/validation";

type ActionResult = { success: true } | { success: false; error: string };

async function getActorProfile(clerkUserId: string) {
  return db.query.profiles.findFirst({
    where: eq(profiles.clerkId, clerkUserId),
    columns: { id: true },
  });
}

export async function addTwitchCategory(data: {
  twitchId: string;
  name: string;
  boxArtUrl: string | null;
}): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId || !(await isAdmin(userId))) {
      return { success: false, error: "Unauthorized" };
    }

    if (tooLong(data.twitchId, MAX_SEARCH_QUERY)) {
      return { success: false, error: "Invalid Twitch ID" };
    }
    if (tooLong(data.name, 200)) {
      return { success: false, error: "Category name is too long" };
    }
    if (tooLong(data.boxArtUrl, MAX_URL)) {
      return { success: false, error: "Box art URL is too long" };
    }

    const actor = await getActorProfile(userId);
    if (!actor) return { success: false, error: "Actor profile not found" };

    const [inserted] = await db
      .insert(twitchCategories)
      .values({
        twitchId: data.twitchId,
        name: data.name,
        boxArtUrl: data.boxArtUrl,
        addedBy: actor.id,
      })
      .onConflictDoNothing()
      .returning({ id: twitchCategories.id });

    if (inserted) {
      await db.insert(adminAuditLog).values({
        actorProfileId: actor.id,
        action: "add_twitch_category",
        targetProfileId: null,
        metadata: JSON.stringify({
          twitchId: data.twitchId,
          name: data.name,
        }),
      });
    }

    revalidatePath("/admin/streamers");
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "addTwitchCategory" },
      extra: { twitchId: data.twitchId },
    });
    return { success: false, error: "Failed to add category" };
  }
}

export async function removeTwitchCategory(data: {
  categoryId: string;
}): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId || !(await isAdmin(userId))) {
      return { success: false, error: "Unauthorized" };
    }

    const actor = await getActorProfile(userId);
    if (!actor) return { success: false, error: "Actor profile not found" };

    const category = await db.query.twitchCategories.findFirst({
      where: eq(twitchCategories.id, data.categoryId),
    });
    if (!category) return { success: false, error: "Category not found" };

    await db
      .delete(twitchCategories)
      .where(eq(twitchCategories.id, data.categoryId));

    await db.insert(adminAuditLog).values({
      actorProfileId: actor.id,
      action: "remove_twitch_category",
      targetProfileId: null,
      metadata: JSON.stringify({
        twitchId: category.twitchId,
        name: category.name,
      }),
    });

    revalidatePath("/admin/streamers");
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "removeTwitchCategory" },
      extra: { categoryId: data.categoryId },
    });
    return { success: false, error: "Failed to remove category" };
  }
}

export async function searchTwitchCategories(data: { query: string }) {
  try {
    const { userId } = await auth();
    if (!userId || !(await isAdmin(userId))) {
      return { success: false as const, error: "Unauthorized" };
    }

    if (tooLong(data.query, MAX_SEARCH_QUERY)) {
      return { success: true as const, categories: [] };
    }

    const results = await searchCategories(data.query);
    return { success: true as const, categories: results };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "searchTwitchCategories" },
      extra: { query: data.query },
    });
    return { success: false as const, error: "Failed to search categories" };
  }
}
