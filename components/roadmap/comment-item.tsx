"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { editComment, deleteComment } from "@/app/(app)/roadmap/actions";
import { UserAvatar } from "@/components/ui/user-avatar";
import { renderMarkdown } from "@/lib/markdown";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { timeAgo } from "@/lib/time";
import { CommentInput } from "./comment-input";
import type { RoadmapComment } from "@/lib/roadmap/queries";

interface CommentItemProps {
  comment: RoadmapComment;
  itemId: string;
  currentProfileId: string | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  replies?: RoadmapComment[];
  isReply?: boolean;
  /** Optional base path for revalidation */
  basePath?: string;
  /** Server-rendered timestamp (ms) for edit window calculations */
  serverNow?: number;
}

export function CommentItem({
  comment,
  itemId,
  currentProfileId,
  isAdmin,
  isAuthenticated,
  replies,
  isReply,
  basePath,
  serverNow,
}: CommentItemProps) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isDeleted = !!comment.deletedAt;
  const isOwner = currentProfileId === comment.author.id;
  const canEdit =
    isOwner &&
    !isDeleted &&
    serverNow != null &&
    serverNow - new Date(comment.createdAt).getTime() < 15 * 60 * 1000;
  const canDelete = (isOwner || isAdmin) && !isDeleted;
  const profileHref = comment.author.username
    ? `/profiles/${comment.author.username}`
    : "#";

  function handleEdit() {
    if (!editBody.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await editComment({
        commentId: comment.id,
        body: editBody.trim(),
      });
      if (result.success) {
        setIsEditing(false);
      } else {
        setError(result.error);
      }
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteComment({ commentId: comment.id });
      if (!result.success) {
        setError(result.error);
        setShowDeleteConfirm(false);
      }
    });
  }

  // Render soft-deleted comments
  if (isDeleted) {
    return (
      <div className={isReply ? "ml-10 mt-3" : "mt-4"}>
        <div className="flex gap-3">
          <div className="w-6 h-6 rounded-full bg-muted shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground italic">
              [This comment has been deleted]
            </p>
          </div>
        </div>
        {replies && replies.length > 0 && (
          <div>
            {replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                itemId={itemId}
                currentProfileId={currentProfileId}
                isAdmin={isAdmin}
                isAuthenticated={isAuthenticated}
                isReply
                basePath={basePath}
                serverNow={serverNow}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={isReply ? "ml-10 mt-3" : "mt-4"}>
      <div className="flex gap-3">
        <Link href={profileHref} className="shrink-0">
          <UserAvatar
            avatarUrl={comment.author.avatarUrl}
            displayName={comment.author.displayName}
            size="xs"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <Link
              href={profileHref}
              className="font-medium text-foreground hover:underline"
            >
              {comment.author.displayName}
            </Link>
            <span className="text-muted-foreground">
              {timeAgo(comment.createdAt)}
            </span>
            {comment.isEdited && (
              <span className="text-muted-foreground text-xs">(edited)</span>
            )}
          </div>

          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={3}
                maxLength={5000}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setEditBody(comment.body);
                    setError(null);
                  }}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleEdit}
                  disabled={isPending || !editBody.trim()}
                >
                  {isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-1">
              <CommentBody body={comment.body} />
            </div>
          )}

          {!isEditing && (
            <div className="mt-1.5 flex items-center gap-2">
              {!isReply && isAuthenticated && (
                <button
                  type="button"
                  onClick={() => setShowReplyInput(!showReplyInput)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
                >
                  <Icon name="reply" size="3.5" />
                  Reply
                </button>
              )}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Edit
                </button>
              )}
              {canDelete && !showDeleteConfirm && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Delete
                </button>
              )}
              {showDeleteConfirm && (
                <span className="text-xs flex items-center gap-1.5">
                  <span className="text-destructive">Delete?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isPending}
                    className="text-destructive hover:underline font-medium"
                  >
                    {isPending ? "..." : "Yes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="text-muted-foreground hover:underline"
                  >
                    No
                  </button>
                </span>
              )}
              {error && !isEditing && (
                <span className="text-xs text-destructive">{error}</span>
              )}
            </div>
          )}

          {showReplyInput && (
            <div className="mt-2">
              <CommentInput
                itemId={itemId}
                parentCommentId={comment.id}
                onCancel={() => setShowReplyInput(false)}
                onSubmitted={() => setShowReplyInput(false)}
                basePath={basePath}
              />
            </div>
          )}
        </div>
      </div>

      {replies && replies.length > 0 && (
        <div>
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              itemId={itemId}
              currentProfileId={currentProfileId}
              isAdmin={isAdmin}
              isAuthenticated={isAuthenticated}
              isReply
              basePath={basePath}
              serverNow={serverNow}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Render comment body with @mention links.
 * Strategy: render markdown first (HTML-escapes all user input), then
 * replace @username patterns in the safe output with anchor tags.
 * The regex is strict (word chars + dots/hyphens, max 30 chars) so it
 * cannot inject arbitrary HTML into the already-escaped output. */
function CommentBody({ body }: { body: string }) {
  const html = renderMarkdown(body);
  const withMentions = html.replace(
    /@(\w[\w.-]{0,29})/g,
    '<a href="/profiles/$1" class="text-primary hover:underline font-medium">@$1</a>'
  );

  return (
    <div
      className={cn("text-sm [&_p]:mb-1 [&_p:last-child]:mb-0")}
      dangerouslySetInnerHTML={{ __html: withMentions }}
    />
  );
}
