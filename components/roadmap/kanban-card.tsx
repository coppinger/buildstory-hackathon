"use client";

import Link from "next/link";
import { UpvoteButton } from "./upvote-button";
import { Badge } from "@/components/ui/badge";
import type { RoadmapItem } from "@/lib/roadmap/queries";

interface KanbanCardProps {
  item: RoadmapItem;
  isAuthenticated: boolean;
  /** Base path for item links (e.g., "/projects/my-project/roadmap"). Defaults to "/roadmap". */
  basePath?: string;
}

export function KanbanCard({ item, isAuthenticated, basePath = "/roadmap" }: KanbanCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 transition-colors hover:border-border/80">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`${basePath}/${item.slug}`}
          className="text-sm font-medium text-foreground hover:underline line-clamp-2"
        >
          {item.title}
        </Link>
        <UpvoteButton
          itemId={item.id}
          count={item.upvoteCount}
          hasUpvoted={item.hasUpvoted}
          isAuthenticated={isAuthenticated}
          compact
        />
      </div>
      {item.category && (
        <Badge variant="outline" className="mt-2 text-xs">
          {item.category.name}
        </Badge>
      )}
    </div>
  );
}
