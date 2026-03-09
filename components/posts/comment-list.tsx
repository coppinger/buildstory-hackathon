"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CommentWithAuthor } from "@/lib/content/queries";
import { CommentThread } from "@/components/posts/comment-thread";
import { CommentForm } from "@/components/posts/comment-form";
import { fetchComments } from "@/app/(app)/content/fetch-comments";

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
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const data = await fetchComments(postId);
      setComments(data);
    } finally {
      loadingRef.current = false;
    }
  }, [postId]);

  useEffect(() => {
    load();
  }, [load]);

  if (comments === null) {
    return (
      <p className="text-xs text-muted-foreground py-2">
        Loading comments...
      </p>
    );
  }

  return (
    <div>
      {comments.length > 0 && (
        <div className="mb-3">
          {comments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              postId={postId}
              contextType={contextType}
              currentUserProfileId={currentUserProfileId}
              onRefresh={load}
            />
          ))}
        </div>
      )}

      {currentUserProfileId && (
        <CommentForm postId={postId} onSuccess={load} />
      )}
    </div>
  );
}
