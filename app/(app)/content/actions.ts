"use server";

import { auth } from "@clerk/nextjs/server";
import { eq, and, sql, gte, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import { ensureProfile } from "@/lib/db/ensure-profile";
import {
  posts,
  postComments,
  reactions,
  projects,
  aiTools,
} from "@/lib/db/schema";
import { isUniqueViolation } from "@/lib/db/errors";
import {
  createPostSchema,
  createPostCommentSchema,
  parseInput,
} from "@/lib/db/validations";
import { isProjectOwnerOrMember } from "@/lib/roadmap/queries";

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

async function checkPostRateLimit(
  profileId: string
): Promise<string | null> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tenSecondsAgo = new Date(now.getTime() - 10 * 1000);

  const [recentPost] = await db
    .select({ createdAt: posts.createdAt })
    .from(posts)
    .where(
      and(
        eq(posts.authorId, profileId),
        gte(posts.createdAt, tenSecondsAgo)
      )
    )
    .limit(1);

  if (recentPost) {
    return "Please wait a few seconds before posting again.";
  }

  const [{ dayCount }] = await db
    .select({ dayCount: count() })
    .from(posts)
    .where(
      and(
        eq(posts.authorId, profileId),
        gte(posts.createdAt, oneDayAgo)
      )
    );

  if (dayCount >= 20) {
    return "You can create up to 20 posts per day. Please try again later.";
  }

  return null;
}

async function checkCommentRateLimit(
  profileId: string
): Promise<string | null> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tenSecondsAgo = new Date(now.getTime() - 10 * 1000);

  const [recentComment] = await db
    .select({ createdAt: postComments.createdAt })
    .from(postComments)
    .where(
      and(
        eq(postComments.authorId, profileId),
        gte(postComments.createdAt, tenSecondsAgo)
      )
    )
    .limit(1);

  if (recentComment) {
    return "Please wait a few seconds before commenting again.";
  }

  const [{ dayCount }] = await db
    .select({ dayCount: count() })
    .from(postComments)
    .where(
      and(
        eq(postComments.authorId, profileId),
        gte(postComments.createdAt, oneDayAgo)
      )
    );

  if (dayCount >= 30) {
    return "You can post up to 30 comments per day. Please try again later.";
  }

  return null;
}

async function checkReactionRateLimit(
  profileId: string
): Promise<string | null> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [{ dayCount }] = await db
    .select({ dayCount: count() })
    .from(reactions)
    .where(
      and(
        eq(reactions.profileId, profileId),
        gte(reactions.createdAt, oneDayAgo)
      )
    );

  if (dayCount >= 100) {
    return "You have reached the daily reaction limit. Please try again later.";
  }

  return null;
}

// ---------------------------------------------------------------------------
// Create Post
// ---------------------------------------------------------------------------

export async function createPost(data: {
  body: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
  contextType: "project" | "tool";
  contextId: string;
}): Promise<ActionResult<{ id: string }>> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  const profile = await ensureProfile(userId);
  if (!profile) return { success: false, error: "Profile not found" };

  const parsed = parseInput(createPostSchema, {
    body: data.body,
    imageUrl: data.imageUrl ?? null,
    linkUrl: data.linkUrl ?? null,
    contextType: data.contextType,
    contextId: data.contextId,
  });
  if (!parsed.success) return parsed;

  // Verify context and capture slug for revalidation
  let contextSlug: string | null = null;
  if (parsed.data.contextType === "project") {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, parsed.data.contextId),
      columns: { slug: true },
    });
    if (!project) {
      return { success: false, error: "Project not found" };
    }
    contextSlug = project.slug;
    const canPost = await isProjectOwnerOrMember(
      profile.id,
      parsed.data.contextId
    );
    if (!canPost) {
      return { success: false, error: "You must be a project owner or member to post updates" };
    }
  } else if (parsed.data.contextType === "tool") {
    const tool = await db.query.aiTools.findFirst({
      where: eq(aiTools.id, parsed.data.contextId),
      columns: { id: true, slug: true },
    });
    if (!tool) return { success: false, error: "Tool not found" };
    contextSlug = tool.slug;
  }

  // Rate limit
  const rateLimitError = await checkPostRateLimit(profile.id);
  if (rateLimitError) return { success: false, error: rateLimitError };

  try {
    const [inserted] = await db
      .insert(posts)
      .values({
        authorId: profile.id,
        body: parsed.data.body,
        imageUrl: parsed.data.imageUrl ?? null,
        linkUrl: parsed.data.linkUrl ?? null,
        contextType: parsed.data.contextType,
        contextId: parsed.data.contextId,
        source: "manual",
      })
      .returning({ id: posts.id });

    // Revalidate using the slug captured during verification
    if (contextSlug) {
      const prefix = parsed.data.contextType === "project" ? "/projects" : "/tools";
      revalidatePath(`${prefix}/${contextSlug}`);
    }

    return { success: true, data: { id: inserted.id } };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "createPost" },
      extra: { userId },
    });
    return { success: false, error: "Failed to create post" };
  }
}

// ---------------------------------------------------------------------------
// Submit Comment
// ---------------------------------------------------------------------------

export async function submitComment(data: {
  body: string;
  postId: string;
  parentCommentId?: string | null;
}): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  const profile = await ensureProfile(userId);
  if (!profile) return { success: false, error: "Profile not found" };

  const parsed = parseInput(createPostCommentSchema, {
    body: data.body,
    postId: data.postId,
    parentCommentId: data.parentCommentId ?? null,
  });
  if (!parsed.success) return parsed;

  // Fetch the post to determine contextType
  const post = await db.query.posts.findFirst({
    where: eq(posts.id, parsed.data.postId),
    columns: { id: true, contextType: true },
  });
  if (!post) return { success: false, error: "Post not found" };

  // Threading enforcement
  if (parsed.data.parentCommentId) {
    const parent = await db.query.postComments.findFirst({
      where: eq(postComments.id, parsed.data.parentCommentId),
      columns: { id: true, postId: true, parentCommentId: true },
    });
    if (!parent) return { success: false, error: "Parent comment not found" };
    if (parent.postId !== parsed.data.postId) {
      return { success: false, error: "Comment does not belong to this post" };
    }

    // Project context: flat only (no replies)
    if (post.contextType === "project") {
      return { success: false, error: "Replies are not supported on project updates" };
    }

    // Tool context: max depth 2 (reply to a reply is not allowed)
    if (post.contextType === "tool" && parent.parentCommentId !== null) {
      return { success: false, error: "Cannot reply to a reply" };
    }
  }

  // Rate limit
  const rateLimitError = await checkCommentRateLimit(profile.id);
  if (rateLimitError) return { success: false, error: rateLimitError };

  try {
    await db.transaction(async (tx) => {
      await tx.insert(postComments).values({
        postId: parsed.data.postId,
        authorId: profile.id,
        body: parsed.data.body,
        parentCommentId: parsed.data.parentCommentId ?? null,
      });
      await tx
        .update(posts)
        .set({ commentCount: sql`${posts.commentCount} + 1` })
        .where(eq(posts.id, parsed.data.postId));
    });

    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "submitComment" },
      extra: { postId: data.postId, userId },
    });
    return { success: false, error: "Failed to submit comment" };
  }
}

// ---------------------------------------------------------------------------
// Toggle Reaction
// ---------------------------------------------------------------------------

export async function toggleReaction(data: {
  targetType: "post" | "comment";
  targetId: string;
  emoji: "fire" | "rocket" | "lightbulb" | "clap" | "wrench";
}): Promise<ActionResult<{ reacted: boolean }>> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  const profile = await ensureProfile(userId);
  if (!profile) return { success: false, error: "Profile not found" };

  // Verify target exists before proceeding
  if (data.targetType === "post") {
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, data.targetId),
      columns: { id: true },
    });
    if (!post) return { success: false, error: "Post not found" };
  } else {
    const comment = await db.query.postComments.findFirst({
      where: eq(postComments.id, data.targetId),
      columns: { id: true },
    });
    if (!comment) return { success: false, error: "Comment not found" };
  }

  // Pre-check rate limit outside transaction (only matters for adding, not removing)
  const rateLimitError = await checkReactionRateLimit(profile.id);

  try {
    const result = await db.transaction(async (tx) => {
      const existing = await tx.query.reactions.findFirst({
        where: and(
          eq(reactions.targetType, data.targetType),
          eq(reactions.targetId, data.targetId),
          eq(reactions.profileId, profile.id),
          eq(reactions.emoji, data.emoji)
        ),
      });

      if (existing) {
        // Remove reaction — no rate limit needed
        await tx
          .delete(reactions)
          .where(eq(reactions.id, existing.id));

        if (data.targetType === "post") {
          await tx
            .update(posts)
            .set({
              reactionCount: sql`GREATEST(${posts.reactionCount} - 1, 0)`,
            })
            .where(eq(posts.id, data.targetId));
        } else {
          await tx
            .update(postComments)
            .set({
              reactionCount: sql`GREATEST(${postComments.reactionCount} - 1, 0)`,
            })
            .where(eq(postComments.id, data.targetId));
        }
        return { reacted: false };
      } else {
        // Adding — enforce rate limit
        if (rateLimitError) throw new Error(rateLimitError);

        await tx.insert(reactions).values({
          profileId: profile.id,
          targetType: data.targetType,
          targetId: data.targetId,
          emoji: data.emoji,
        });

        if (data.targetType === "post") {
          await tx
            .update(posts)
            .set({
              reactionCount: sql`${posts.reactionCount} + 1`,
            })
            .where(eq(posts.id, data.targetId));
        } else {
          await tx
            .update(postComments)
            .set({
              reactionCount: sql`${postComments.reactionCount} + 1`,
            })
            .where(eq(postComments.id, data.targetId));
        }
        return { reacted: true };
      }
    });

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof Error && error.message.includes("daily reaction limit")) {
      return { success: false, error: error.message };
    }
    if (isUniqueViolation(error, "reactions_target_type_target_id_profile_id_emoji_unique")) {
      return { success: true, data: { reacted: true } };
    }
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "toggleReaction" },
      extra: { targetType: data.targetType, targetId: data.targetId, userId },
    });
    return { success: false, error: "Failed to toggle reaction" };
  }
}
