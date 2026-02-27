"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import {
  searchUsersForInvite,
  sendDirectInvite,
} from "@/app/(app)/projects/[slug]/team-actions";

interface InviteUserSearchProps {
  projectId: string;
}

export function InviteUserSearch({ projectId }: InviteUserSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { id: string; displayName: string; username: string | null }[]
  >([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const search = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed.length < 2) {
        setResults([]);
        setShowDropdown(false);
        return;
      }
      startTransition(async () => {
        const result = await searchUsersForInvite({
          projectId,
          query: trimmed,
        });
        if (result.success && result.data) {
          setResults(result.data);
          setShowDropdown(result.data.length > 0);
        }
      });
    },
    [projectId]
  );

  useEffect(() => {
    const timer = setTimeout(() => search(query), 400);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  function handleSelect(username: string | null) {
    if (!username) return;
    setShowDropdown(false);
    setQuery("");
    setResults([]);

    startTransition(async () => {
      const result = await sendDirectInvite({
        projectId,
        recipientUsername: username,
      });
      if (result.success) {
        setFeedback({ type: "success", message: `Invite sent to @${username}` });
        router.refresh();
      } else {
        setFeedback({ type: "error", message: result.error });
      }
    });
  }

  return (
    <div className="relative">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by username or name..."
        disabled={isPending}
        onFocus={() => results.length > 0 && setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
      />

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1 border border-border bg-background shadow-lg max-h-48 overflow-y-auto">
          {results.map((user) => (
            <button
              key={user.id}
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center justify-between cursor-pointer"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(user.username)}
            >
              <div>
                <span className="text-foreground font-medium">
                  {user.displayName}
                </span>
                {user.username && (
                  <span className="ml-2 text-muted-foreground font-mono">
                    @{user.username}
                  </span>
                )}
              </div>
              <Icon name="person_add" size="4" className="text-muted-foreground" />
            </button>
          ))}
        </div>
      )}

      {feedback && (
        <p
          className={`mt-2 text-xs ${feedback.type === "success" ? "text-green-600" : "text-destructive"}`}
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
