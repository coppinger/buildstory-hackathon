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
    <article className="border border-border/60 overflow-hidden">
      {/* Post content */}
      <div className="flex flex-col gap-2 p-4">
        {/* Author row */}
        <div className="flex items-center gap-2.5">
          {post.author.avatarUrl ? (
            <img
              src={post.author.avatarUrl}
              alt=""
              className="size-8 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="size-8 rounded-full bg-buildstory-500/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-buildstory-500">
                {post.author.displayName[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            {post.author.username ? (
              <Link
                href={`/members/${post.author.username}`}
                className="text-base font-medium text-foreground hover:text-buildstory-500 transition-colors"
              >
                {post.author.displayName}
              </Link>
            ) : (
              <span className="text-base font-medium text-foreground">
                {post.author.displayName}
              </span>
            )}
            <span className="text-xs text-muted-foreground/70 font-mono">
              {timeAgo(post.createdAt)}
            </span>
          </div>
        </div>

        {/* Body + attachments */}
        <div className="flex flex-col pl-[42px] gap-2.5">
          <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap break-words">
            {post.body}
          </p>

          {/* Image */}
          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt="Post attachment"
              className="max-h-72 w-auto border border-border/40 object-contain"
            />
          )}

          {/* Link */}
          {post.linkUrl && (
            <a
              href={post.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 border border-border/50 bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground hover:text-buildstory-500 hover:border-buildstory-500/30 transition-colors font-mono self-start whitespace-nowrap"
            >
              <Icon name="link" size="3" />
              {(() => { try { return new URL(post.linkUrl!).hostname; } catch { return post.linkUrl; } })()}
            </a>
          )}
        </div>

        {/* Reactions + comment toggle */}
        <div className="flex items-center gap-4 pt-0.5 pl-[42px]">
          <ReactionBar
            targetType="post"
            targetId={post.id}
            summary={reactionSummary ?? {}}
            userReactions={userReactions ?? []}
            currentUserProfileId={currentUserProfileId}
          />
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            <Icon name="chat_bubble" size="3.5" />
            {post.commentCount > 0 && (
              <span className="font-mono tabular-nums">{post.commentCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Comments - lazy loaded on click */}
      {showComments && (
        <div className="flex flex-col gap-4 bg-muted/15 border-t border-border/40 p-4">
          <CommentList
            postId={post.id}
            contextType={contextType}
            currentUserProfileId={currentUserProfileId}
          />
        </div>
      )}
    </article>
  );
}
