"use client";

import { useTransition, useOptimistic } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toggleUpvote } from "@/app/(app)/roadmap/actions";
import { Icon } from "@/components/ui/icon";

interface UpvoteButtonProps {
  itemId: string;
  count: number;
  hasUpvoted: boolean;
  isAuthenticated: boolean;
  compact?: boolean;
}

export function UpvoteButton({
  itemId,
  count,
  hasUpvoted,
  isAuthenticated,
  compact = false,
}: UpvoteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    { count, hasUpvoted },
    (_state, newUpvoted: boolean) => ({
      count: newUpvoted ? _state.count + 1 : _state.count - 1,
      hasUpvoted: newUpvoted,
    })
  );

  function handleClick() {
    if (!isAuthenticated) {
      router.push("/sign-in");
      return;
    }

    startTransition(async () => {
      setOptimistic(!optimistic.hasUpvoted);
      await toggleUpvote({ itemId });
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "flex items-center gap-1 rounded-md border transition-colors h-fit",
        compact ? "px-2 py-1" : "flex-col px-3 py-2",
        optimistic.hasUpvoted
          ? "border-primary/30 bg-primary/5 text-primary"
          : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-primary"
      )}
    >
      <Icon
        name="arrow_drop_up"
        size={compact ? "4" : "5"}
        className={cn(
          optimistic.hasUpvoted ? "text-primary" : "text-muted-foreground"
        )}
      />
      <span className={cn("font-medium", compact ? "text-xs" : "text-sm")}>
        {optimistic.count}
      </span>
    </button>
  );
}
