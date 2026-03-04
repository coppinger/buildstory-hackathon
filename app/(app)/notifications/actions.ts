"use server";

import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { ensureProfile } from "@/lib/db/ensure-profile";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/notifications/queries";
import { revalidatePath } from "next/cache";

type ActionResult =
  | { success: true }
  | { success: false; error: string };

export async function markAsRead(
  notificationId: string
): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  const profile = await ensureProfile(userId);
  if (!profile) return { success: false, error: "Profile not found" };

  try {
    const updated = await markNotificationAsRead(notificationId, profile.id);
    if (!updated) return { success: false, error: "Notification not found" };

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "markAsRead" },
      extra: { notificationId, userId },
    });
    return { success: false, error: "Failed to mark notification as read" };
  }
}

export async function markAllAsRead(): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  const profile = await ensureProfile(userId);
  if (!profile) return { success: false, error: "Profile not found" };

  try {
    await markAllNotificationsAsRead(profile.id);
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "markAllAsRead" },
      extra: { userId },
    });
    return { success: false, error: "Failed to mark notifications as read" };
  }
}
