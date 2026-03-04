"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { CommentInput } from "./comment-input";
import { CommentItem } from "./comment-item";
import type { RoadmapComment } from "@/lib/roadmap/queries";

interface CommentSectionProps {
  comments: RoadmapComment[];
  itemId: string;
  currentProfileId: string | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  /** Optional base path for revalidation (e.g., "/projects/my-project/roadmap") */
  basePath?: string;
}

export function CommentSection({
  comments,
  itemId,
  currentProfileId,
  isAdmin,
  isAuthenticated,
  basePath,
}: CommentSectionProps) {
  // Group into threads: top-level (newest first), replies per parent (oldest first)
  const topLevel = comments
    .filter((c) => c.parentCommentId === null)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const repliesByParent = new Map<string, RoadmapComment[]>();
  for (const c of comments) {
    if (c.parentCommentId) {
      const existing = repliesByParent.get(c.parentCommentId) ?? [];
      existing.push(c);
      repliesByParent.set(c.parentCommentId, existing);
    }
  }
  // Sort replies oldest first
  for (const [, replies] of repliesByParent) {
    replies.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  return (
    <div className="mt-8 border-t border-border pt-6">
      <h2 className="text-lg font-heading text-foreground flex items-center gap-2">
        <Icon name="chat_bubble" size="5" />
        Comments
        {comments.length > 0 && (
          <span className="text-sm font-normal text-muted-foreground">
            ({comments.length})
          </span>
        )}
      </h2>

      <div className="mt-4">
        {isAuthenticated ? (
          <CommentInput itemId={itemId} basePath={basePath} />
        ) : (
          <div className="rounded-lg border border-border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
            <Link
              href="/sign-in"
              className="text-foreground hover:underline font-medium"
            >
              Sign in
            </Link>{" "}
            to leave a comment
          </div>
        )}
      </div>

      {topLevel.length > 0 ? (
        <div className="mt-2 divide-y divide-border">
          {topLevel.map((comment) => (
            <div key={comment.id} className="py-2">
              <CommentItem
                comment={comment}
                itemId={itemId}
                currentProfileId={currentProfileId}
                isAdmin={isAdmin}
                isAuthenticated={isAuthenticated}
                replies={repliesByParent.get(comment.id)}
                basePath={basePath}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground text-center py-4">
          No comments yet. Be the first to share your thoughts.
        </p>
      )}
    </div>
  );
}
