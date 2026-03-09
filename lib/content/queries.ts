import { cache } from "react";
import { db } from "@/lib/db";
import {
  aiTools,
  eventSubmissionTools,
  eventSubmissions,
  projects,
  profiles,
  posts,
  postComments,
  reactions,
} from "@/lib/db/schema";
import {
  eq,
  and,
  count,
  desc,
  inArray,
  isNull,
} from "drizzle-orm";

// ---------------------------------------------------------------------------
// Tool Queries
// ---------------------------------------------------------------------------

export interface ToolWithUsage {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  iconUrl: string | null;
  usageCount: number;
}

export async function getAllToolsWithUsage(): Promise<ToolWithUsage[]> {
  const rows = await db
    .select({
      id: aiTools.id,
      name: aiTools.name,
      slug: aiTools.slug,
      category: aiTools.category,
      description: aiTools.description,
      iconUrl: aiTools.iconUrl,
      usageCount: count(eventSubmissionTools.id),
    })
    .from(aiTools)
    .leftJoin(
      eventSubmissionTools,
      eq(aiTools.id, eventSubmissionTools.toolId)
    )
    .groupBy(aiTools.id)
    .orderBy(aiTools.category, aiTools.name);

  return rows;
}

interface ToolProject {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  owner: {
    displayName: string;
    username: string | null;
    avatarUrl: string | null;
  };
}

export interface ToolDetail extends ToolWithUsage {
  projects: ToolProject[];
}

export const getToolBySlug = cache(async function getToolBySlug(
  slug: string
): Promise<ToolDetail | null> {
  // Fetch tool with usage count
  const [tool] = await db
    .select({
      id: aiTools.id,
      name: aiTools.name,
      slug: aiTools.slug,
      category: aiTools.category,
      description: aiTools.description,
      iconUrl: aiTools.iconUrl,
      usageCount: count(eventSubmissionTools.id),
    })
    .from(aiTools)
    .leftJoin(
      eventSubmissionTools,
      eq(aiTools.id, eventSubmissionTools.toolId)
    )
    .where(eq(aiTools.slug, slug))
    .groupBy(aiTools.id)
    .limit(1);

  if (!tool) return null;

  // Fetch projects that used this tool
  const projectRows = await db
    .select({
      projectId: projects.id,
      projectName: projects.name,
      projectSlug: projects.slug,
      projectDescription: projects.description,
      ownerDisplayName: profiles.displayName,
      ownerUsername: profiles.username,
      ownerAvatarUrl: profiles.avatarUrl,
    })
    .from(eventSubmissionTools)
    .innerJoin(
      eventSubmissions,
      eq(eventSubmissionTools.submissionId, eventSubmissions.id)
    )
    .innerJoin(projects, eq(eventSubmissions.projectId, projects.id))
    .innerJoin(profiles, eq(projects.profileId, profiles.id))
    .where(
      and(
        eq(eventSubmissionTools.toolId, tool.id),
        isNull(profiles.bannedAt),
        isNull(profiles.hiddenAt)
      )
    )
    .groupBy(
      projects.id,
      projects.name,
      projects.slug,
      projects.description,
      profiles.displayName,
      profiles.username,
      profiles.avatarUrl
    );

  return {
    ...tool,
    projects: projectRows.map((r) => ({
      id: r.projectId,
      name: r.projectName,
      slug: r.projectSlug,
      description: r.projectDescription,
      owner: {
        displayName: r.ownerDisplayName,
        username: r.ownerUsername,
        avatarUrl: r.ownerAvatarUrl,
      },
    })),
  };
});

// ---------------------------------------------------------------------------
// Post Queries
// ---------------------------------------------------------------------------

export interface PostWithAuthor {
  id: string;
  body: string;
  imageUrl: string | null;
  linkUrl: string | null;
  contextType: "project" | "tool";
  contextId: string;
  source: string;
  reactionCount: number;
  commentCount: number;
  createdAt: Date;
  author: {
    id: string;
    displayName: string;
    username: string | null;
    avatarUrl: string | null;
  };
}

export interface PaginatedPosts {
  items: PostWithAuthor[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getPostsByContext(
  contextType: "project" | "tool",
  contextId: string,
  page = 1,
  pageSize = 20
): Promise<PaginatedPosts> {
  const emptyResult: PaginatedPosts = {
    items: [],
    totalCount: 0,
    page: 1,
    pageSize,
    totalPages: 1,
  };

  // Count total
  const [{ totalCount }] = await db
    .select({ totalCount: count() })
    .from(posts)
    .innerJoin(profiles, eq(posts.authorId, profiles.id))
    .where(
      and(
        eq(posts.contextType, contextType),
        eq(posts.contextId, contextId),
        isNull(profiles.bannedAt),
        isNull(profiles.hiddenAt)
      )
    );

  if (totalCount === 0) return emptyResult;

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.max(1, Math.min(page, totalPages));

  const rows = await db
    .select({
      id: posts.id,
      body: posts.body,
      imageUrl: posts.imageUrl,
      linkUrl: posts.linkUrl,
      contextType: posts.contextType,
      contextId: posts.contextId,
      source: posts.source,
      reactionCount: posts.reactionCount,
      commentCount: posts.commentCount,
      createdAt: posts.createdAt,
      authorId: profiles.id,
      authorDisplayName: profiles.displayName,
      authorUsername: profiles.username,
      authorAvatarUrl: profiles.avatarUrl,
    })
    .from(posts)
    .innerJoin(profiles, eq(posts.authorId, profiles.id))
    .where(
      and(
        eq(posts.contextType, contextType),
        eq(posts.contextId, contextId),
        isNull(profiles.bannedAt),
        isNull(profiles.hiddenAt)
      )
    )
    .orderBy(desc(posts.createdAt))
    .limit(pageSize)
    .offset((safePage - 1) * pageSize);

  return {
    items: rows.map((r) => ({
      id: r.id,
      body: r.body,
      imageUrl: r.imageUrl,
      linkUrl: r.linkUrl,
      contextType: r.contextType,
      contextId: r.contextId,
      source: r.source,
      reactionCount: r.reactionCount,
      commentCount: r.commentCount,
      createdAt: r.createdAt,
      author: {
        id: r.authorId,
        displayName: r.authorDisplayName,
        username: r.authorUsername,
        avatarUrl: r.authorAvatarUrl,
      },
    })),
    totalCount,
    page: safePage,
    pageSize,
    totalPages,
  };
}

// ---------------------------------------------------------------------------
// Comment Queries
// ---------------------------------------------------------------------------

export interface CommentWithAuthor {
  id: string;
  postId: string;
  body: string;
  parentCommentId: string | null;
  reactionCount: number;
  createdAt: Date;
  author: {
    id: string;
    displayName: string;
    username: string | null;
    avatarUrl: string | null;
  };
  replies: CommentWithAuthor[];
}

export async function getCommentsForPost(
  postId: string
): Promise<CommentWithAuthor[]> {
  const rows = await db
    .select({
      id: postComments.id,
      postId: postComments.postId,
      body: postComments.body,
      parentCommentId: postComments.parentCommentId,
      reactionCount: postComments.reactionCount,
      createdAt: postComments.createdAt,
      authorId: profiles.id,
      authorDisplayName: profiles.displayName,
      authorUsername: profiles.username,
      authorAvatarUrl: profiles.avatarUrl,
    })
    .from(postComments)
    .innerJoin(profiles, eq(postComments.authorId, profiles.id))
    .where(
      and(
        eq(postComments.postId, postId),
        isNull(profiles.bannedAt),
        isNull(profiles.hiddenAt)
      )
    )
    .orderBy(postComments.createdAt);

  // Build thread tree
  const commentMap = new Map<string, CommentWithAuthor>();
  const topLevel: CommentWithAuthor[] = [];

  for (const row of rows) {
    const comment: CommentWithAuthor = {
      id: row.id,
      postId: row.postId,
      body: row.body,
      parentCommentId: row.parentCommentId,
      reactionCount: row.reactionCount,
      createdAt: row.createdAt,
      author: {
        id: row.authorId,
        displayName: row.authorDisplayName,
        username: row.authorUsername,
        avatarUrl: row.authorAvatarUrl,
      },
      replies: [],
    };
    commentMap.set(comment.id, comment);

    if (!row.parentCommentId) {
      topLevel.push(comment);
    } else {
      const parent = commentMap.get(row.parentCommentId);
      if (parent) {
        parent.replies.push(comment);
      } else {
        // Orphan — treat as top-level
        topLevel.push(comment);
      }
    }
  }

  return topLevel;
}

// ---------------------------------------------------------------------------
// Reaction Queries
// ---------------------------------------------------------------------------

export async function getReactionSummaries(
  targetType: "post" | "comment",
  targetIds: string[]
): Promise<Map<string, Record<string, number>>> {
  if (targetIds.length === 0) return new Map();

  const rows = await db
    .select({
      targetId: reactions.targetId,
      emoji: reactions.emoji,
      count: count(),
    })
    .from(reactions)
    .where(
      and(
        eq(reactions.targetType, targetType),
        inArray(reactions.targetId, targetIds)
      )
    )
    .groupBy(reactions.targetId, reactions.emoji);

  const result = new Map<string, Record<string, number>>();
  for (const row of rows) {
    if (!result.has(row.targetId)) {
      result.set(row.targetId, {});
    }
    result.get(row.targetId)![row.emoji] = row.count;
  }
  return result;
}

export async function getUserReactions(
  profileId: string,
  targetType: "post" | "comment",
  targetIds: string[]
): Promise<Map<string, string[]>> {
  if (targetIds.length === 0) return new Map();

  const rows = await db
    .select({
      targetId: reactions.targetId,
      emoji: reactions.emoji,
    })
    .from(reactions)
    .where(
      and(
        eq(reactions.profileId, profileId),
        eq(reactions.targetType, targetType),
        inArray(reactions.targetId, targetIds)
      )
    );

  const result = new Map<string, string[]>();
  for (const row of rows) {
    if (!result.has(row.targetId)) {
      result.set(row.targetId, []);
    }
    result.get(row.targetId)!.push(row.emoji);
  }
  return result;
}
