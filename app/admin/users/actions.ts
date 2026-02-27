"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import { profiles, adminAuditLog } from "@/lib/db/schema";
import { isModerator, isAdmin, isSuperAdmin } from "@/lib/admin";

type ActionResult = { success: true } | { success: false; error: string };

async function getActorProfile(clerkUserId: string) {
  return db.query.profiles.findFirst({
    where: eq(profiles.clerkId, clerkUserId),
    columns: { id: true },
  });
}

async function logAudit(
  actorProfileId: string,
  action: string,
  targetProfileId: string | null,
  metadata?: Record<string, unknown>
) {
  await db.insert(adminAuditLog).values({
    actorProfileId,
    action,
    targetProfileId,
    metadata: metadata ? JSON.stringify(metadata) : null,
  });
}

export async function hideUser(data: {
  profileId: string;
}): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId || !(await isModerator(userId))) {
      return { success: false, error: "Unauthorized" };
    }

    const target = await db.query.profiles.findFirst({
      where: eq(profiles.id, data.profileId),
      columns: { id: true, clerkId: true, role: true, hiddenAt: true },
    });
    if (!target) return { success: false, error: "User not found" };
    if (target.hiddenAt) return { success: false, error: "User is already hidden" };
    if (isSuperAdmin(target.clerkId)) {
      return { success: false, error: "Cannot hide a super-admin" };
    }

    const actor = await getActorProfile(userId);
    if (!actor) return { success: false, error: "Actor profile not found" };

    await db
      .update(profiles)
      .set({ hiddenAt: new Date(), hiddenBy: actor.id })
      .where(eq(profiles.id, data.profileId));

    await logAudit(actor.id, "hide_user", data.profileId);

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "hideUser" },
      extra: { profileId: data.profileId },
    });
    return { success: false, error: "Failed to hide user" };
  }
}

export async function unhideUser(data: {
  profileId: string;
}): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId || !(await isModerator(userId))) {
      return { success: false, error: "Unauthorized" };
    }

    const target = await db.query.profiles.findFirst({
      where: eq(profiles.id, data.profileId),
      columns: { id: true, hiddenAt: true },
    });
    if (!target) return { success: false, error: "User not found" };
    if (!target.hiddenAt) return { success: false, error: "User is not hidden" };

    const actor = await getActorProfile(userId);
    if (!actor) return { success: false, error: "Actor profile not found" };

    await db
      .update(profiles)
      .set({ hiddenAt: null, hiddenBy: null })
      .where(eq(profiles.id, data.profileId));

    await logAudit(actor.id, "unhide_user", data.profileId);

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "unhideUser" },
      extra: { profileId: data.profileId },
    });
    return { success: false, error: "Failed to unhide user" };
  }
}

export async function banUser(data: {
  profileId: string;
  reason?: string;
}): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId || !(await isModerator(userId))) {
      return { success: false, error: "Unauthorized" };
    }

    const target = await db.query.profiles.findFirst({
      where: eq(profiles.id, data.profileId),
      columns: { id: true, clerkId: true, role: true, bannedAt: true },
    });
    if (!target) return { success: false, error: "User not found" };
    if (target.bannedAt) return { success: false, error: "User is already banned" };
    if (isSuperAdmin(target.clerkId)) {
      return { success: false, error: "Cannot ban a super-admin" };
    }
    // Moderators cannot ban admins
    if (!(await isAdmin(userId)) && target.role === "admin") {
      return { success: false, error: "Moderators cannot ban admins" };
    }

    const actor = await getActorProfile(userId);
    if (!actor) return { success: false, error: "Actor profile not found" };

    // Prevent self-ban
    if (actor.id === data.profileId) {
      return { success: false, error: "Cannot ban yourself" };
    }

    await db
      .update(profiles)
      .set({
        bannedAt: new Date(),
        bannedBy: actor.id,
        banReason: data.reason?.trim() || null,
      })
      .where(eq(profiles.id, data.profileId));

    // Disable login in Clerk
    const clerk = await clerkClient();
    await clerk.users.banUser(target.clerkId);

    await logAudit(actor.id, "ban_user", data.profileId, {
      reason: data.reason?.trim() || null,
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "banUser" },
      extra: { profileId: data.profileId },
    });
    return { success: false, error: "Failed to ban user" };
  }
}

export async function unbanUser(data: {
  profileId: string;
}): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId || !(await isAdmin(userId))) {
      return { success: false, error: "Only admins can unban users" };
    }

    const target = await db.query.profiles.findFirst({
      where: eq(profiles.id, data.profileId),
      columns: { id: true, clerkId: true, bannedAt: true },
    });
    if (!target) return { success: false, error: "User not found" };
    if (!target.bannedAt) return { success: false, error: "User is not banned" };

    const actor = await getActorProfile(userId);
    if (!actor) return { success: false, error: "Actor profile not found" };

    // Clear ban and hidden status
    await db
      .update(profiles)
      .set({
        bannedAt: null,
        bannedBy: null,
        banReason: null,
        hiddenAt: null,
        hiddenBy: null,
      })
      .where(eq(profiles.id, data.profileId));

    // Re-enable login in Clerk
    const clerk = await clerkClient();
    await clerk.users.unbanUser(target.clerkId);

    await logAudit(actor.id, "unban_user", data.profileId);

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "unbanUser" },
      extra: { profileId: data.profileId },
    });
    return { success: false, error: "Failed to unban user" };
  }
}
