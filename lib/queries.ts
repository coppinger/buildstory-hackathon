import { db } from "@/lib/db";
import {
  events,
  eventProjects,
  eventRegistrations,
  eventSubmissions,
  hackathonReviews,
  hackathonReviewHighlights,
  profiles,
  projects,
  teamInvites,
  projectMembers,
} from "@/lib/db/schema";
import {
  eq,
  ne,
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
import { getComputedEventState } from "@/lib/events";
import { getCountryName } from "@/lib/countries";
import { getRegionName } from "@/lib/regions";
import { DEFAULT_PAGE_SIZE, type SortOrder } from "@/lib/search-params";

/** Escape ILIKE wildcard characters so user input is matched literally. */
export function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

/**
 * Profile columns safe for public display.
 * Excludes: clerkId, role, allowInvites, bannedBy, banReason, hiddenBy,
 * discordCardDismissed, updatedAt.
 * Includes bannedAt/hiddenAt for isProfileVisible() filtering.
 */
const publicProfileColumns = {
  id: true,
  displayName: true,
  username: true,
  avatarUrl: true,
  bio: true,
  country: true,
  region: true,
  experienceLevel: true,
  websiteUrl: true,
  twitterHandle: true,
  githubHandle: true,
  twitchUrl: true,
  streamUrl: true,
  createdAt: true,
  bannedAt: true,
  hiddenAt: true,
} as const;

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
  type: "signup" | "project" | "team_join" | "submission";
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
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
            profile: { columns: publicProfileColumns },
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
      profile: { columns: publicProfileColumns },
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
      profile: { columns: publicProfileColumns },
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
      profile: { columns: publicProfileColumns },
      eventProjects: {
        with: { event: true },
      },
      members: {
        with: { profile: { columns: publicProfileColumns } },
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
      with: { profile: { columns: publicProfileColumns } },
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
    columns: publicProfileColumns,
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
    columns: { ...publicProfileColumns, clerkId: true },
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

  const [signups, projectCount, soloCount, teamCount, countryCount, submissionCount] =
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
      db
        .select({ count: count() })
        .from(eventSubmissions)
        .innerJoin(profiles, eq(eventSubmissions.profileId, profiles.id))
        .where(and(eq(eventSubmissions.eventId, eventId), notBannedOrHidden))
        .then(([r]) => r.count),
    ]);

  return { signups, projectCount, soloCount, teamCount, countryCount, submissionCount };
}

export async function getParticipantCountries(eventId: string) {
  const rows = await db
    .selectDistinct({ country: profiles.country })
    .from(eventRegistrations)
    .innerJoin(profiles, eq(eventRegistrations.profileId, profiles.id))
    .where(
      and(
        eq(eventRegistrations.eventId, eventId),
        isNotNull(profiles.country),
        isNull(profiles.bannedAt),
        isNull(profiles.hiddenAt)
      )
    );

  return rows.map((r) => r.country).filter((c): c is string => c !== null);
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
    with: { profile: { columns: publicProfileColumns } },
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

  const [signups, projectCreations, teamJoins, submissions] = await Promise.all([
    // Signups: event registrations
    db
      .select({
        displayName: profiles.displayName,
        username: profiles.username,
        avatarUrl: profiles.avatarUrl,
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
        avatarUrl: profiles.avatarUrl,
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
        avatarUrl: profiles.avatarUrl,
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

    // Submissions: final project submissions
    db
      .select({
        displayName: profiles.displayName,
        username: profiles.username,
        avatarUrl: profiles.avatarUrl,
        projectName: projects.name,
        timestamp: eventSubmissions.submittedAt,
      })
      .from(eventSubmissions)
      .innerJoin(profiles, eq(eventSubmissions.profileId, profiles.id))
      .innerJoin(projects, eq(eventSubmissions.projectId, projects.id))
      .where(and(eq(eventSubmissions.eventId, eventId), notBannedOrHidden))
      .orderBy(desc(eventSubmissions.submittedAt))
      .limit(limit),
  ]);

  const items: ActivityFeedItem[] = [
    ...signups.map((r) => ({
      type: "signup" as const,
      displayName: r.displayName,
      username: r.username,
      avatarUrl: r.avatarUrl,
      detail: null,
      timestamp: r.timestamp,
    })),
    ...projectCreations.map((r) => ({
      type: "project" as const,
      displayName: r.displayName,
      username: r.username,
      avatarUrl: r.avatarUrl,
      detail: r.projectName,
      timestamp: r.timestamp,
    })),
    ...teamJoins.map((r) => ({
      type: "team_join" as const,
      displayName: r.displayName,
      username: r.username,
      avatarUrl: r.avatarUrl,
      detail: r.projectName,
      timestamp: r.timestamp,
    })),
    ...submissions.map((r) => ({
      type: "submission" as const,
      displayName: r.displayName,
      username: r.username,
      avatarUrl: r.avatarUrl,
      detail: r.projectName,
      timestamp: r.timestamp,
    })),
  ];

  items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  return items.slice(0, limit);
}

// --- Submission Queries ---

export async function getSubmissionForProjectEvent(
  projectId: string,
  eventId: string
) {
  return db.query.eventSubmissions.findFirst({
    where: and(
      eq(eventSubmissions.projectId, projectId),
      eq(eventSubmissions.eventId, eventId)
    ),
    with: {
      tools: {
        with: { tool: true },
      },
    },
  });
}

export async function getEventSubmissions(
  eventId: string,
  page = 1,
  pageSize = 20
) {
  const notBannedOrHidden = and(
    isNull(profiles.bannedAt),
    isNull(profiles.hiddenAt)
  );

  const [{ totalCount }] = await db
    .select({ totalCount: count() })
    .from(eventSubmissions)
    .innerJoin(profiles, eq(eventSubmissions.profileId, profiles.id))
    .where(and(eq(eventSubmissions.eventId, eventId), notBannedOrHidden));

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const emptyResult = { items: [], totalCount: 0, page: 1, pageSize, totalPages: 1 };

  if (totalCount === 0) return emptyResult;

  const rows = await db
    .select({ submissionId: eventSubmissions.id })
    .from(eventSubmissions)
    .innerJoin(profiles, eq(eventSubmissions.profileId, profiles.id))
    .where(and(eq(eventSubmissions.eventId, eventId), notBannedOrHidden))
    .orderBy(desc(eventSubmissions.submittedAt))
    .limit(pageSize)
    .offset((safePage - 1) * pageSize);

  const ids = rows.map((r) => r.submissionId);

  const hydrated = await db.query.eventSubmissions.findMany({
    where: inArray(eventSubmissions.id, ids),
    with: {
      profile: { columns: publicProfileColumns },
      project: true,
      tools: {
        with: { tool: true },
      },
    },
  });

  const byId = new Map(hydrated.map((s) => [s.id, s]));
  const items = ids.map((id) => {
    const { tools: toolRels, profile, project, ...submission } = byId.get(id)!;
    return {
      submission,
      profile,
      project,
      tools: toolRels.map((t) => ({
        id: t.tool.id,
        name: t.tool.name,
        slug: t.tool.slug,
        category: t.tool.category,
      })),
    };
  });

  return { items, totalCount, page: safePage, pageSize, totalPages };
}

/** Fetch submission data for OG image generation by project slug */
export async function getSubmissionByProjectSlug(slug: string): Promise<{
  projectName: string;
  whatBuilt: string;
  lessonLearned: string | null;
  tools: string[];
  country: string | null;
  region: string | null;
} | null> {
  const eventId = await getHackathonEventId();
  if (!eventId) return null;

  const project = await db.query.projects.findFirst({
    where: eq(projects.slug, slug),
    columns: { id: true, name: true, profileId: true },
  });
  if (!project) return null;

  const [submission, profile] = await Promise.all([
    db.query.eventSubmissions.findFirst({
      where: and(
        eq(eventSubmissions.projectId, project.id),
        eq(eventSubmissions.eventId, eventId)
      ),
      columns: { whatBuilt: true, lessonLearned: true, profileId: true },
      with: {
        tools: {
          with: { tool: { columns: { name: true } } },
        },
      },
    }),
    db.query.profiles.findFirst({
      where: eq(profiles.id, project.profileId),
      columns: { country: true, region: true },
    }),
  ]);
  if (!submission) return null;

  return {
    projectName: project.name,
    whatBuilt: submission.whatBuilt,
    lessonLearned: submission.lessonLearned,
    tools: submission.tools.map((t) => t.tool.name),
    country: profile?.country ? getCountryName(profile.country) : null,
    region: profile?.region ? getRegionName(profile.region) : null,
  };
}

/** Check if a project has a submission for the hackathon event */
export async function hasHackathonSubmission(projectId: string): Promise<boolean> {
  const eventId = await getHackathonEventId();
  if (!eventId) return false;

  const row = await db.query.eventSubmissions.findFirst({
    where: and(
      eq(eventSubmissions.projectId, projectId),
      eq(eventSubmissions.eventId, eventId)
    ),
    columns: { id: true },
  });

  return !!row;
}

// --- Multi-Event Queries ---

/** Get all non-draft events, ordered by startsAt descending */
export async function getAllPublicEvents() {
  return db.query.events.findMany({
    where: ne(events.status, "draft"),
    orderBy: [desc(events.startsAt)],
  });
}

/** Get a single event by slug */
export async function getEventBySlug(slug: string) {
  return db.query.events.findFirst({
    where: eq(events.slug, slug),
  });
}

/** Get the registration count for a given event */
export async function getEventRegistrationCount(eventId: string): Promise<number> {
  const notBannedOrHidden = and(
    isNull(profiles.bannedAt),
    isNull(profiles.hiddenAt)
  );

  const [result] = await db
    .select({ count: count() })
    .from(eventRegistrations)
    .innerJoin(profiles, eq(eventRegistrations.profileId, profiles.id))
    .where(and(eq(eventRegistrations.eventId, eventId), notBannedOrHidden));

  return result.count;
}

/** Get submissions feed for an event (newest first, limited) */
export async function getSubmissionsFeed(eventId: string, limit = 10) {
  const notBannedOrHidden = and(
    isNull(profiles.bannedAt),
    isNull(profiles.hiddenAt)
  );

  const rows = await db
    .select({ submissionId: eventSubmissions.id })
    .from(eventSubmissions)
    .innerJoin(profiles, eq(eventSubmissions.profileId, profiles.id))
    .where(and(eq(eventSubmissions.eventId, eventId), notBannedOrHidden))
    .orderBy(desc(eventSubmissions.submittedAt))
    .limit(limit);

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.submissionId);
  const hydrated = await db.query.eventSubmissions.findMany({
    where: inArray(eventSubmissions.id, ids),
    with: {
      profile: { columns: publicProfileColumns },
      project: true,
      tools: {
        with: { tool: true },
      },
    },
  });

  const byId = new Map(hydrated.map((s) => [s.id, s]));
  return ids.map((id) => {
    const { tools: toolRels, profile, project, ...submission } = byId.get(id)!;
    return {
      submission,
      profile,
      project,
      tools: toolRels.map((t) => ({
        id: t.tool.id,
        name: t.tool.name,
        slug: t.tool.slug,
        category: t.tool.category,
      })),
    };
  });
}

/** Get hackathon event history for a project (events + submissions) */
export async function getProjectEventHistory(projectId: string) {
  const eps = await db.query.eventProjects.findMany({
    where: eq(eventProjects.projectId, projectId),
    with: {
      event: true,
    },
    orderBy: [desc(eventProjects.submittedAt)],
  });

  if (eps.length === 0) return [];

  const allSubmissions = await db.query.eventSubmissions.findMany({
    where: eq(eventSubmissions.projectId, projectId),
    with: {
      tools: {
        with: { tool: true },
      },
    },
  });
  const submissionsByEventId = new Map(allSubmissions.map((s) => [s.eventId, s]));

  return eps.map((ep) => {
    const submission = submissionsByEventId.get(ep.eventId);
    return {
      event: ep.event,
      state: getComputedEventState(ep.event),
      submission: submission
        ? {
            whatBuilt: submission.whatBuilt,
            demoUrl: submission.demoUrl,
            tools: submission.tools.map((t) => ({
              id: t.tool.id,
              name: t.tool.name,
            })),
          }
        : null,
    };
  });
}

/** Get the latest event with open registration */
export async function getLatestOpenEvent() {
  const allEvents = await db.query.events.findMany({
    orderBy: [desc(events.startsAt)],
  });

  return allEvents.find((e) => {
    const state = getComputedEventState(e);
    return state === "upcoming" || state === "active";
  }) ?? null;
}

// --- Review Queries ---

/** Get all reviews + highlights + reviewer profile for a project in an event */
export async function getReviewsForProject(projectId: string, eventId: string) {
  return db.query.hackathonReviews.findMany({
    where: and(
      eq(hackathonReviews.projectId, projectId),
      eq(hackathonReviews.eventId, eventId)
    ),
    with: {
      reviewer: { columns: publicProfileColumns },
      highlights: true,
    },
    orderBy: [desc(hackathonReviews.createdAt)],
  });
}

/** Aggregate highlight counts per project for an event */
export async function getReviewHighlightAggregates(eventId: string) {
  const [rows, reviewCounts] = await Promise.all([
    db
      .select({
        projectId: hackathonReviews.projectId,
        category: hackathonReviewHighlights.category,
        count: count(),
      })
      .from(hackathonReviewHighlights)
      .innerJoin(
        hackathonReviews,
        eq(hackathonReviewHighlights.reviewId, hackathonReviews.id)
      )
      .where(eq(hackathonReviews.eventId, eventId))
      .groupBy(hackathonReviews.projectId, hackathonReviewHighlights.category),
    db
      .select({
        projectId: hackathonReviews.projectId,
        count: count(),
      })
      .from(hackathonReviews)
      .where(eq(hackathonReviews.eventId, eventId))
      .groupBy(hackathonReviews.projectId),
  ]);

  const reviewCountMap = new Map(reviewCounts.map((r) => [r.projectId, r.count]));

  const result = new Map<
    string,
    { totalReviews: number; categories: { category: string; count: number }[] }
  >();

  for (const row of rows) {
    if (!result.has(row.projectId)) {
      result.set(row.projectId, {
        totalReviews: reviewCountMap.get(row.projectId) ?? 0,
        categories: [],
      });
    }
    result.get(row.projectId)!.categories.push({
      category: row.category,
      count: row.count,
    });
  }

  // Include projects that have reviews but no highlights
  for (const [projectId, totalReviews] of reviewCountMap) {
    if (!result.has(projectId)) {
      result.set(projectId, { totalReviews, categories: [] });
    }
  }

  return result;
}

/** Count of reviews submitted by a user for an event */
export async function getUserReviewCount(
  profileId: string,
  eventId: string
): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(hackathonReviews)
    .where(
      and(
        eq(hackathonReviews.reviewerProfileId, profileId),
        eq(hackathonReviews.eventId, eventId)
      )
    );
  return result.count;
}

/** Total submissions for an event (for progress denominator) */
export async function getEventSubmissionCount(eventId: string): Promise<number> {
  const notBannedOrHidden = and(
    isNull(profiles.bannedAt),
    isNull(profiles.hiddenAt)
  );

  const [result] = await db
    .select({ count: count() })
    .from(eventSubmissions)
    .innerJoin(profiles, eq(eventSubmissions.profileId, profiles.id))
    .where(and(eq(eventSubmissions.eventId, eventId), notBannedOrHidden));

  return result.count;
}
