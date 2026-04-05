"use client";

import { useState, useTransition } from "react";
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
    <div>
      <div className="flex items-center gap-2">
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
          placeholder={parentCommentId ? "Write a reply..." : "Add a comment..."}
          className="flex-1 border border-border/50 p-4 bg-transparent text-base text-foreground placeholder:text-muted-foreground/40 focus:outline-hidden"
          disabled={isPending}
          maxLength={POST_BODY_MAX_LENGTH}
        />
        <button
          onClick={handleSubmit}
          disabled={!body.trim() || isOverLimit || isPending}
          className="shrink-0 self-stretch border border-border/50 px-5 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-default transition-colors whitespace-nowrap"
        >
          {isPending ? "..." : parentCommentId ? "Reply" : "Post"}
        </button>
      </div>
      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
