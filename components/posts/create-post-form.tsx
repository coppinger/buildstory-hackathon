"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createPost } from "@/app/(app)/content/actions";
import { POST_BODY_MAX_LENGTH } from "@/lib/constants";

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
    <div className="border border-border p-4">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={
          contextType === "project"
            ? "Share a project update..."
            : "Start a discussion..."
        }
        className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[60px]"
        rows={2}
        disabled={isPending}
      />

      {showLink && (
        <input
          type="url"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="https://..."
          className="mt-2 w-full border border-border bg-transparent px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30"
          disabled={isPending}
        />
      )}

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowLink(!showLink)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            disabled={isPending}
          >
            {showLink ? "- Remove link" : "+ Add link"}
          </button>
          <span
            className={`text-xs font-mono ${
              isOverLimit
                ? "text-destructive"
                : charCount > POST_BODY_MAX_LENGTH - 40
                  ? "text-yellow-500"
                  : "text-muted-foreground"
            }`}
          >
            {charCount}/{POST_BODY_MAX_LENGTH}
          </span>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!body.trim() || isOverLimit || isPending}
          size="sm"
          className="bg-buildstory-500 text-background"
        >
          {isPending ? "Posting..." : "Post"}
        </Button>
      </div>

      {error && (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
