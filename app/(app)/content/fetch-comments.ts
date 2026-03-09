"use server";

import { getCommentsForPost, type CommentWithAuthor } from "@/lib/content/queries";

export async function fetchComments(
  postId: string
): Promise<CommentWithAuthor[]> {
  return getCommentsForPost(postId);
}
