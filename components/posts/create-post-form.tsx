"use client";

import { useState, useTransition } from "react";
import { createPost } from "@/app/(app)/content/actions";
import { POST_BODY_MAX_LENGTH } from "@/lib/constants";
import { Icon } from "@/components/ui/icon";

export function CreatePostForm({
  contextType,
  contextId,
}: {
  contextType: "project" | "tool";
  contextId: string;
}) {
  const [body, setBody] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [showLink, setShowLink] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const charCount = body.trim().length;
  const isOverLimit = charCount > POST_BODY_MAX_LENGTH;

  function handleSubmit() {
    if (!body.trim() || isOverLimit) return;
    setError(null);

    startTransition(async () => {
      const result = await createPost({
        body: body.trim(),
        linkUrl: linkUrl.trim() || null,
        contextType,
        contextId,
      });

      if (result.success) {
        setBody("");
        setLinkUrl("");
        setShowLink(false);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col border border-border/60 overflow-hidden">
      <div className="p-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            contextType === "project"
              ? "Share a project update..."
              : "Start a discussion..."
          }
          className="w-full resize-none bg-transparent text-base text-foreground placeholder:text-muted-foreground/50 focus:outline-none min-h-[48px]"
          rows={2}
          disabled={isPending}
        />
      </div>

      {showLink && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 border border-border/50 bg-muted/30 px-2.5 py-1.5">
            <Icon name="link" size="3.5" className="text-muted-foreground/50 shrink-0" />
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
              className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
              disabled={isPending}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowLink(!showLink)}
            className={`flex items-center transition-colors ${
              showLink
                ? "text-buildstory-500"
                : "text-muted-foreground/50 hover:text-muted-foreground"
            }`}
            disabled={isPending}
          >
            <Icon name="link" size="4" />
          </button>
          {charCount > 0 && (
            <span
              className={`text-xs font-mono tabular-nums ${
                isOverLimit
                  ? "text-destructive"
                  : charCount > POST_BODY_MAX_LENGTH - 40
                    ? "text-yellow-500"
                    : "text-muted-foreground/40"
              }`}
            >
              {charCount}/{POST_BODY_MAX_LENGTH}
            </span>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!body.trim() || isOverLimit || isPending}
          className="bg-buildstory-500 text-background text-xs font-medium py-3 px-6 disabled:opacity-40 disabled:cursor-default transition-colors hover:bg-buildstory-600"
        >
          {isPending ? "Posting..." : "Post"}
        </button>
      </div>

      {error && (
        <div className="px-4 pb-3">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
