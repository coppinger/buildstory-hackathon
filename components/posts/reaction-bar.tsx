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

  const hasAny = REACTION_EMOJIS.some(({ key }) => (optimistic.summary[key] ?? 0) > 0);

  return (
    <div className="flex items-center gap-4">
      {REACTION_EMOJIS.map(({ key, label, emoji }) => {
        const count = optimistic.summary[key] ?? 0;
        const isActive = optimistic.userEmojis.includes(key);

        if (count === 0 && !isActive && hasAny) return null;

        return (
          <button
            key={key}
            onClick={() => handleToggle(key)}
            disabled={!currentUserProfileId || isPending}
            title={label}
            className={`inline-flex items-center gap-[3px] rounded-full border text-xs transition-all duration-150 ${
              count > 0 || isActive ? "px-2 py-[3px]" : "px-[5px] py-[3px]"
            } ${
              isActive
                ? "border-buildstory-500/30 bg-buildstory-500/10 text-foreground"
                : "border-transparent text-muted-foreground/50 hover:text-muted-foreground"
            } ${!currentUserProfileId ? "opacity-40 cursor-default" : "cursor-pointer active:scale-90"}`}
          >
            <span className={`text-xs leading-none ${!isActive && count === 0 ? "opacity-50" : ""}`}>{emoji}</span>
            {count > 0 && (
              <span className="font-mono text-xs leading-none tabular-nums">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
