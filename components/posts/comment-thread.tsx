"use client";

import { useState } from "react";
import Link from "next/link";
import type { CommentWithAuthor } from "@/lib/content/queries";
import { ReactionBar } from "@/components/posts/reaction-bar";
import { CommentForm } from "@/components/posts/comment-form";
import { timeAgo } from "@/lib/time";

export function CommentThread({
  comment,
  postId,
  contextType,
  currentUserProfileId,
  depth = 0,
  reactionSummaries,
  userReactionsMap,
  onRefresh,
}: {
  comment: CommentWithAuthor;
  postId: string;
  contextType: "project" | "tool";
  currentUserProfileId: string | null;
  depth?: number;
  reactionSummaries?: Map<string, Record<string, number>>;
  userReactionsMap?: Map<string, string[]>;
  onRefresh?: () => void;
}) {
  const [showReply, setShowReply] = useState(false);

  // Project: flat (no replies). Tool: max 2 levels.
  const canReply =
    currentUserProfileId !== null &&
    contextType === "tool" &&
    depth < 2;

  return (
    <div className={depth > 0 ? "ml-4 border-l border-border pl-3" : ""}>
      <div className="py-2">
        {/* Author + time */}
        <div className="flex items-center gap-2">
          {comment.author.avatarUrl ? (
            <img
              src={comment.author.avatarUrl}
              alt=""
              className="h-5 w-5 rounded-full object-cover"
            />
          ) : (
            <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">
              {comment.author.displayName[0]?.toUpperCase()}
            </div>
          )}
          {comment.author.username ? (
            <Link
              href={`/profiles/${comment.author.username}`}
              className="text-xs font-medium text-foreground hover:underline"
            >
              {comment.author.displayName}
            </Link>
          ) : (
            <span className="text-xs font-medium text-foreground">
              {comment.author.displayName}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">
            {timeAgo(comment.createdAt)}
          </span>
        </div>

        {/* Body */}
        <p className="mt-1 text-xs text-foreground whitespace-pre-wrap break-words">
          {comment.body}
        </p>

        {/* Actions */}
        <div className="mt-1 flex items-center gap-2">
          <ReactionBar
            targetType="comment"
            targetId={comment.id}
            summary={reactionSummaries?.get(comment.id) ?? {}}
            userReactions={userReactionsMap?.get(comment.id) ?? []}
            currentUserProfileId={currentUserProfileId}
          />
          {canReply && (
            <button
              onClick={() => setShowReply(!showReply)}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Reply
            </button>
          )}
        </div>

        {/* Reply form */}
        {showReply && (
          <div className="mt-2">
            <CommentForm
              postId={postId}
              parentCommentId={comment.id}
              onSuccess={() => { setShowReply(false); onRefresh?.(); }}
            />
          </div>
        )}
      </div>

      {/* Nested replies */}
      {comment.replies.length > 0 && (
        <div>
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              postId={postId}
              contextType={contextType}
              currentUserProfileId={currentUserProfileId}
              depth={depth + 1}
              reactionSummaries={reactionSummaries}
              userReactionsMap={userReactionsMap}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
