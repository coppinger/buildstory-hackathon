"use client";

import { useOptimistic, useTransition } from "react";
import { toggleReaction } from "@/app/(app)/content/actions";
import { REACTION_EMOJIS } from "@/lib/constants";

type ReactionEmojiKey = typeof REACTION_EMOJIS[number]["key"];

interface ReactionState {
  summary: Record<string, number>;
  userEmojis: string[];
}

export function ReactionBar({
  targetType,
  targetId,
  summary,
  userReactions,
  currentUserProfileId,
}: {
  targetType: "post" | "comment";
  targetId: string;
  summary: Record<string, number>;
  userReactions: string[];
  currentUserProfileId: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic<ReactionState, string>(
    { summary, userEmojis: userReactions },
    (state, emoji) => {
      const hasIt = state.userEmojis.includes(emoji);
      return {
        summary: {
          ...state.summary,
          [emoji]: Math.max(0, (state.summary[emoji] ?? 0) + (hasIt ? -1 : 1)),
        },
        userEmojis: hasIt
          ? state.userEmojis.filter((e) => e !== emoji)
          : [...state.userEmojis, emoji],
      };
    }
  );

  function handleToggle(emojiKey: string) {
    if (!currentUserProfileId) return;

    startTransition(async () => {
      setOptimistic(emojiKey);
      await toggleReaction({
        targetType,
        targetId,
        emoji: emojiKey as ReactionEmojiKey,
      });
    });
  }

  return (
    <div className="flex items-center gap-1">
      {REACTION_EMOJIS.map(({ key, label, emoji }) => {
        const count = optimistic.summary[key] ?? 0;
        const isActive = optimistic.userEmojis.includes(key);

        return (
          <button
            key={key}
            onClick={() => handleToggle(key)}
            disabled={!currentUserProfileId || isPending}
            title={label}
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs rounded-full border transition-colors ${
              isActive
                ? "border-buildstory-500/40 bg-buildstory-500/10 text-foreground"
                : "border-transparent hover:border-border text-muted-foreground hover:text-foreground"
            } ${!currentUserProfileId ? "opacity-50 cursor-default" : "cursor-pointer"}`}
          >
            <span className="text-xs">{emoji}</span>
            {count > 0 && (
              <span className="font-mono text-[10px]">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
