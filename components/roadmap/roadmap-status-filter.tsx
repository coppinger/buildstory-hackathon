"use client";

import { useTransition } from "react";
import { useQueryStates } from "nuqs";
import { roadmapParsers } from "@/lib/search-params";
import { VISIBLE_STATUSES, ADMIN_STATUSES, STATUS_CONFIG } from "./status-badge";
import { cn } from "@/lib/utils";

interface RoadmapStatusFilterProps {
  counts: Record<string, number>;
  isAdmin: boolean;
}

export function RoadmapStatusFilter({
  counts,
  isAdmin,
}: RoadmapStatusFilterProps) {
  const [isPending, startTransition] = useTransition();
  const [params, setParams] = useQueryStates(roadmapParsers, {
    shallow: false,
    startTransition,
  });

  const statuses = isAdmin
    ? ["all", ...ADMIN_STATUSES]
    : ["all", ...VISIBLE_STATUSES];

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {statuses.map((status) => {
        const isActive = params.status === status;
        const count = counts[status] ?? 0;
        const label =
          status === "all" ? "All" : (STATUS_CONFIG[status]?.label ?? status);

        return (
          <button
            key={status}
            type="button"
            disabled={isPending}
            onClick={() => setParams({ status, page: 1 })}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-foreground text-background"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            {label}
            <span
              className={cn(
                "text-xs",
                isActive ? "text-background/70" : "text-muted-foreground/60"
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
