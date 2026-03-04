"use server";

import { auth } from "@clerk/nextjs/server";
import { eq, and, sql, gte, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import { ensureProfile } from "@/lib/db/ensure-profile";
import {
  featureBoardItems,
  featureBoardUpvotes,
  featureBoardComments,
  featureBoardCategories,
  profiles,
  projects,
} from "@/lib/db/schema";
import { isUniqueViolation } from "@/lib/db/errors";
import { isModerator } from "@/lib/admin";
import {
  submitIdeaSchema,
  updateFeatureBoardItemSchema,
  submitCommentSchema,
  editCommentSchema,
  parseInput,
} from "@/lib/db/validations";
import { createNotification } from "@/lib/notifications/queries";
import { notifyShippedItem } from "@/lib/discord";
import { createLinearIssueFromRoadmapItem } from "@/lib/linear";
import { isProjectOwnerOrMember, searchUsersForMention } from "@/lib/roadmap/queries";

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/** 15 minutes in milliseconds */
const AUTHOR_EDIT_WINDOW_MS = 15 * 60 * 1000;

/** Truncate a string for use in notification titles */
function truncateTitle(title: string, max = 60): string {
  return title.length <= max ? title : title.slice(0, max - 1) + "\u2026";
}

/** Build the correct href for a roadmap item, accounting for project scope */
async function buildItemHref(
  itemSlug: string | null,
  itemProjectId: string | null
): Promise<string> {
  if (!itemSlug) {
    return itemProjectId ? "/roadmap" : "/roadmap";
  }
  if (!itemProjectId) {
    return `/roadmap/${itemSlug}`;
  }
  // Project-scoped item — need to fetch project slug
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, itemProjectId),
    columns: { slug: true },
  });
  if (!project?.slug) {
    return `/roadmap/${itemSlug}`;
  }
  return `/projects/${project.slug}/roadmap/${itemSlug}`;
}

// ---------------------------------------------------------------------------
// Rate limiting helpers (in-memory per serverless invocation + DB-backed)
// ---------------------------------------------------------------------------

async function checkIdeaRateLimit(
  profileId: string
): Promise<string | null> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

  // Check 1-minute cooldown (most recent item)
  const [recentItem] = await db
    .select({ createdAt: featureBoardItems.createdAt })
    .from(featureBoardItems)
    .where(
      and(
        eq(featureBoardItems.authorId, profileId),
        gte(featureBoardItems.createdAt, oneMinuteAgo)
      )
    )
    .limit(1);

  if (recentItem) {
    return "Please wait a minute before submitting another idea.";
  }

  // Check 5-per-day limit
  const [{ dayCount }] = await db
    .select({ dayCount: count() })
    .from(featureBoardItems)
    .where(
      and(
        eq(featureBoardItems.authorId, profileId),
        gte(featureBoardItems.createdAt, oneDayAgo)
      )
    );

  if (dayCount >= 5) {
    return "You can submit up to 5 ideas per day. Please try again later.";
  }

  return null;
}

async function checkUpvoteRateLimit(
  profileId: string
): Promise<string | null> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [{ dayCount }] = await db
    .select({ dayCount: count() })
    .from(featureBoardUpvotes)
    .where(
      and(
        eq(featureBoardUpvotes.profileId, profileId),
        gte(featureBoardUpvotes.createdAt, oneDayAgo)
      )
    );

  if (dayCount >= 50) {
    return "You have reached the daily upvote limit. Please try again later.";
  }

  return null;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function submitIdea(data: {
  title: string;
  description?: string;
  categoryId?: string;
  projectId?: string;
}): Promise<ActionResult<{ slug: string | null }>> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  const profile = await ensureProfile(userId);
  if (!profile) return { success: false, error: "Profile not found" };

  const parsed = parseInput(submitIdeaSchema, {
    title: data.title,
    description: data.description || null,
    categoryId: data.categoryId || null,
  });
  if (!parsed.success) return parsed;

  // Validate projectId if provided — must be a real project
  if (data.projectId) {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, data.projectId),
      columns: { id: true },
    });
    if (!project) return { success: false, error: "Project not found" };
  }

  // Rate limiting
  const rateLimitError = await checkIdeaRateLimit(profile.id);
  if (rateLimitError) return { success: false, error: rateLimitError };

  try {
    let slug = slugify(parsed.data.title);
    if (!slug) slug = crypto.randomUUID().slice(0, 8);

    const [item] = await db
      .insert(featureBoardItems)
      .values({
        title: parsed.data.title,
        slug,
        description: parsed.data.description ?? null,
        categoryId: parsed.data.categoryId ?? null,
        authorId: profile.id,
        projectId: data.projectId ?? null,
        status: "inbox",
      })
      .returning({ slug: featureBoardItems.slug });

    revalidatePath("/roadmap");
    return { success: true, data: { slug: item.slug } };
  } catch (error) {
    // Slug collision — retry with random suffix
    if (isUniqueViolation(error, "idx_feature_board_items_platform_slug") ||
      isUniqueViolation(error, "idx_feature_board_items_project_slug")) {
      try {
        const slug = `${slugify(parsed.data.title).slice(0, 70)}-${crypto.randomUUID().slice(0, 6)}`;
        const [item] = await db
          .insert(featureBoardItems)
          .values({
            title: parsed.data.title,
            slug,
            description: parsed.data.description ?? null,
            categoryId: parsed.data.categoryId ?? null,
            authorId: profile.id,
            projectId: data.projectId ?? null,
            status: "inbox",
          })
          .returning({ slug: featureBoardItems.slug });

        revalidatePath("/roadmap");
        return { success: true, data: { slug: item.slug } };
      } catch (retryError) {
        Sentry.captureException(retryError, {
          tags: { component: "server-action", action: "submitIdea" },
        });
        return { success: false, error: "Failed to submit idea" };
      }
    }

    Sentry.captureException(error, {
      tags: { component: "server-action", action: "submitIdea" },
      extra: { userId },
    });
    return { success: false, error: "Failed to submit idea" };
  }
}

export async function updateItem(data: {
  itemId: string;
  title?: string;
  slug?: string;
  description?: string;
  status?: string;
  categoryId?: string;
  internalNotes?: string;
  /** Pass projectId to use project-level admin auth instead of platform moderator check */
  projectId?: string;
}): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  const profile = await ensureProfile(userId);
  if (!profile) return { success: false, error: "Profile not found" };

  const existing = await db.query.featureBoardItems.findFirst({
    where: eq(featureBoardItems.id, data.itemId),
  });
  if (!existing) return { success: false, error: "Item not found" };

  // Verify item belongs to the claimed project scope
  if (data.projectId && existing.projectId !== data.projectId) {
    return { success: false, error: "Item does not belong to this project" };
  }

  const isAuthor = existing.authorId === profile.id;

  // Determine admin access: project board uses project owner/member, platform uses moderator
  let isMod: boolean;
  if (data.projectId) {
    isMod = await isProjectOwnerOrMember(profile.id, data.projectId);
  } else {
    isMod = await isModerator(userId);
  }

  // Author edit: only within 15-minute window and only title/description/categoryId
  if (isAuthor && !isMod) {
    const elapsed = Date.now() - existing.createdAt.getTime();
    if (elapsed > AUTHOR_EDIT_WINDOW_MS) {
      return {
        success: false,
        error: "The 15-minute edit window has passed.",
      };
    }
    // Authors can only change title, description, and categoryId
    if (
      data.status !== undefined ||
      data.slug !== undefined ||
      data.internalNotes !== undefined
    ) {
      return { success: false, error: "You can only edit title, description, and category." };
    }
  } else if (!isMod) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = parseInput(updateFeatureBoardItemSchema, {
    title: data.title ?? existing.title,
    slug: data.slug ?? existing.slug,
    description: data.description ?? existing.description,
    status: data.status ?? existing.status,
    categoryId: data.categoryId ?? existing.categoryId,
    internalNotes: data.internalNotes ?? existing.internalNotes,
  });
  if (!parsed.success) return parsed;

  try {
    const updates: Record<string, unknown> = {
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: parsed.data.description,
      status: parsed.data.status,
      categoryId: parsed.data.categoryId,
      internalNotes: parsed.data.internalNotes,
    };

    // Handle shippedAt based on status transitions
    if (parsed.data.status === "shipped" && existing.status !== "shipped") {
      updates.shippedAt = new Date();
    } else if (
      parsed.data.status !== "shipped" &&
      existing.status === "shipped"
    ) {
      updates.shippedAt = null;
    }

    await db
      .update(featureBoardItems)
      .set(updates)
      .where(eq(featureBoardItems.id, data.itemId));

    // Notify author when item transitions to "shipped"
    if (parsed.data.status === "shipped" && existing.status !== "shipped") {
      try {
        // Notify item author
        if (existing.authorId !== profile.id) {
          const itemHref = await buildItemHref(existing.slug, existing.projectId);
          await createNotification({
            profileId: existing.authorId,
            type: "item_shipped",
            title: `Your idea "${truncateTitle(existing.title)}" has been shipped!`,
            href: itemHref,
            actorProfileId: profile.id,
          });
        }

        // Fetch author name for Discord notification
        const author = await db.query.profiles.findFirst({
          where: eq(profiles.id, existing.authorId),
          columns: { displayName: true },
        });
        notifyShippedItem(
          existing.title,
          author?.displayName ?? "Unknown",
          existing.slug ?? ""
        );
      } catch {
        // Non-blocking — don't fail the action
      }
    }

    revalidatePath("/roadmap");
    if (existing.slug) revalidatePath(`/roadmap/${existing.slug}`);
    return { success: true };
  } catch (error) {
    if (isUniqueViolation(error, "idx_feature_board_items_platform_slug") ||
      isUniqueViolation(error, "idx_feature_board_items_project_slug")) {
      return { success: false, error: "That URL slug is already taken" };
    }
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "updateItem" },
      extra: { itemId: data.itemId },
    });
    return { success: false, error: "Failed to update item" };
  }
}

export async function archiveItem(data: {
  itemId: string;
  /** Pass projectId to use project-level admin auth instead of platform moderator check */
  projectId?: string;
}): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  let authorized: boolean;
  if (data.projectId) {
    const profile = await ensureProfile(userId);
    if (!profile) return { success: false, error: "Profile not found" };
    authorized = await isProjectOwnerOrMember(profile.id, data.projectId);
  } else {
    authorized = await isModerator(userId);
  }
  if (!authorized) return { success: false, error: "Unauthorized" };

  try {
    // Verify item exists and belongs to the claimed project scope
    const item = await db.query.featureBoardItems.findFirst({
      where: eq(featureBoardItems.id, data.itemId),
      columns: { projectId: true },
    });
    if (!item) return { success: false, error: "Item not found" };
    if (data.projectId && item.projectId !== data.projectId) {
      return { success: false, error: "Item does not belong to this project" };
    }

    await db
      .update(featureBoardItems)
      .set({ status: "archived" })
      .where(eq(featureBoardItems.id, data.itemId));

    revalidatePath("/roadmap");
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "archiveItem" },
      extra: { itemId: data.itemId },
    });
    return { success: false, error: "Failed to archive item" };
  }
}

export async function toggleUpvote(data: {
  itemId: string;
}): Promise<ActionResult<{ upvoted: boolean; count: number }>> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  const profile = await ensureProfile(userId);
  if (!profile) return { success: false, error: "Profile not found" };

  try {
    const result = await db.transaction(async (tx) => {
      const existing = await tx.query.featureBoardUpvotes.findFirst({
        where: and(
          eq(featureBoardUpvotes.itemId, data.itemId),
          eq(featureBoardUpvotes.profileId, profile.id)
        ),
      });

      if (existing) {
        // Removing upvote — no rate limit check needed
        await tx
          .delete(featureBoardUpvotes)
          .where(eq(featureBoardUpvotes.id, existing.id));
        const [item] = await tx
          .update(featureBoardItems)
          .set({
            upvoteCount: sql`GREATEST(${featureBoardItems.upvoteCount} - 1, 0)`,
          })
          .where(eq(featureBoardItems.id, data.itemId))
          .returning({ upvoteCount: featureBoardItems.upvoteCount });
        return { upvoted: false, count: item.upvoteCount };
      } else {
        // Adding upvote — check rate limit
        const rateLimitError = await checkUpvoteRateLimit(profile.id);
        if (rateLimitError) {
          throw new Error(rateLimitError);
        }

        await tx.insert(featureBoardUpvotes).values({
          itemId: data.itemId,
          profileId: profile.id,
        });
        const [item] = await tx
          .update(featureBoardItems)
          .set({
            upvoteCount: sql`${featureBoardItems.upvoteCount} + 1`,
          })
          .where(eq(featureBoardItems.id, data.itemId))
          .returning({ upvoteCount: featureBoardItems.upvoteCount });
        return { upvoted: true, count: item.upvoteCount };
      }
    });

    revalidatePath("/roadmap");
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof Error && error.message.includes("daily upvote limit")) {
      return { success: false, error: error.message };
    }
    if (
      isUniqueViolation(
        error,
        "feature_board_upvotes_item_id_profile_id_unique"
      )
    ) {
      // Race condition — ignore
      return { success: true, data: { upvoted: true, count: 0 } };
    }
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "toggleUpvote" },
      extra: { itemId: data.itemId, userId },
    });
    return { success: false, error: "Failed to toggle upvote" };
  }
}

async function checkCommentRateLimit(
  profileId: string
): Promise<string | null> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tenSecondsAgo = new Date(now.getTime() - 10 * 1000);

  // Check 10-second cooldown
  const [recentComment] = await db
    .select({ createdAt: featureBoardComments.createdAt })
    .from(featureBoardComments)
    .where(
      and(
        eq(featureBoardComments.authorId, profileId),
        gte(featureBoardComments.createdAt, tenSecondsAgo)
      )
    )
    .limit(1);

  if (recentComment) {
    return "Please wait a few seconds before posting another comment.";
  }

  // Check 30-per-day limit
  const [{ dayCount }] = await db
    .select({ dayCount: count() })
    .from(featureBoardComments)
    .where(
      and(
        eq(featureBoardComments.authorId, profileId),
        gte(featureBoardComments.createdAt, oneDayAgo)
      )
    );

  if (dayCount >= 30) {
    return "You can post up to 30 comments per day. Please try again later.";
  }

  return null;
}

// ---------------------------------------------------------------------------
// Comment Actions
// ---------------------------------------------------------------------------

/** Parse @mention patterns from comment body and return unique usernames */
function parseMentions(body: string): string[] {
  const matches = body.match(/@(\w[\w.-]{0,29})/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
}

export async function submitComment(data: {
  itemId: string;
  body: string;
  parentCommentId?: string | null;
  /** Optional base path for revalidation (e.g., "/projects/my-project/roadmap") */
  basePath?: string;
}): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  const profile = await ensureProfile(userId);
  if (!profile) return { success: false, error: "Profile not found" };

  const parsed = parseInput(submitCommentSchema, { body: data.body });
  if (!parsed.success) return parsed;

  // Rate limiting
  const commentRateLimitError = await checkCommentRateLimit(profile.id);
  if (commentRateLimitError) return { success: false, error: commentRateLimitError };

  // Verify parent comment if replying
  if (data.parentCommentId) {
    const parent = await db.query.featureBoardComments.findFirst({
      where: eq(featureBoardComments.id, data.parentCommentId),
    });
    if (!parent) return { success: false, error: "Parent comment not found" };
    if (parent.parentCommentId !== null) {
      return { success: false, error: "Cannot reply to a reply" };
    }
    if (parent.itemId !== data.itemId) {
      return { success: false, error: "Comment does not belong to this item" };
    }
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .insert(featureBoardComments)
        .values({
          itemId: data.itemId,
          authorId: profile.id,
          body: parsed.data.body,
          parentCommentId: data.parentCommentId ?? null,
        });
      await tx
        .update(featureBoardItems)
        .set({ commentCount: sql`${featureBoardItems.commentCount} + 1` })
        .where(eq(featureBoardItems.id, data.itemId));
    });

    // Create notifications (non-blocking)
    try {
      const item = await db.query.featureBoardItems.findFirst({
        where: eq(featureBoardItems.id, data.itemId),
        columns: { authorId: true, title: true, slug: true, projectId: true },
      });

      if (item) {
        const itemHref = await buildItemHref(item.slug, item.projectId);

        // Notify item author if commenter is different
        if (item.authorId !== profile.id && !data.parentCommentId) {
          await createNotification({
            profileId: item.authorId,
            type: "comment_reply",
            title: `${profile.displayName} commented on "${truncateTitle(item.title)}"`,
            href: itemHref,
            actorProfileId: profile.id,
          });
        }

        // Track IDs that already received a notification to avoid duplicates
        const notifiedIds = new Set<string>([profile.id, item.authorId]);

        // Notify parent comment author if replying
        if (data.parentCommentId) {
          const parent = await db.query.featureBoardComments.findFirst({
            where: eq(featureBoardComments.id, data.parentCommentId),
            columns: { authorId: true },
          });
          if (parent) {
            if (!notifiedIds.has(parent.authorId)) {
              await createNotification({
                profileId: parent.authorId,
                type: "comment_reply",
                title: `${profile.displayName} replied to your comment on "${truncateTitle(item.title)}"`,
                href: itemHref,
                actorProfileId: profile.id,
              });
              notifiedIds.add(parent.authorId);
            }
          }
        }

        // Parse @mentions and create notifications
        const usernames = parseMentions(parsed.data.body);
        if (usernames.length > 0) {
          const mentionedProfiles = await db
            .select({ id: profiles.id, username: profiles.username })
            .from(profiles)
            .where(
              and(
                sql`LOWER(${profiles.username}) IN (${sql.join(
                  usernames.map((u) => sql`${u}`),
                  sql`, `
                )})`,
                sql`${profiles.bannedAt} IS NULL`,
                sql`${profiles.hiddenAt} IS NULL`
              )
            );

          for (const mentioned of mentionedProfiles) {
            // Skip commenter, item author, and parent author (already notified via reply)
            if (!notifiedIds.has(mentioned.id)) {
              await createNotification({
                profileId: mentioned.id,
                type: "mention",
                title: `${profile.displayName} mentioned you in a comment on "${truncateTitle(item.title)}"`,
                href: itemHref,
                actorProfileId: profile.id,
              });
              notifiedIds.add(mentioned.id);
            }
          }
        }
      }
    } catch {
      // Non-blocking — don't fail the comment submission
    }

    revalidatePath("/roadmap");
    if (data.basePath && /^\/projects\/[\w-]+\/roadmap$/.test(data.basePath)) {
      revalidatePath(data.basePath);
    }
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "submitComment" },
      extra: { itemId: data.itemId, userId },
    });
    return { success: false, error: "Failed to submit comment" };
  }
}

export async function editComment(data: {
  commentId: string;
  body: string;
}): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  const profile = await ensureProfile(userId);
  if (!profile) return { success: false, error: "Profile not found" };

  const comment = await db.query.featureBoardComments.findFirst({
    where: eq(featureBoardComments.id, data.commentId),
  });
  if (!comment) return { success: false, error: "Comment not found" };
  if (comment.deletedAt) return { success: false, error: "Comment has been deleted" };
  if (comment.authorId !== profile.id) {
    return { success: false, error: "Not authorized" };
  }

  const elapsed = Date.now() - comment.createdAt.getTime();
  if (elapsed > AUTHOR_EDIT_WINDOW_MS) {
    return { success: false, error: "The 15-minute edit window has passed." };
  }

  const parsed = parseInput(editCommentSchema, { body: data.body });
  if (!parsed.success) return parsed;

  try {
    await db
      .update(featureBoardComments)
      .set({ body: parsed.data.body, isEdited: true })
      .where(eq(featureBoardComments.id, data.commentId));

    revalidatePath("/roadmap");
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "editComment" },
      extra: { commentId: data.commentId, userId },
    });
    return { success: false, error: "Failed to edit comment" };
  }
}

export async function deleteComment(data: {
  commentId: string;
}): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  const profile = await ensureProfile(userId);
  if (!profile) return { success: false, error: "Profile not found" };

  const comment = await db.query.featureBoardComments.findFirst({
    where: eq(featureBoardComments.id, data.commentId),
  });
  if (!comment) return { success: false, error: "Comment not found" };
  if (comment.deletedAt) return { success: false, error: "Comment already deleted" };

  const isOwner = comment.authorId === profile.id;
  const isMod = await isModerator(userId);
  if (!isOwner && !isMod) {
    return { success: false, error: "Not authorized" };
  }

  try {
    await db.transaction(async (tx) => {
      // If top-level comment with replies: soft-delete parent only
      // If top-level comment without replies: soft-delete parent + decrement
      // If reply: soft-delete reply + decrement
      if (comment.parentCommentId === null) {
        // Top-level comment — soft-delete the parent
        await tx
          .update(featureBoardComments)
          .set({ deletedAt: new Date() })
          .where(eq(featureBoardComments.id, data.commentId));

        // Only decrement by 1 (for the parent). Replies stay as-is.
        await tx
          .update(featureBoardItems)
          .set({
            commentCount: sql`GREATEST(${featureBoardItems.commentCount} - 1, 0)`,
          })
          .where(eq(featureBoardItems.id, comment.itemId));
      } else {
        // Reply — soft-delete
        await tx
          .update(featureBoardComments)
          .set({ deletedAt: new Date() })
          .where(eq(featureBoardComments.id, data.commentId));

        await tx
          .update(featureBoardItems)
          .set({
            commentCount: sql`GREATEST(${featureBoardItems.commentCount} - 1, 0)`,
          })
          .where(eq(featureBoardItems.id, comment.itemId));
      }
    });

    revalidatePath("/roadmap");
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "deleteComment" },
      extra: { commentId: data.commentId, userId },
    });
    return { success: false, error: "Failed to delete comment" };
  }
}

// ---------------------------------------------------------------------------
// Push to Linear
// ---------------------------------------------------------------------------

export async function pushToLinear(data: {
  itemId: string;
  /** Pass projectId to use project-level admin auth instead of platform moderator check */
  projectId?: string;
}): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  let authorized: boolean;
  if (data.projectId) {
    const profile = await ensureProfile(userId);
    if (!profile) return { success: false, error: "Profile not found" };
    authorized = await isProjectOwnerOrMember(profile.id, data.projectId);
  } else {
    authorized = await isModerator(userId);
  }
  if (!authorized) return { success: false, error: "Unauthorized" };

  const item = await db.query.featureBoardItems.findFirst({
    where: eq(featureBoardItems.id, data.itemId),
    with: {
      author: { columns: { displayName: true } },
    },
  });
  if (!item) return { success: false, error: "Item not found" };

  // Verify item belongs to the claimed project scope
  if (data.projectId && item.projectId !== data.projectId) {
    return { success: false, error: "Item does not belong to this project" };
  }

  if (item.linearIssueId) {
    return { success: false, error: "Already pushed to Linear" };
  }

  try {
    const result = await createLinearIssueFromRoadmapItem({
      title: item.title,
      description: item.description,
      authorName: item.author.displayName,
      slug: item.slug ?? item.id,
      upvoteCount: item.upvoteCount,
      commentCount: item.commentCount,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    await db
      .update(featureBoardItems)
      .set({
        linearIssueId: result.issueId,
        linearIssueUrl: result.issueUrl,
      })
      .where(eq(featureBoardItems.id, data.itemId));

    revalidatePath("/roadmap");
    if (item.slug) revalidatePath(`/roadmap/${item.slug}`);
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "pushToLinear" },
      extra: { itemId: data.itemId },
    });
    return { success: false, error: "Failed to push to Linear" };
  }
}

// ---------------------------------------------------------------------------
// Mention Search
// ---------------------------------------------------------------------------

export async function searchUsersForMentionAction(data: {
  query: string;
}): Promise<
  ActionResult<
    { id: string; displayName: string; username: string | null; avatarUrl: string | null }[]
  >
> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  try {
    const results = await searchUsersForMention(data.query);
    return { success: true, data: results };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "searchUsersForMention" },
    });
    return { success: false, error: "Search failed" };
  }
}

// ---------------------------------------------------------------------------
// Category Management (project-scoped)
// ---------------------------------------------------------------------------

const MAX_CATEGORIES_PER_PROJECT = 20;

export async function createCategory(data: {
  projectId: string;
  name: string;
  color: string;
}): Promise<ActionResult<{ id: string }>> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  const profile = await ensureProfile(userId);
  if (!profile) return { success: false, error: "Profile not found" };

  if (!(await isProjectOwnerOrMember(profile.id, data.projectId))) {
    return { success: false, error: "Unauthorized" };
  }

  const name = data.name.trim();
  if (!name || name.length > 50) {
    return { success: false, error: "Name must be 1-50 characters" };
  }

  const color = data.color.trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    return { success: false, error: "Color must be a valid hex color" };
  }

  try {
    const category = await db.transaction(async (tx) => {
      // Check category limit (inside transaction for atomicity)
      const [{ catCount }] = await tx
        .select({ catCount: count() })
        .from(featureBoardCategories)
        .where(eq(featureBoardCategories.projectId, data.projectId));

      if (catCount >= MAX_CATEGORIES_PER_PROJECT) {
        throw new Error("CATEGORY_LIMIT_EXCEEDED");
      }

      const [inserted] = await tx
        .insert(featureBoardCategories)
        .values({
          name,
          color,
          projectId: data.projectId,
          sortOrder: catCount,
        })
        .returning({ id: featureBoardCategories.id });

      return inserted;
    });

    revalidatePath("/roadmap");
    return { success: true, data: { id: category.id } };
  } catch (error) {
    if (error instanceof Error && error.message === "CATEGORY_LIMIT_EXCEEDED") {
      return {
        success: false,
        error: `Maximum ${MAX_CATEGORIES_PER_PROJECT} categories per project`,
      };
    }
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "createCategory" },
      extra: { projectId: data.projectId },
    });
    return { success: false, error: "Failed to create category" };
  }
}

export async function updateCategory(data: {
  categoryId: string;
  projectId: string;
  name?: string;
  color?: string;
}): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  const profile = await ensureProfile(userId);
  if (!profile) return { success: false, error: "Profile not found" };

  if (!(await isProjectOwnerOrMember(profile.id, data.projectId))) {
    return { success: false, error: "Unauthorized" };
  }

  // Verify category belongs to project
  const existing = await db.query.featureBoardCategories.findFirst({
    where: and(
      eq(featureBoardCategories.id, data.categoryId),
      eq(featureBoardCategories.projectId, data.projectId)
    ),
  });
  if (!existing) return { success: false, error: "Category not found" };

  const updates: Record<string, unknown> = {};
  if (data.name !== undefined) {
    const name = data.name.trim();
    if (!name || name.length > 50) {
      return { success: false, error: "Name must be 1-50 characters" };
    }
    updates.name = name;
  }
  if (data.color !== undefined) {
    const color = data.color.trim();
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
      return { success: false, error: "Color must be a valid hex color" };
    }
    updates.color = color;
  }

  if (Object.keys(updates).length === 0) {
    return { success: true };
  }

  try {
    await db
      .update(featureBoardCategories)
      .set(updates)
      .where(eq(featureBoardCategories.id, data.categoryId));

    revalidatePath("/roadmap");
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "updateCategory" },
      extra: { categoryId: data.categoryId },
    });
    return { success: false, error: "Failed to update category" };
  }
}

export async function deleteCategory(data: {
  categoryId: string;
  projectId: string;
}): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  const profile = await ensureProfile(userId);
  if (!profile) return { success: false, error: "Profile not found" };

  if (!(await isProjectOwnerOrMember(profile.id, data.projectId))) {
    return { success: false, error: "Unauthorized" };
  }

  // Verify category belongs to project
  const existing = await db.query.featureBoardCategories.findFirst({
    where: and(
      eq(featureBoardCategories.id, data.categoryId),
      eq(featureBoardCategories.projectId, data.projectId)
    ),
  });
  if (!existing) return { success: false, error: "Category not found" };

  try {
    await db.transaction(async (tx) => {
      // Unlink items from this category first
      await tx
        .update(featureBoardItems)
        .set({ categoryId: null })
        .where(eq(featureBoardItems.categoryId, data.categoryId));

      await tx
        .delete(featureBoardCategories)
        .where(eq(featureBoardCategories.id, data.categoryId));
    });

    revalidatePath("/roadmap");
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "deleteCategory" },
      extra: { categoryId: data.categoryId },
    });
    return { success: false, error: "Failed to delete category" };
  }
}
