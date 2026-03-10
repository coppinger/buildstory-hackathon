"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CommentWithAuthor } from "@/lib/content/queries";
import { CommentThread } from "@/components/posts/comment-thread";
import { CommentForm } from "@/components/posts/comment-form";
import { fetchComments } from "@/app/(app)/content/fetch-comments";
import { Button } from "@/components/ui/button";

const VISIBLE_LIMIT = 3;

export function CommentList({
  postId,
  contextType,
  currentUserProfileId,
}: {
  postId: string;
  contextType: "project" | "tool";
  currentUserProfileId: string | null;
}) {
  const [comments, setComments] = useState<CommentWithAuthor[] | null>(null);
  const [reactionSummaries, setReactionSummaries] = useState<
    Map<string, Record<string, number>>
  >(new Map());
  const [userReactionsMap, setUserReactionsMap] = useState<
    Map<string, string[]>
  >(new Map());
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setError(false);
    try {
      const data = await fetchComments(postId);
      setComments(data.comments);
      setReactionSummaries(new Map(Object.entries(data.reactionSummaries)));
      setUserReactionsMap(new Map(Object.entries(data.userReactions)));
    } catch {
      setError(true);
    } finally {
      loadingRef.current = false;
    }
  }, [postId]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-xs text-muted-foreground">Failed to load comments.</p>
        <Button variant="ghost" size="sm" onClick={load} className="h-6 text-xs">
          Retry
        </Button>
      </div>
    );
  }

  if (comments === null) {
    return (
      <p className="text-xs text-muted-foreground">Loading comments...</p>
    );
  }

  const total = comments.length;
  const visible = expanded ? comments : comments.slice(0, VISIBLE_LIMIT);
  const hiddenCount = total - visible.length;

  return (
    <div className="flex flex-col gap-4">
      {visible.length > 0 && (
        <div className="flex flex-col gap-4">
          {visible.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              postId={postId}
              contextType={contextType}
              currentUserProfileId={currentUserProfileId}
              reactionSummaries={reactionSummaries}
              userReactionsMap={userReactionsMap}
              onRefresh={load}
            />
          ))}
        </div>
      )}

      {hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="text-xs font-medium text-buildstory-500 hover:text-buildstory-600 transition-colors self-start"
        >
          View {hiddenCount} more {hiddenCount === 1 ? "comment" : "comments"}
        </button>
      )}

      {currentUserProfileId && (
        <CommentForm postId={postId} onSuccess={load} />
      )}
    </div>
  );
}
