import { db } from "@/lib/db";
import {
  events,
  eventProjects,
  eventRegistrations,
  profiles,
  projects,
  teamInvites,
  projectMembers,
} from "@/lib/db/schema";
import {
  eq,
  and,
  or,
  count,
  sql,
  desc,
  asc,
  ilike,
  inArray,
  isNotNull,
  isNull,
  aliasedTable,
} from "drizzle-orm";
import { HACKATHON_SLUG } from "@/lib/constants";
import { DEFAULT_PAGE_SIZE, type SortOrder } from "@/lib/search-params";

/** Escape ILIKE wildcard characters so user input is matched literally. */
function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

export interface PaginationParams {
  page: number;
  pageSize?: number;
}

export interface SearchSortParams extends PaginationParams {
  search?: string;
  sort?: SortOrder;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ActivityFeedItem {
  type: "signup" | "project" | "team_join";
  displayName: string;
  username: string | null;
  detail: string | null;
  timestamp: Date;
}

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

export async function getHackathonProjects(
  params?: SearchSortParams
) {
  const eventId = await getHackathonEventId();
  if (!params) {
    // Non-paginated path (backward compat)
    if (!eventId) return [];

    const entries = await db.query.eventProjects.findMany({
      where: eq(eventProjects.eventId, eventId),
      with: {
        project: {
          with: {
            profile: true,
            members: {
              with: {
                profile: {
                  columns: { id: true, displayName: true, username: true, avatarUrl: true },
                },
              },
            },
          },
        },
      },
      orderBy: [desc(eventProjects.submittedAt)],
    });

    return entries
      .filter((ep) => isProfileVisible(ep.project.profile))
      .map((ep) => ep.project);
  }

  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const emptyResult = { items: [], totalCount: 0, page: 1, pageSize, totalPages: 1 };

  if (!eventId) return emptyResult;

  const search = params.search?.trim();
  const sortDir = params.sort === "oldest" ? asc : desc;

  const visibilityFilter = and(
    eq(eventProjects.eventId, eventId),
    isNull(profiles.bannedAt),
    isNull(profiles.hiddenAt),
    search ? ilike(projects.name, `%${escapeIlike(search)}%`) : undefined
  );

  // 1. Get total count of visible projects
  const [{ totalCount }] = await db
    .select({ totalCount: count() })
    .from(eventProjects)
    .innerJoin(projects, eq(eventProjects.projectId, projects.id))
    .innerJoin(profiles, eq(projects.profileId, profiles.id))
    .where(visibilityFilter);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const page = Math.max(1, Math.min(params.page, totalPages));

  if (totalCount === 0) return emptyResult;

  // 2. Get the paginated project IDs
  const paginatedIds = await db
    .select({ projectId: eventProjects.projectId })
    .from(eventProjects)
    .innerJoin(projects, eq(eventProjects.projectId, projects.id))
    .innerJoin(profiles, eq(projects.profileId, profiles.id))
    .where(visibilityFilter)
    .orderBy(sortDir(eventProjects.submittedAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const ids = paginatedIds.map((r) => r.projectId);

  // 3. Hydrate with relational query (includes members)
  const hydrated = await db.query.projects.findMany({
    where: inArray(projects.id, ids),
    with: {
      profile: true,
      members: {
        with: {
          profile: {
            columns: { id: true, displayName: true, username: true, avatarUrl: true },
          },
        },
      },
    },
  });

  // Preserve the original sort order from step 2
  const byId = new Map(hydrated.map((p) => [p.id, p]));
  const items = ids.map((id) => byId.get(id)!);

  return { items, totalCount, page, pageSize, totalPages };
}

/** Get all hackathon projects owned by or joined by a specific profile */
export async function getUserHackathonProjects(profileId: string) {
  const eventId = await getHackathonEventId();
  if (!eventId) return [];

  // Get projects owned by the user that are linked to the hackathon
  const ownedEntries = await db
    .select({ projectId: eventProjects.projectId })
    .from(eventProjects)
    .innerJoin(projects, eq(eventProjects.projectId, projects.id))
    .where(
      and(
        eq(eventProjects.eventId, eventId),
        eq(projects.profileId, profileId)
      )
    );

  // Get projects the user is a member of that are linked to the hackathon
  const memberEntries = await db
    .select({ projectId: eventProjects.projectId })
    .from(eventProjects)
    .innerJoin(projectMembers, eq(eventProjects.projectId, projectMembers.projectId))
    .where(
      and(
        eq(eventProjects.eventId, eventId),
        eq(projectMembers.profileId, profileId)
      )
    );

  const allIds = [
    ...new Set([
      ...ownedEntries.map((r) => r.projectId),
      ...memberEntries.map((r) => r.projectId),
    ]),
  ];

  if (allIds.length === 0) return [];

  const hydrated = await db.query.projects.findMany({
    where: inArray(projects.id, allIds),
    with: {
      profile: true,
      members: {
        with: {
          profile: {
            columns: { id: true, displayName: true, username: true, avatarUrl: true },
          },
        },
      },
    },
  });

  return hydrated;
}

export async function getProjectBySlug(slug: string) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.slug, slug),
    with: {
      profile: true,
      eventProjects: {
        with: { event: true },
      },
      members: {
        with: { profile: true },
      },
    },
  });

  // Only return projects that are linked to at least one event
  if (!project || project.eventProjects.length === 0) return null;

  // Hide projects from banned/hidden users
  if (!isProfileVisible(project.profile)) return null;

  return project;
}

export async function getHackathonProfiles(
  params?: SearchSortParams
) {
  const eventId = await getHackathonEventId();
  if (!params) {
    // Non-paginated path (backward compat)
    if (!eventId) return [];

    const registrations = await db.query.eventRegistrations.findMany({
      where: eq(eventRegistrations.eventId, eventId),
      with: { profile: true },
      orderBy: [desc(eventRegistrations.registeredAt)],
    });

    return registrations
      .filter((r) => isProfileVisible(r.profile))
      .map((r) => ({ profile: r.profile, teamPreference: r.teamPreference }));
  }

  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const emptyResult = { items: [], totalCount: 0, page: 1, pageSize, totalPages: 1 };

  if (!eventId) return emptyResult;

  const search = params.search?.trim();
  const sortDir = params.sort === "oldest" ? asc : desc;

  const visibilityFilter = and(
    eq(eventRegistrations.eventId, eventId),
    isNull(profiles.bannedAt),
    isNull(profiles.hiddenAt),
    search
      ? or(
          ilike(profiles.displayName, `%${escapeIlike(search)}%`),
          ilike(profiles.username, `%${escapeIlike(search)}%`)
        )
      : undefined
  );

  const [{ totalCount }] = await db
    .select({ totalCount: count() })
    .from(eventRegistrations)
    .innerJoin(profiles, eq(eventRegistrations.profileId, profiles.id))
    .where(visibilityFilter);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const page = Math.max(1, Math.min(params.page, totalPages));

  if (totalCount === 0) return emptyResult;

  const rows = await db
    .select({
      profileId: eventRegistrations.profileId,
      teamPreference: eventRegistrations.teamPreference,
    })
    .from(eventRegistrations)
    .innerJoin(profiles, eq(eventRegistrations.profileId, profiles.id))
    .where(visibilityFilter)
    .orderBy(sortDir(eventRegistrations.registeredAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const profileIds = rows.map((r) => r.profileId);
  const teamPrefMap = new Map(rows.map((r) => [r.profileId, r.teamPreference]));

  const hydratedProfiles = await db.query.profiles.findMany({
    where: inArray(profiles.id, profileIds),
  });

  // Preserve the sort order from the paginated query
  const byId = new Map(hydratedProfiles.map((p) => [p.id, p]));
  const items = profileIds.map((id) => ({
    profile: byId.get(id)!,
    teamPreference: teamPrefMap.get(id)!,
  }));

  return { items, totalCount, page, pageSize, totalPages };
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

// --- Team & Invite Queries ---

export async function getPendingInvitesForUser(profileId: string) {
  return db.query.teamInvites.findMany({
    where: and(
      eq(teamInvites.recipientId, profileId),
      eq(teamInvites.type, "direct"),
      eq(teamInvites.status, "pending")
    ),
    with: {
      project: {
        columns: { id: true, name: true, slug: true },
      },
      sender: {
        columns: { displayName: true, username: true, avatarUrl: true },
      },
    },
    orderBy: [desc(teamInvites.createdAt)],
  });
}

export async function getProjectMembers(projectId: string) {
  const members = await db.query.projectMembers.findMany({
    where: eq(projectMembers.projectId, projectId),
    with: { profile: true },
  });
  return members.filter((m) => isProfileVisible(m.profile));
}

export async function getProjectPendingInvites(projectId: string) {
  return db.query.teamInvites.findMany({
    where: and(
      eq(teamInvites.projectId, projectId),
      eq(teamInvites.status, "pending")
    ),
    with: {
      recipient: {
        columns: { id: true, displayName: true, username: true, avatarUrl: true },
      },
    },
    orderBy: [desc(teamInvites.createdAt)],
  });
}

export async function getInviteByToken(token: string) {
  return db.query.teamInvites.findFirst({
    where: and(
      eq(teamInvites.token, token),
      eq(teamInvites.type, "link"),
      eq(teamInvites.status, "pending")
    ),
    with: {
      project: {
        with: {
          profile: {
            columns: { id: true, displayName: true, username: true, avatarUrl: true },
          },
        },
      },
      sender: {
        columns: { displayName: true, username: true, avatarUrl: true },
      },
    },
  });
}

export async function getSenderPendingInviteCount(profileId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(teamInvites)
    .where(
      and(
        eq(teamInvites.senderId, profileId),
        eq(teamInvites.status, "pending")
      )
    );
  return result.count;
}

// --- Public Activity Feed ---

export async function getPublicActivityFeed(
  limit = 50
): Promise<ActivityFeedItem[]> {
  const eventId = await getHackathonEventId();
  if (!eventId) return [];

  const notBannedOrHidden = and(
    isNull(profiles.bannedAt),
    isNull(profiles.hiddenAt)
  );

  const ownerProfiles = aliasedTable(profiles, "owner_profiles");

  const [signups, projectCreations, teamJoins] = await Promise.all([
    // Signups: event registrations
    db
      .select({
        displayName: profiles.displayName,
        username: profiles.username,
        timestamp: eventRegistrations.registeredAt,
      })
      .from(eventRegistrations)
      .innerJoin(profiles, eq(eventRegistrations.profileId, profiles.id))
      .where(and(eq(eventRegistrations.eventId, eventId), notBannedOrHidden))
      .orderBy(desc(eventRegistrations.registeredAt))
      .limit(limit),

    // Project creations: projects linked to the hackathon
    db
      .select({
        displayName: profiles.displayName,
        username: profiles.username,
        projectName: projects.name,
        timestamp: eventProjects.submittedAt,
      })
      .from(eventProjects)
      .innerJoin(projects, eq(eventProjects.projectId, projects.id))
      .innerJoin(profiles, eq(projects.profileId, profiles.id))
      .where(and(eq(eventProjects.eventId, eventId), notBannedOrHidden))
      .orderBy(desc(eventProjects.submittedAt))
      .limit(limit),

    // Team joins: project members on hackathon projects
    // Also filter out projects whose owner is banned/hidden
    db
      .select({
        displayName: profiles.displayName,
        username: profiles.username,
        projectName: projects.name,
        timestamp: projectMembers.joinedAt,
      })
      .from(projectMembers)
      .innerJoin(profiles, eq(projectMembers.profileId, profiles.id))
      .innerJoin(projects, eq(projectMembers.projectId, projects.id))
      .innerJoin(eventProjects, eq(eventProjects.projectId, projects.id))
      .innerJoin(ownerProfiles, eq(projects.profileId, ownerProfiles.id))
      .where(
        and(
          eq(eventProjects.eventId, eventId),
          notBannedOrHidden,
          isNull(ownerProfiles.bannedAt),
          isNull(ownerProfiles.hiddenAt)
        )
      )
      .orderBy(desc(projectMembers.joinedAt))
      .limit(limit),
  ]);

  const items: ActivityFeedItem[] = [
    ...signups.map((r) => ({
      type: "signup" as const,
      displayName: r.displayName,
      username: r.username,
      detail: null,
      timestamp: r.timestamp,
    })),
    ...projectCreations.map((r) => ({
      type: "project" as const,
      displayName: r.displayName,
      username: r.username,
      detail: r.projectName,
      timestamp: r.timestamp,
    })),
    ...teamJoins.map((r) => ({
      type: "team_join" as const,
      displayName: r.displayName,
      username: r.username,
      detail: r.projectName,
      timestamp: r.timestamp,
    })),
  ];

  items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  return items.slice(0, limit);
}
