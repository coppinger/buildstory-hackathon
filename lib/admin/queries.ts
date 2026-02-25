import { db } from "@/lib/db";
import {
  events,
  eventRegistrations,
  eventProjects,
  projects,
  profiles,
} from "@/lib/db/schema";
import { eq, and, gte, count, desc, sql } from "drizzle-orm";

export async function getHackathonEvent() {
  return db.query.events.findFirst({
    where: eq(events.slug, "hackathon-00"),
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
