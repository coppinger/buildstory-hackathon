"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { submitComment } from "@/app/(app)/content/actions";
import { POST_BODY_MAX_LENGTH } from "@/lib/constants";

export function CommentForm({
  postId,
  parentCommentId,
  onSuccess,
}: {
  postId: string;
  parentCommentId?: string | null;
  onSuccess?: () => void;
}) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const charCount = body.trim().length;
  const isOverLimit = charCount > POST_BODY_MAX_LENGTH;

  function handleSubmit() {
    if (!body.trim() || isOverLimit) return;
    setError(null);

    startTransition(async () => {
      const result = await submitComment({
        body: body.trim(),
        postId,
        parentCommentId: parentCommentId ?? null,
      });

      if (result.success) {
        setBody("");
        onSuccess?.();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder={parentCommentId ? "Reply..." : "Add a comment..."}
        className="flex-1 bg-transparent border border-border px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30"
        disabled={isPending}
        maxLength={POST_BODY_MAX_LENGTH}
      />
      <Button
        onClick={handleSubmit}
        disabled={!body.trim() || isOverLimit || isPending}
        size="sm"
        variant="outline"
        className="text-xs h-auto py-1"
      >
        {isPending ? "..." : parentCommentId ? "Reply" : "Comment"}
      </Button>
      {error && (
        <span className="text-xs text-destructive self-center">{error}</span>
      )}
    </div>
  );
}
