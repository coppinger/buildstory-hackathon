import { db } from "@/lib/db";
import {
  events,
  eventRegistrations,
  eventProjects,
  projects,
  profiles,
  adminAuditLog,
} from "@/lib/db/schema";
import { eq, and, gte, count, desc, sql, isNotNull } from "drizzle-orm";
import { HACKATHON_SLUG } from "@/lib/constants";
import { clerkClient } from "@clerk/nextjs/server";

export async function getHackathonEvent() {
  return db.query.events.findFirst({
    where: eq(events.slug, HACKATHON_SLUG),
  });
}

export async function getTotalSignups(eventId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(eventRegistrations)
    .where(eq(eventRegistrations.eventId, eventId));
  return result.count;
}

export async function getTotalProjects(eventId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(eventProjects)
    .where(eq(eventProjects.eventId, eventId));
  return result.count;
}

export async function getTeamSeekers(eventId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(eventRegistrations)
    .where(
      and(
        eq(eventRegistrations.eventId, eventId),
        sql`${eventRegistrations.teamPreference} IN ('looking_for_team', 'has_team_open')`
      )
    );
  return result.count;
}

export async function getActiveToday(eventId: string) {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const [result] = await db
    .select({ count: count() })
    .from(eventRegistrations)
    .where(
      and(
        eq(eventRegistrations.eventId, eventId),
        gte(eventRegistrations.registeredAt, todayStart)
      )
    );
  return result.count;
}

export async function getSignupsOverTime(eventId: string) {
  const rows = await db
    .select({
      date: sql<string>`date(${eventRegistrations.registeredAt})`.as("date"),
      count: count(),
    })
    .from(eventRegistrations)
    .where(eq(eventRegistrations.eventId, eventId))
    .groupBy(sql`date(${eventRegistrations.registeredAt})`)
    .orderBy(sql`date(${eventRegistrations.registeredAt})`);

  return rows;
}

export async function getRecentActivity(eventId: string, limit = 20) {
  const recentSignups = await db
    .select({
      type: sql<"signup">`'signup'`.as("type"),
      displayName: profiles.displayName,
      detail: sql<string>`'registered'`.as("detail"),
      timestamp: eventRegistrations.registeredAt,
    })
    .from(eventRegistrations)
    .innerJoin(profiles, eq(eventRegistrations.profileId, profiles.id))
    .where(eq(eventRegistrations.eventId, eventId))
    .orderBy(desc(eventRegistrations.registeredAt))
    .limit(limit);

  const recentProjects = await db
    .select({
      type: sql<"project">`'project'`.as("type"),
      displayName: profiles.displayName,
      detail: projects.name,
      timestamp: eventProjects.submittedAt,
    })
    .from(eventProjects)
    .innerJoin(projects, eq(eventProjects.projectId, projects.id))
    .innerJoin(profiles, eq(projects.profileId, profiles.id))
    .where(eq(eventProjects.eventId, eventId))
    .orderBy(desc(eventProjects.submittedAt))
    .limit(limit);

  const merged = [...recentSignups, ...recentProjects]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);

  return merged;
}

export async function getDashboardStats(eventId: string) {
  const [totalSignups, totalProjects, teamSeekers, activeToday] =
    await Promise.all([
      getTotalSignups(eventId),
      getTotalProjects(eventId),
      getTeamSeekers(eventId),
      getActiveToday(eventId),
    ]);

  return { totalSignups, totalProjects, teamSeekers, activeToday };
}

// --- Admin User Management Queries ---

export interface AdminUser {
  id: string;
  clerkId: string;
  username: string | null;
  displayName: string;
  email: string;
  country: string | null;
  role: "user" | "moderator" | "admin";
  bannedAt: Date | null;
  hiddenAt: Date | null;
  banReason: string | null;
  createdAt: Date;
}

export async function getAdminUserList(): Promise<AdminUser[]> {
  const allProfiles = await db
    .select({
      id: profiles.id,
      clerkId: profiles.clerkId,
      username: profiles.username,
      displayName: profiles.displayName,
      country: profiles.country,
      role: profiles.role,
      bannedAt: profiles.bannedAt,
      hiddenAt: profiles.hiddenAt,
      banReason: profiles.banReason,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .orderBy(desc(profiles.createdAt));

  // Batch-fetch emails from Clerk
  const clerkIds = allProfiles.map((p) => p.clerkId);
  const clerkEmails = new Map<string, string>();

  const clerk = await clerkClient();
  for (let i = 0; i < clerkIds.length; i += 100) {
    const batch = clerkIds.slice(i, i + 100);
    const response = await clerk.users.getUserList({
      userId: batch,
      limit: 100,
    });
    for (const u of response.data) {
      clerkEmails.set(
        u.id,
        u.emailAddresses[0]?.emailAddress ?? ""
      );
    }
  }

  return allProfiles.map((p) => ({
    ...p,
    email: clerkEmails.get(p.clerkId) ?? "",
  }));
}

export async function getAdminUserDetail(profileId: string) {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, profileId),
    with: {
      projects: {
        with: {
          eventProjects: {
            with: { event: true },
          },
        },
      },
      eventRegistrations: {
        with: { event: true },
      },
    },
  });

  if (!profile) return null;

  // Fetch email from Clerk
  const clerk = await clerkClient();
  const clerkUser = await clerk.users.getUser(profile.clerkId);
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";

  // Fetch who banned/hid if applicable
  let bannedByName: string | null = null;
  if (profile.bannedBy) {
    const banner = await db.query.profiles.findFirst({
      where: eq(profiles.id, profile.bannedBy),
      columns: { displayName: true },
    });
    bannedByName = banner?.displayName ?? null;
  }

  let hiddenByName: string | null = null;
  if (profile.hiddenBy) {
    const hider = await db.query.profiles.findFirst({
      where: eq(profiles.id, profile.hiddenBy),
      columns: { displayName: true },
    });
    hiddenByName = hider?.displayName ?? null;
  }

  return { ...profile, email, bannedByName, hiddenByName };
}

// --- Audit Log Queries ---

export interface AuditLogEntry {
  id: string;
  action: string;
  actorName: string;
  targetName: string | null;
  metadata: string | null;
  createdAt: Date;
}

export async function getAuditLog(limit = 50): Promise<AuditLogEntry[]> {
  const rows = await db
    .select({
      id: adminAuditLog.id,
      action: adminAuditLog.action,
      actorName: sql<string>`actor.display_name`.as("actor_name"),
      targetName: sql<string | null>`target.display_name`.as("target_name"),
      metadata: adminAuditLog.metadata,
      createdAt: adminAuditLog.createdAt,
    })
    .from(adminAuditLog)
    .innerJoin(
      sql`${profiles} as actor`,
      sql`actor.id = ${adminAuditLog.actorProfileId}`
    )
    .leftJoin(
      sql`${profiles} as target`,
      sql`target.id = ${adminAuditLog.targetProfileId}`
    )
    .orderBy(desc(adminAuditLog.createdAt))
    .limit(limit);

  return rows;
}

export async function getAdminUserStats() {
  const [total, hidden, banned, elevated] = await Promise.all([
    db
      .select({ count: count() })
      .from(profiles)
      .then(([r]) => r.count),
    db
      .select({ count: count() })
      .from(profiles)
      .where(isNotNull(profiles.hiddenAt))
      .then(([r]) => r.count),
    db
      .select({ count: count() })
      .from(profiles)
      .where(isNotNull(profiles.bannedAt))
      .then(([r]) => r.count),
    db
      .select({ count: count() })
      .from(profiles)
      .where(sql`${profiles.role} IN ('admin', 'moderator')`)
      .then(([r]) => r.count),
  ]);

  return { total, hidden, banned, elevated };
}
