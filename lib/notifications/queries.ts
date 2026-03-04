import { db } from "@/lib/db";
import { notifications, profiles } from "@/lib/db/schema";
import { eq, and, desc, count } from "drizzle-orm";

export interface NotificationWithActor {
  id: string;
  type: typeof notifications.$inferSelect.type;
  title: string;
  body: string | null;
  href: string | null;
  isRead: boolean;
  createdAt: Date;
  actor: {
    id: string;
    displayName: string;
    username: string | null;
    avatarUrl: string | null;
  } | null;
}

export async function getUnreadNotifications(
  profileId: string
): Promise<NotificationWithActor[]> {
  const rows = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      title: notifications.title,
      body: notifications.body,
      href: notifications.href,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
      actorId: profiles.id,
      actorDisplayName: profiles.displayName,
      actorUsername: profiles.username,
      actorAvatarUrl: profiles.avatarUrl,
    })
    .from(notifications)
    .leftJoin(profiles, eq(notifications.actorProfileId, profiles.id))
    .where(
      and(
        eq(notifications.profileId, profileId),
        eq(notifications.isRead, false)
      )
    )
    .orderBy(desc(notifications.createdAt))
    .limit(20);

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    href: row.href,
    isRead: row.isRead,
    createdAt: row.createdAt,
    actor: row.actorId
      ? {
          id: row.actorId,
          displayName: row.actorDisplayName!,
          username: row.actorUsername,
          avatarUrl: row.actorAvatarUrl,
        }
      : null,
  }));
}

export async function getUnreadNotificationCount(
  profileId: string
): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.profileId, profileId),
        eq(notifications.isRead, false)
      )
    );
  return result.count;
}

export async function markNotificationAsRead(
  notificationId: string,
  profileId: string
): Promise<boolean> {
  const result = await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.profileId, profileId)
      )
    )
    .returning({ id: notifications.id });
  return result.length > 0;
}

export async function markAllNotificationsAsRead(
  profileId: string
): Promise<void> {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.profileId, profileId),
        eq(notifications.isRead, false)
      )
    );
}

/**
 * Create a notification row. Used from server actions to notify users of events.
 * Fire-and-forget — callers should not await or depend on the result.
 */
export async function createNotification(data: {
  profileId: string;
  type: typeof notifications.$inferSelect.type;
  title: string;
  body?: string;
  href?: string;
  actorProfileId?: string;
}): Promise<void> {
  await db.insert(notifications).values({
    profileId: data.profileId,
    type: data.type,
    title: data.title,
    body: data.body ?? null,
    href: data.href ?? null,
    actorProfileId: data.actorProfileId ?? null,
  });
}
