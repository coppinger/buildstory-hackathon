"use client";

import { useState } from "react";
import Link from "next/link";
import type { PostWithAuthor } from "@/lib/content/queries";
import { ReactionBar } from "@/components/posts/reaction-bar";
import { CommentList } from "@/components/posts/comment-list";
import { timeAgo } from "@/lib/time";
import { Icon } from "@/components/ui/icon";

export function PostCard({
  post,
  reactionSummary,
  userReactions,
  currentUserProfileId,
  contextType,
}: {
  post: PostWithAuthor;
  reactionSummary?: Record<string, number>;
  userReactions?: string[];
  currentUserProfileId: string | null;
  contextType: "project" | "tool";
}) {
  const [showComments, setShowComments] = useState(false);

  return (
    <div className="border border-border p-4">
      {/* Author row */}
      <div className="flex items-center gap-2">
        {post.author.avatarUrl ? (
          <img
            src={post.author.avatarUrl}
            alt=""
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
            {post.author.displayName[0]?.toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          {post.author.username ? (
            <Link
              href={`/profiles/${post.author.username}`}
              className="text-sm font-medium text-foreground hover:underline truncate"
            >
              {post.author.displayName}
            </Link>
          ) : (
            <span className="text-sm font-medium text-foreground truncate">
              {post.author.displayName}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground ml-auto shrink-0">
          {timeAgo(post.createdAt)}
        </span>
      </div>

      {/* Body */}
      <p className="mt-2 text-sm text-foreground whitespace-pre-wrap break-words">
        {post.body}
      </p>

      {/* Image */}
      {post.imageUrl && (
        <div className="mt-3">
          <img
            src={post.imageUrl}
            alt="Post attachment"
            className="max-h-80 w-auto rounded border border-border object-contain"
          />
        </div>
      )}

      {/* Link */}
      {post.linkUrl && (
        <a
          href={post.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs text-buildstory-500 hover:underline font-mono"
        >
          <Icon name="link" size="3.5" />
          {(() => { try { return new URL(post.linkUrl!).hostname; } catch { return post.linkUrl; } })()}
        </a>
      )}

      {/* Actions */}
      <div className="mt-3 flex items-center gap-3">
        <ReactionBar
          targetType="post"
          targetId={post.id}
          summary={reactionSummary ?? {}}
          userReactions={userReactions ?? []}
          currentUserProfileId={currentUserProfileId}
        />

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Icon name="chat_bubble" size="3.5" />
          {post.commentCount > 0 && post.commentCount}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="mt-3 border-t border-border pt-3">
          <CommentList
            postId={post.id}
            contextType={contextType}
            currentUserProfileId={currentUserProfileId}
          />
        </div>
      )}
    </div>
  );
}
