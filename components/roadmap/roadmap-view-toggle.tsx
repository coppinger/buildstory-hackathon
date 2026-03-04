"use client";

import { useTransition } from "react";
import { useQueryStates } from "nuqs";
import { roadmapParsers } from "@/lib/search-params";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export function RoadmapViewToggle() {
  const [isPending, startTransition] = useTransition();
  const [params, setParams] = useQueryStates(roadmapParsers, {
    shallow: false,
    startTransition,
  });

  const views = [
    { value: "list" as const, icon: "view_list", label: "List" },
    { value: "kanban" as const, icon: "view_kanban", label: "Board" },
    { value: "contributors" as const, icon: "leaderboard", label: "Contributors" },
  ];

  return (
    <div className="mt-6 flex items-center gap-1 rounded-lg border border-border p-1 w-fit">
      {views.map((v) => (
        <button
          key={v.value}
          type="button"
          disabled={isPending}
          onClick={() => setParams({ view: v.value })}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            params.view === v.value
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon name={v.icon} size="4" />
          {v.label}
        </button>
      ))}
    </div>
  );
}
