"use client";

import { KanbanCard } from "./kanban-card";
import { STATUS_CONFIG } from "./status-badge";
import { Badge } from "@/components/ui/badge";
import type { RoadmapItem } from "@/lib/roadmap/queries";

const PUBLIC_COLUMNS = [
  { key: "now", label: "Now" },
  { key: "next", label: "Next" },
  { key: "exploring", label: "Exploring" },
  { key: "shipped", label: "Shipped" },
] as const;

const ADMIN_COLUMNS = [
  { key: "inbox", label: "Inbox" },
  { key: "now", label: "Now" },
  { key: "next", label: "Next" },
  { key: "exploring", label: "Exploring" },
  { key: "shipped", label: "Shipped" },
  { key: "closed", label: "Closed" },
  { key: "archived", label: "Archived" },
] as const;

interface RoadmapKanbanViewProps {
  items: Record<string, RoadmapItem[]>;
  isAuthenticated: boolean;
  isAdmin?: boolean;
  /** Base path for item links. Defaults to "/roadmap". */
  basePath?: string;
}

export function RoadmapKanbanView({
  items,
  isAuthenticated,
  isAdmin = false,
  basePath = "/roadmap",
}: RoadmapKanbanViewProps) {
  const columns = isAdmin ? ADMIN_COLUMNS : PUBLIC_COLUMNS;

  return (
    <div className="mt-6 flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
      {columns.map(({ key, label }) => {
        const columnItems = items[key] ?? [];
        const config = STATUS_CONFIG[key];
        return (
          <div
            key={key}
            className="flex flex-col min-w-[280px] max-w-[320px] flex-1 snap-start"
          >
            <div className="flex items-center justify-between rounded-t-lg border border-border bg-muted/30 px-3 py-2">
              <h3 className="text-sm font-medium">{config?.label ?? label}</h3>
              <Badge variant="secondary" className="text-xs">
                {columnItems.length}
              </Badge>
            </div>
            <div className="flex-1 space-y-2 rounded-b-lg border border-t-0 border-border bg-background/50 p-2 min-h-[200px]">
              {columnItems.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  No items
                </p>
              ) : (
                columnItems.map((item) => (
                  <KanbanCard
                    key={item.id}
                    item={item}
                    isAuthenticated={isAuthenticated}
                    basePath={basePath}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
