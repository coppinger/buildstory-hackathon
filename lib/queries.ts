import { db } from "@/lib/db";
import {
  events,
  eventProjects,
  eventRegistrations,
  profiles,
  projects,
} from "@/lib/db/schema";
import {
  eq,
  and,
  count,
  sql,
  desc,
  inArray,
  isNotNull,
  isNull,
} from "drizzle-orm";
import { HACKATHON_SLUG } from "@/lib/constants";

async function getHackathonEventId(): Promise<string | null> {
  const event = await db.query.events.findFirst({
    where: eq(events.slug, HACKATHON_SLUG),
    columns: { id: true },
  });
  return event?.id ?? null;
}

/** Profile is visible when not banned and not hidden */
function isProfileVisible(profile: {
  bannedAt: Date | null;
  hiddenAt: Date | null;
}) {
  return profile.bannedAt === null && profile.hiddenAt === null;
}

export async function getHackathonProjects() {
  const eventId = await getHackathonEventId();
  if (!eventId) return [];

  const entries = await db.query.eventProjects.findMany({
    where: eq(eventProjects.eventId, eventId),
    with: {
      project: {
        with: {
          profile: true,
        },
      },
    },
    orderBy: [desc(eventProjects.submittedAt)],
  });

  return entries
    .filter((ep) => isProfileVisible(ep.project.profile))
    .map((ep) => ep.project);
}

export async function getProjectBySlug(slug: string) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.slug, slug),
    with: {
      profile: true,
      eventProjects: {
        with: { event: true },
      },
    },
  });

  // Only return projects that are linked to at least one event
  if (!project || project.eventProjects.length === 0) return null;

  // Hide projects from banned/hidden users
  if (!isProfileVisible(project.profile)) return null;

  return project;
}

export async function getHackathonProfiles() {
  const eventId = await getHackathonEventId();
  if (!eventId) return [];

  const registrations = await db.query.eventRegistrations.findMany({
    where: eq(eventRegistrations.eventId, eventId),
    with: {
      profile: true,
    },
    orderBy: [desc(eventRegistrations.registeredAt)],
  });

  return registrations
    .filter((r) => isProfileVisible(r.profile))
    .map((r) => ({
      profile: r.profile,
      teamPreference: r.teamPreference,
    }));
}

export async function getProfileByUsername(username: string) {
  const eventId = await getHackathonEventId();

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.username, username),
    with: {
      projects: {
        with: {
          eventProjects: {
            with: { event: true },
          },
        },
      },
      eventRegistrations: true,
    },
  });

  if (!profile) return null;

  // Hide banned/hidden profiles
  if (!isProfileVisible(profile)) return null;

  // Only return the profile if they are registered for the hackathon
  if (eventId) {
    const isRegistered = profile.eventRegistrations.some(
      (r) => r.eventId === eventId
    );
    if (!isRegistered) return null;
  }

  // Filter projects to only those linked to an event
  const visibleProjects = profile.projects.filter(
    (p) => p.eventProjects.length > 0
  );

  return { ...profile, projects: visibleProjects };
}

export async function getPublicStats(eventId: string) {
  // All counts exclude banned/hidden profiles
  const notBannedOrHidden = and(
    isNull(profiles.bannedAt),
    isNull(profiles.hiddenAt)
  );

  const [signups, projectCount, soloCount, teamCount, countryCount] =
    await Promise.all([
      db
        .select({ count: count() })
        .from(eventRegistrations)
        .innerJoin(profiles, eq(eventRegistrations.profileId, profiles.id))
        .where(
          and(eq(eventRegistrations.eventId, eventId), notBannedOrHidden)
        )
        .then(([r]) => r.count),
      db
        .select({ count: count() })
        .from(eventProjects)
        .innerJoin(projects, eq(eventProjects.projectId, projects.id))
        .innerJoin(profiles, eq(projects.profileId, profiles.id))
        .where(and(eq(eventProjects.eventId, eventId), notBannedOrHidden))
        .then(([r]) => r.count),
      db
        .select({ count: count() })
        .from(eventRegistrations)
        .innerJoin(profiles, eq(eventRegistrations.profileId, profiles.id))
        .where(
          and(
            eq(eventRegistrations.eventId, eventId),
            eq(eventRegistrations.teamPreference, "solo"),
            notBannedOrHidden
          )
        )
        .then(([r]) => r.count),
      db
        .select({ count: count() })
        .from(eventRegistrations)
        .innerJoin(profiles, eq(eventRegistrations.profileId, profiles.id))
        .where(
          and(
            eq(eventRegistrations.eventId, eventId),
            inArray(eventRegistrations.teamPreference, [
              "has_team",
              "has_team_open",
            ]),
            notBannedOrHidden
          )
        )
        .then(([r]) => r.count),
      db
        .select({
          count:
            sql<number>`COUNT(DISTINCT ${profiles.country})`.as("count"),
        })
        .from(eventRegistrations)
        .innerJoin(profiles, eq(eventRegistrations.profileId, profiles.id))
        .where(
          and(
            eq(eventRegistrations.eventId, eventId),
            isNotNull(profiles.country),
            notBannedOrHidden
          )
        )
        .then(([r]) => r.count),
    ]);

  return { signups, projectCount, soloCount, teamCount, countryCount };
}
