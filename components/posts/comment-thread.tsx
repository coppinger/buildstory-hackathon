"use client";

import { useState } from "react";
import Link from "next/link";
import type { CommentWithAuthor } from "@/lib/content/queries";
import { ReactionBar } from "@/components/posts/reaction-bar";
import { CommentForm } from "@/components/posts/comment-form";
import { timeAgo } from "@/lib/time";

const MAX_DEPTH = 2;
const VISIBLE_REPLIES = 3;

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
  const [repliesExpanded, setRepliesExpanded] = useState(false);

  const canReply =
    currentUserProfileId !== null &&
    contextType === "tool" &&
    depth < MAX_DEPTH;

  const visibleReplies = repliesExpanded
    ? comment.replies
    : comment.replies.slice(0, VISIBLE_REPLIES);
  const hiddenReplyCount = comment.replies.length - visibleReplies.length;

  return (
    <div
      className={
        depth > 0
          ? "ml-5 pl-3 border-l-2 border-border/30 hover:border-buildstory-500/20 transition-colors"
          : ""
      }
    >
      <div className="flex flex-col gap-2 py-1.5">
        {/* Author row */}
        <div className="flex items-center gap-2">
          {comment.author.avatarUrl ? (
            <img
              src={comment.author.avatarUrl}
              alt=""
              className="size-8 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="size-8 rounded-full bg-buildstory-500/10 flex items-center justify-center shrink-0">
              <span className="text-[9px] font-semibold text-buildstory-500">
                {comment.author.displayName[0]?.toUpperCase()}
              </span>
            </div>
          )}
          {comment.author.username ? (
            <Link
              href={`/members/${comment.author.username}`}
              className="text-base font-medium text-foreground hover:text-buildstory-500 transition-colors"
            >
              {comment.author.displayName}
            </Link>
          ) : (
            <span className="text-base font-medium text-foreground">
              {comment.author.displayName}
            </span>
          )}
          <span className="text-xs text-muted-foreground/60 font-mono">
            {timeAgo(comment.createdAt)}
          </span>
        </div>

        {/* Body */}
        <p className="pl-10 pt-0.5 text-base leading-normal text-foreground/80 whitespace-pre-wrap break-words">
          {comment.body}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 pl-10 pt-1">
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
              className="text-sm font-medium text-muted-foreground/60 hover:text-foreground transition-colors"
            >
              Reply
            </button>
          )}
        </div>

        {/* Reply form */}
        {showReply && (
          <div className="pl-10 pt-1">
            <CommentForm
              postId={postId}
              parentCommentId={comment.id}
              onSuccess={() => { setShowReply(false); onRefresh?.(); }}
            />
          </div>
        )}
      </div>

      {/* Nested replies */}
      {visibleReplies.length > 0 && (
        <div className="flex flex-col gap-4">
          {visibleReplies.map((reply) => (
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

      {/* Expand replies */}
      {hiddenReplyCount > 0 && (
        <button
          onClick={() => setRepliesExpanded(true)}
          className="ml-5 mt-1 mb-1 text-xs font-medium text-buildstory-500 hover:text-buildstory-600 transition-colors"
        >
          View {hiddenReplyCount} more {hiddenReplyCount === 1 ? "reply" : "replies"}
        </button>
      )}
    </div>
  );
}
