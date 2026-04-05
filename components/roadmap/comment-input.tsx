"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import {
  submitComment,
  searchUsersForMentionAction,
} from "@/app/(app)/roadmap/actions";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";

interface MentionUser {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
}

interface CommentInputProps {
  itemId: string;
  parentCommentId?: string;
  onCancel?: () => void;
  onSubmitted?: () => void;
  /** Optional base path for revalidation (e.g., "/projects/my-project/roadmap") */
  basePath?: string;
}

export function CommentInput({
  itemId,
  parentCommentId,
  onCancel,
  onSubmitted,
  basePath,
}: CommentInputProps) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [mentionResults, setMentionResults] = useState<MentionUser[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionSearchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const isReply = !!parentCommentId;

  function handleSubmit() {
    if (!body.trim()) return;
    setError(null);

    startTransition(async () => {
      const result = await submitComment({
        itemId,
        body: body.trim(),
        parentCommentId: parentCommentId ?? null,
        basePath,
      });
      if (result.success) {
        setBody("");
        onSubmitted?.();
      } else {
        setError(result.error);
      }
    });
  }

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setBody(value);

      // Check for @mention trigger
      const cursorPos = e.target.selectionStart;
      const textBeforeCursor = value.slice(0, cursorPos);
      const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

      if (mentionMatch) {
        const query = mentionMatch[1];

        if (query.length >= 1) {
          // Debounce the search
          if (mentionSearchTimeout.current) {
            clearTimeout(mentionSearchTimeout.current);
          }
          mentionSearchTimeout.current = setTimeout(async () => {
            const result = await searchUsersForMentionAction({ query });
            if (result.success && result.data) {
              setMentionResults(result.data);
              setShowMentions(result.data.length > 0);
            }
          }, 200);
        } else {
          setShowMentions(false);
          setMentionResults([]);
        }
      } else {
        setShowMentions(false);
        setMentionResults([]);
      }
    },
    []
  );

  function insertMention(user: MentionUser) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = body.slice(0, cursorPos);
    const textAfterCursor = body.slice(cursorPos);

    // Replace the @query with @username
    const mentionText = user.username ?? user.displayName;
    const newTextBefore = textBeforeCursor.replace(
      /@\w*$/,
      `@${mentionText} `
    );

    setBody(newTextBefore + textAfterCursor);
    setShowMentions(false);
    setMentionResults([]);

    // Focus back on textarea
    setTimeout(() => {
      textarea.focus();
      const newPos = newTextBefore.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  }

  return (
    <div className="space-y-2 relative">
      <textarea
        ref={textareaRef}
        value={body}
        onChange={handleChange}
        placeholder={
          isReply
            ? "Write a reply... (use @ to mention users)"
            : "Add a comment... (use @ to mention users)"
        }
        rows={isReply ? 2 : 3}
        maxLength={5000}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring resize-none"
      />

      {showMentions && mentionResults.length > 0 && (
        <div className="absolute z-50 bottom-full mb-1 left-0 w-64 max-h-48 overflow-y-auto rounded-lg border border-border bg-background shadow-lg">
          {mentionResults.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => insertMention(user)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
            >
              <UserAvatar
                avatarUrl={user.avatarUrl}
                displayName={user.displayName}
                size="xs"
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{user.displayName}</p>
                {user.username && (
                  <p className="text-xs text-muted-foreground truncate">
                    @{user.username}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center gap-2 justify-end">
        {onCancel && (
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={isPending || !body.trim()}
        >
          {isPending ? "Posting..." : isReply ? "Reply" : "Comment"}
        </Button>
      </div>
    </div>
  );
}
