import { db } from "@/lib/db";
import {
  featureBoardItems,
  featureBoardUpvotes,
  featureBoardCategories,
  featureBoardComments,
  profiles,
  projects,
  projectMembers,
} from "@/lib/db/schema";
import {
  eq,
  and,
  count,
  desc,
  ilike,
  inArray,
  isNull,
  not,
  asc,
  sql,
} from "drizzle-orm";
import { DEFAULT_PAGE_SIZE } from "@/lib/search-params";
import type { PaginatedResult } from "@/lib/queries";

type FeatureBoardStatus = typeof featureBoardItems.$inferSelect.status;

/** Escape ILIKE wildcard characters so user input is matched literally. */
function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

export interface RoadmapItemCategory {
  id: string;
  name: string;
  color: string;
}

export interface RoadmapItem {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  status: FeatureBoardStatus;
  categoryId: string | null;
  category: RoadmapItemCategory | null;
  upvoteCount: number;
  commentCount: number;
  shippedAt: Date | null;
  createdAt: Date;
  author: {
    id: string;
    displayName: string;
    username: string | null;
    avatarUrl: string | null;
  };
  hasUpvoted: boolean;
}

interface GetItemsParams {
  page: number;
  search?: string;
  sort: "most_upvoted" | "newest";
  status: string;
  profileId: string | null;
  isAdmin: boolean;
  /** When set, scope to items belonging to this project. When null/undefined, scope to platform items (projectId IS NULL). */
  projectId?: string | null;
}

export async function getFeatureBoardItems(
  params: GetItemsParams
): Promise<PaginatedResult<RoadmapItem>> {
  const pageSize = DEFAULT_PAGE_SIZE;
  const emptyResult: PaginatedResult<RoadmapItem> = {
    items: [],
    totalCount: 0,
    page: 1,
    pageSize,
    totalPages: 1,
  };

  const search = params.search?.trim();

  // Build where conditions
  const conditions = [
    // Project scoping: explicit projectId = scope to project, otherwise platform (NULL)
    params.projectId
      ? eq(featureBoardItems.projectId, params.projectId)
      : isNull(featureBoardItems.projectId),
    // Non-admins never see inbox, closed, or archived
    !params.isAdmin
      ? and(
          not(eq(featureBoardItems.status, "inbox")),
          not(eq(featureBoardItems.status, "closed")),
          not(eq(featureBoardItems.status, "archived"))
        )
      : undefined,
    // Status filter
    params.status !== "all"
      ? eq(
          featureBoardItems.status,
          params.status as FeatureBoardStatus
        )
      : undefined,
    // Search filter
    search
      ? ilike(featureBoardItems.title, `%${escapeIlike(search)}%`)
      : undefined,
  ].filter(Boolean);

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // 1. Get total count
  const [{ totalCount }] = await db
    .select({ totalCount: count() })
    .from(featureBoardItems)
    .where(whereClause);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const page = Math.max(1, Math.min(params.page, totalPages));

  if (totalCount === 0) return emptyResult;

  // 2. Get paginated items with author + category join
  const sortCol =
    params.sort === "most_upvoted"
      ? desc(featureBoardItems.upvoteCount)
      : desc(featureBoardItems.createdAt);

  const paginatedRows = await db
    .select({
      id: featureBoardItems.id,
      title: featureBoardItems.title,
      slug: featureBoardItems.slug,
      description: featureBoardItems.description,
      status: featureBoardItems.status,
      categoryId: featureBoardItems.categoryId,
      upvoteCount: featureBoardItems.upvoteCount,
      commentCount: featureBoardItems.commentCount,
      shippedAt: featureBoardItems.shippedAt,
      createdAt: featureBoardItems.createdAt,
      authorId: profiles.id,
      authorDisplayName: profiles.displayName,
      authorUsername: profiles.username,
      authorAvatarUrl: profiles.avatarUrl,
      catId: featureBoardCategories.id,
      catName: featureBoardCategories.name,
      catColor: featureBoardCategories.color,
    })
    .from(featureBoardItems)
    .innerJoin(profiles, eq(featureBoardItems.authorId, profiles.id))
    .leftJoin(
      featureBoardCategories,
      eq(featureBoardItems.categoryId, featureBoardCategories.id)
    )
    .where(whereClause)
    .orderBy(sortCol, desc(featureBoardItems.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  // 3. Check which items the user has upvoted
  let upvotedItemIds = new Set<string>();
  if (params.profileId && paginatedRows.length > 0) {
    const itemIds = paginatedRows.map((r) => r.id);
    const upvotes = await db
      .select({ itemId: featureBoardUpvotes.itemId })
      .from(featureBoardUpvotes)
      .where(
        and(
          eq(featureBoardUpvotes.profileId, params.profileId),
          inArray(featureBoardUpvotes.itemId, itemIds)
        )
      );
    upvotedItemIds = new Set(upvotes.map((u) => u.itemId));
  }

  const items: RoadmapItem[] = paginatedRows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    status: row.status,
    categoryId: row.categoryId,
    category: row.catId
      ? { id: row.catId, name: row.catName!, color: row.catColor! }
      : null,
    upvoteCount: row.upvoteCount,
    commentCount: row.commentCount,
    shippedAt: row.shippedAt,
    createdAt: row.createdAt,
    author: {
      id: row.authorId,
      displayName: row.authorDisplayName,
      username: row.authorUsername,
      avatarUrl: row.authorAvatarUrl,
    },
    hasUpvoted: upvotedItemIds.has(row.id),
  }));

  return { items, totalCount, page, pageSize, totalPages };
}

export async function getFeatureBoardItemBySlug(
  slug: string,
  profileId?: string | null
): Promise<
  | (RoadmapItem & {
      internalNotes: string | null;
      authorId: string;
      projectId: string | null;
      linearIssueId: string | null;
      linearIssueUrl: string | null;
    })
  | null
> {
  const row = await db
    .select({
      id: featureBoardItems.id,
      title: featureBoardItems.title,
      slug: featureBoardItems.slug,
      description: featureBoardItems.description,
      status: featureBoardItems.status,
      categoryId: featureBoardItems.categoryId,
      upvoteCount: featureBoardItems.upvoteCount,
      commentCount: featureBoardItems.commentCount,
      shippedAt: featureBoardItems.shippedAt,
      createdAt: featureBoardItems.createdAt,
      internalNotes: featureBoardItems.internalNotes,
      linearIssueId: featureBoardItems.linearIssueId,
      linearIssueUrl: featureBoardItems.linearIssueUrl,
      itemProjectId: featureBoardItems.projectId,
      itemAuthorId: featureBoardItems.authorId,
      authorId: profiles.id,
      authorDisplayName: profiles.displayName,
      authorUsername: profiles.username,
      authorAvatarUrl: profiles.avatarUrl,
      catId: featureBoardCategories.id,
      catName: featureBoardCategories.name,
      catColor: featureBoardCategories.color,
    })
    .from(featureBoardItems)
    .innerJoin(profiles, eq(featureBoardItems.authorId, profiles.id))
    .leftJoin(
      featureBoardCategories,
      eq(featureBoardItems.categoryId, featureBoardCategories.id)
    )
    .where(eq(featureBoardItems.slug, slug))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!row) return null;

  let hasUpvoted = false;
  if (profileId) {
    const upvote = await db.query.featureBoardUpvotes.findFirst({
      where: and(
        eq(featureBoardUpvotes.itemId, row.id),
        eq(featureBoardUpvotes.profileId, profileId)
      ),
    });
    hasUpvoted = !!upvote;
  }

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    status: row.status,
    categoryId: row.categoryId,
    category: row.catId
      ? { id: row.catId, name: row.catName!, color: row.catColor! }
      : null,
    upvoteCount: row.upvoteCount,
    commentCount: row.commentCount,
    shippedAt: row.shippedAt,
    createdAt: row.createdAt,
    internalNotes: row.internalNotes,
    linearIssueId: row.linearIssueId,
    linearIssueUrl: row.linearIssueUrl,
    projectId: row.itemProjectId,
    authorId: row.itemAuthorId,
    author: {
      id: row.authorId,
      displayName: row.authorDisplayName,
      username: row.authorUsername,
      avatarUrl: row.authorAvatarUrl,
    },
    hasUpvoted,
  };
}

export async function getStatusCounts(
  isAdmin: boolean,
  projectId?: string | null
): Promise<Record<string, number>> {
  const scopeFilter = projectId
    ? eq(featureBoardItems.projectId, projectId)
    : isNull(featureBoardItems.projectId);

  const rows = await db
    .select({
      status: featureBoardItems.status,
      count: count(),
    })
    .from(featureBoardItems)
    .where(scopeFilter)
    .groupBy(featureBoardItems.status);

  const counts: Record<string, number> = {};
  let allCount = 0;
  for (const row of rows) {
    // Non-admins skip inbox, closed, and archived
    if (
      !isAdmin &&
      (row.status === "inbox" ||
        row.status === "closed" ||
        row.status === "archived")
    ) {
      continue;
    }
    counts[row.status] = row.count;
    allCount += row.count;
  }
  counts.all = allCount;

  return counts;
}

export async function getKanbanItems(
  profileId?: string | null,
  isAdmin?: boolean,
  projectId?: string | null
): Promise<Record<string, RoadmapItem[]>> {
  const publicStatuses = ["now", "next", "exploring", "shipped"] as const;
  const adminStatuses = [
    "inbox",
    "now",
    "next",
    "exploring",
    "shipped",
    "closed",
    "archived",
  ] as const;
  const kanbanStatuses = isAdmin ? adminStatuses : publicStatuses;

  const scopeFilter = projectId
    ? eq(featureBoardItems.projectId, projectId)
    : isNull(featureBoardItems.projectId);

  const rows = await db
    .select({
      id: featureBoardItems.id,
      title: featureBoardItems.title,
      slug: featureBoardItems.slug,
      description: featureBoardItems.description,
      status: featureBoardItems.status,
      categoryId: featureBoardItems.categoryId,
      upvoteCount: featureBoardItems.upvoteCount,
      commentCount: featureBoardItems.commentCount,
      shippedAt: featureBoardItems.shippedAt,
      createdAt: featureBoardItems.createdAt,
      authorId: profiles.id,
      authorDisplayName: profiles.displayName,
      authorUsername: profiles.username,
      authorAvatarUrl: profiles.avatarUrl,
      catId: featureBoardCategories.id,
      catName: featureBoardCategories.name,
      catColor: featureBoardCategories.color,
    })
    .from(featureBoardItems)
    .innerJoin(profiles, eq(featureBoardItems.authorId, profiles.id))
    .leftJoin(
      featureBoardCategories,
      eq(featureBoardItems.categoryId, featureBoardCategories.id)
    )
    .where(and(scopeFilter, inArray(featureBoardItems.status, [...kanbanStatuses])))
    .orderBy(
      desc(featureBoardItems.upvoteCount),
      desc(featureBoardItems.createdAt)
    )
    .limit(200);

  // Check upvotes
  let upvotedItemIds = new Set<string>();
  if (profileId && rows.length > 0) {
    const itemIds = rows.map((r) => r.id);
    const upvotes = await db
      .select({ itemId: featureBoardUpvotes.itemId })
      .from(featureBoardUpvotes)
      .where(
        and(
          eq(featureBoardUpvotes.profileId, profileId),
          inArray(featureBoardUpvotes.itemId, itemIds)
        )
      );
    upvotedItemIds = new Set(upvotes.map((u) => u.itemId));
  }

  const result: Record<string, RoadmapItem[]> = {};
  for (const s of kanbanStatuses) {
    result[s] = [];
  }

  for (const row of rows) {
    const item: RoadmapItem = {
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      status: row.status,
      categoryId: row.categoryId,
      category: row.catId
        ? { id: row.catId, name: row.catName!, color: row.catColor! }
        : null,
      upvoteCount: row.upvoteCount,
      commentCount: row.commentCount,
      shippedAt: row.shippedAt,
      createdAt: row.createdAt,
      author: {
        id: row.authorId,
        displayName: row.authorDisplayName,
        username: row.authorUsername,
        avatarUrl: row.authorAvatarUrl,
      },
      hasUpvoted: upvotedItemIds.has(row.id),
    };
    if (row.status in result) {
      result[row.status].push(item);
    }
  }

  return result;
}

export interface FeatureBoardCategoryOption {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
}

export async function getFeatureBoardCategories(
  projectId?: string | null
): Promise<FeatureBoardCategoryOption[]> {
  const scopeFilter = projectId
    ? eq(featureBoardCategories.projectId, projectId)
    : isNull(featureBoardCategories.projectId);

  return db
    .select({
      id: featureBoardCategories.id,
      name: featureBoardCategories.name,
      color: featureBoardCategories.color,
      sortOrder: featureBoardCategories.sortOrder,
    })
    .from(featureBoardCategories)
    .where(scopeFilter)
    .orderBy(asc(featureBoardCategories.sortOrder));
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export interface RoadmapComment {
  id: string;
  itemId: string;
  body: string;
  parentCommentId: string | null;
  isEdited: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    displayName: string;
    username: string | null;
    avatarUrl: string | null;
  };
}

export async function getCommentsForItem(
  itemId: string
): Promise<RoadmapComment[] & { fetchedAt: number }> {
  const rows = await db
    .select({
      id: featureBoardComments.id,
      itemId: featureBoardComments.itemId,
      body: featureBoardComments.body,
      parentCommentId: featureBoardComments.parentCommentId,
      isEdited: featureBoardComments.isEdited,
      deletedAt: featureBoardComments.deletedAt,
      createdAt: featureBoardComments.createdAt,
      updatedAt: featureBoardComments.updatedAt,
      authorId: profiles.id,
      authorDisplayName: profiles.displayName,
      authorUsername: profiles.username,
      authorAvatarUrl: profiles.avatarUrl,
    })
    .from(featureBoardComments)
    .innerJoin(profiles, eq(featureBoardComments.authorId, profiles.id))
    .where(eq(featureBoardComments.itemId, itemId))
    .orderBy(desc(featureBoardComments.createdAt));

  const comments = rows.map((row) => ({
    id: row.id,
    itemId: row.itemId,
    body: row.body,
    parentCommentId: row.parentCommentId,
    isEdited: row.isEdited,
    deletedAt: row.deletedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    author: {
      id: row.authorId,
      displayName: row.authorDisplayName,
      username: row.authorUsername,
      avatarUrl: row.authorAvatarUrl,
    },
  }));

  return Object.assign(comments, { fetchedAt: Date.now() });
}

// ---------------------------------------------------------------------------
// Contributor Leaderboard
// ---------------------------------------------------------------------------

export interface LeaderboardEntry {
  profileId: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  ideasCount: number;
  shippedCount: number;
  commentsCount: number;
  upvotesCount: number;
  totalScore: number;
}

export async function getContributorLeaderboard(
  period: "all" | "month" = "all",
  projectId?: string | null
): Promise<LeaderboardEntry[]> {
  const periodFilter =
    period === "month"
      ? sql`AND created_at >= date_trunc('month', now())`
      : sql``;

  const projectFilter = projectId
    ? sql`AND project_id = ${projectId}`
    : sql`AND project_id IS NULL`;

  const result = await db.execute(sql`
    SELECT
      p.id AS "profileId",
      p.display_name AS "displayName",
      p.username,
      p.avatar_url AS "avatarUrl",
      COALESCE(ideas.cnt, 0)::int AS "ideasCount",
      COALESCE(shipped.cnt, 0)::int AS "shippedCount",
      COALESCE(comments.cnt, 0)::int AS "commentsCount",
      COALESCE(upvotes.cnt, 0)::int AS "upvotesCount",
      (
        COALESCE(ideas.cnt, 0) * 10 +
        COALESCE(shipped.cnt, 0) * 30 +
        COALESCE(comments.cnt, 0) * 3 +
        COALESCE(upvotes.cnt, 0) * 1
      )::int AS "totalScore"
    FROM profiles p
    LEFT JOIN (
      SELECT author_id, COUNT(*) AS cnt
      FROM feature_board_items
      WHERE status != 'archived' ${projectFilter} ${periodFilter}
      GROUP BY author_id
    ) ideas ON ideas.author_id = p.id
    LEFT JOIN (
      SELECT author_id, COUNT(*) AS cnt
      FROM feature_board_items
      WHERE status = 'shipped' ${projectFilter} ${periodFilter}
      GROUP BY author_id
    ) shipped ON shipped.author_id = p.id
    LEFT JOIN (
      SELECT author_id, COUNT(*) AS cnt
      FROM feature_board_comments
      WHERE deleted_at IS NULL ${periodFilter}
        AND item_id IN (SELECT id FROM feature_board_items WHERE true ${projectFilter})
      GROUP BY author_id
    ) comments ON comments.author_id = p.id
    LEFT JOIN (
      SELECT profile_id, COUNT(*) AS cnt
      FROM feature_board_upvotes
      WHERE true ${periodFilter}
        AND item_id IN (SELECT id FROM feature_board_items WHERE true ${projectFilter})
      GROUP BY profile_id
    ) upvotes ON upvotes.profile_id = p.id
    WHERE p.banned_at IS NULL AND p.hidden_at IS NULL
      AND (
        COALESCE(ideas.cnt, 0) +
        COALESCE(shipped.cnt, 0) +
        COALESCE(comments.cnt, 0) +
        COALESCE(upvotes.cnt, 0)
      ) > 0
    ORDER BY "totalScore" DESC
    LIMIT 50
  `);

  return result.rows as unknown as LeaderboardEntry[];
}

// ---------------------------------------------------------------------------
// Project admin check
// ---------------------------------------------------------------------------

/**
 * Check if a profile is an owner or member of a project.
 * Returns true if the profile owns the project or is listed as a team member.
 * Used to grant roadmap admin access (status changes, internal notes, Linear push,
 * category management) to all project collaborators.
 */
export async function isProjectOwnerOrMember(
  profileId: string,
  projectId: string
): Promise<boolean> {
  // Check if owner
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: { profileId: true },
  });
  if (!project) return false;
  if (project.profileId === profileId) return true;

  // Check if member
  const member = await db.query.projectMembers.findFirst({
    where: and(
      eq(projectMembers.projectId, projectId),
      eq(projectMembers.profileId, profileId)
    ),
  });
  return !!member;
}

// ---------------------------------------------------------------------------
// User search for @mentions
// ---------------------------------------------------------------------------

export async function searchUsersForMention(
  query: string
): Promise<
  { id: string; displayName: string; username: string | null; avatarUrl: string | null }[]
> {
  if (!query.trim()) return [];
  const escaped = escapeIlike(query.trim());

  const rows = await db
    .select({
      id: profiles.id,
      displayName: profiles.displayName,
      username: profiles.username,
      avatarUrl: profiles.avatarUrl,
    })
    .from(profiles)
    .where(
      and(
        isNull(profiles.bannedAt),
        isNull(profiles.hiddenAt),
        sql`(${profiles.displayName} ILIKE ${'%' + escaped + '%'} OR ${profiles.username} ILIKE ${'%' + escaped + '%'})`
      )
    )
    .limit(5);

  return rows;
}
