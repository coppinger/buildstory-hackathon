"use server";

import { auth } from "@clerk/nextjs/server";
import {
  getCommentsForPost,
  getReactionSummaries,
  getUserReactions,
  type CommentWithAuthor,
} from "@/lib/content/queries";
import { ensureProfile } from "@/lib/db/ensure-profile";

export interface CommentsPayload {
  comments: CommentWithAuthor[];
  reactionSummaries: Record<string, Record<string, number>>;
  userReactions: Record<string, string[]>;
}

function collectCommentIds(comments: CommentWithAuthor[]): string[] {
  const ids: string[] = [];
  for (const c of comments) {
    ids.push(c.id);
    if (c.replies.length > 0) ids.push(...collectCommentIds(c.replies));
  }
  return ids;
}

async function getCurrentUserReactions(
  targetType: "post" | "comment",
  targetIds: string[]
): Promise<Map<string, string[]>> {
  const { userId } = await auth();
  if (!userId) return new Map();
  const profile = await ensureProfile(userId);
  if (!profile) return new Map();
  return getUserReactions(profile.id, targetType, targetIds);
}

export async function fetchComments(
  postId: string
): Promise<CommentsPayload> {
  const comments = await getCommentsForPost(postId);
  const commentIds = collectCommentIds(comments);

  const [summariesMap, userReactionsMap] = await Promise.all([
    getReactionSummaries("comment", commentIds),
    getCurrentUserReactions("comment", commentIds),
  ]);

  return {
    comments,
    reactionSummaries: Object.fromEntries(summariesMap),
    userReactions: Object.fromEntries(userReactionsMap),
  };
}
