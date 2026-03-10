"use client";

import { useState } from "react";
import Link from "next/link";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/roadmap/queries";

interface ContributorLeaderboardProps {
  allTimeEntries: LeaderboardEntry[];
  monthlyEntries: LeaderboardEntry[];
}

const RANK_STYLES: Record<number, string> = {
  1: "bg-amber-50 border-amber-300 dark:bg-amber-950/30 dark:border-amber-700",
  2: "bg-slate-50 border-slate-300 dark:bg-slate-900/30 dark:border-slate-600",
  3: "bg-orange-50 border-orange-300 dark:bg-orange-950/30 dark:border-orange-700",
};

const RANK_ICONS: Record<number, string> = {
  1: "emoji_events",
  2: "workspace_premium",
  3: "military_tech",
};

export function ContributorLeaderboard({
  allTimeEntries,
  monthlyEntries,
}: ContributorLeaderboardProps) {
  const [period, setPeriod] = useState<"all" | "month">("all");
  const entries = period === "all" ? allTimeEntries : monthlyEntries;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setPeriod("all")}
          className={cn(
            "inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            period === "all"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          All time
        </button>
        <button
          type="button"
          onClick={() => setPeriod("month")}
          className={cn(
            "inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            period === "month"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          This month
        </button>
      </div>

      {/* <details className="mb-6 text-sm text-muted-foreground">
        
        <summary className="cursor-pointer hover:text-foreground transition-colors font-medium">
          How scoring works
        </summary>
        <div className="mt-2 pl-4 space-y-1 text-xs">
          <p>
            Ideas submitted: <strong>+10 pts</strong> each
          </p>
          <p>
            Ideas shipped: <strong>+30 pts</strong> each (bonus)
          </p>
          <p>
            Comments: <strong>+3 pts</strong> each
          </p>
          <p>
            Upvotes given: <strong>+1 pt</strong> each
          </p>
        </div>
      </details> */}

      
        <div className="flex gap-6 items-center text-xs text-muted-foreground mt-4 justify-between mb-6 w-full border-t border-border pt-4">          
          <p>
            Ideas submitted: <strong>+10 pts</strong>
          </p>
          <p>
            Ideas shipped: <strong>+30 pts</strong>
          </p>
          <p>
            Comments: <strong>+3 pts</strong>
          </p>
          <p>
            Upvotes given: <strong>+1 pt</strong>
          </p>
        </div>

      {entries.length === 0 ? (
        <div className="mt-8 text-center">
          <p className="text-muted-foreground">
            {period === "month"
              ? "No contributors this month yet. Submit an idea or upvote to get on the board."
              : "No contributors yet. Submit an idea or upvote to get on the board."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => {
            const rank = i + 1;
            const isTop3 = rank <= 3;
            const profileHref = entry.username
              ? `/members/${entry.username}`
              : "#";

            return (
              <div
                key={entry.profileId}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                  isTop3 ? RANK_STYLES[rank] : "border-border bg-card"
                )}
              >
                <div className="w-8 text-center shrink-0">
                  {isTop3 ? (
                    <Icon
                      name={RANK_ICONS[rank]}
                      size="5"
                      className={cn(
                        rank === 1 && "text-amber-500",
                        rank === 2 && "text-slate-400",
                        rank === 3 && "text-orange-500"
                      )}
                    />
                  ) : (
                    <span className="text-sm font-mono text-muted-foreground">
                      {rank}
                    </span>
                  )}
                </div>

                <Link href={profileHref} className="shrink-0">
                  <UserAvatar
                    avatarUrl={entry.avatarUrl}
                    displayName={entry.displayName}
                    size="xs"
                  />
                </Link>

                <Link
                  href={profileHref}
                  className="font-medium text-foreground hover:underline truncate min-w-0 flex-1"
                >
                  {entry.displayName}
                </Link>

                {/* Breakdown columns -- hidden on mobile */}
                <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                  {entry.ideasCount > 0 && (
                    <span
                      className="flex items-center gap-0.5"
                      title="Ideas submitted"
                    >
                      <Icon name="lightbulb" size="3.5" />
                      {entry.ideasCount}
                    </span>
                  )}
                  {entry.shippedCount > 0 && (
                    <span
                      className="flex items-center gap-0.5 text-green-600 dark:text-green-400"
                      title="Ideas shipped"
                    >
                      <Icon name="check_circle" size="3.5" />
                      {entry.shippedCount}
                    </span>
                  )}
                  {entry.commentsCount > 0 && (
                    <span
                      className="flex items-center gap-0.5"
                      title="Comments"
                    >
                      <Icon name="chat_bubble" size="3.5" />
                      {entry.commentsCount}
                    </span>
                  )}
                  {entry.upvotesCount > 0 && (
                    <span
                      className="flex items-center gap-0.5"
                      title="Upvotes given"
                    >
                      <Icon name="arrow_upward" size="3.5" />
                      {entry.upvotesCount}
                    </span>
                  )}
                </div>

                <div className="text-sm font-mono font-medium text-foreground shrink-0 w-12 text-right">
                  {entry.totalScore}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
