"use client";

import Link from "next/link";
import { StatusBadge } from "./status-badge";
import { UpvoteButton } from "./upvote-button";
import { AdminStatusDropdown } from "./admin-status-dropdown";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { timeAgo } from "@/lib/time";
import type { RoadmapItem } from "@/lib/roadmap/queries";

interface RoadmapItemCardProps {
  item: RoadmapItem;
  isAdmin: boolean;
  isAuthenticated: boolean;
  /** Base path for item links (e.g., "/projects/my-project/roadmap"). Defaults to "/roadmap". */
  basePath?: string;
  /** Pass projectId for project-level admin actions */
  projectId?: string;
}

export function RoadmapItemCard({
  item,
  isAdmin,
  isAuthenticated,
  basePath = "/roadmap",
  projectId,
}: RoadmapItemCardProps) {
  const descriptionPreview = item.description
    ? item.description.slice(0, 140) +
      (item.description.length > 140 ? "..." : "")
    : null;

  return (
    <div className="flex gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-border/80">
      <UpvoteButton
        itemId={item.id}
        count={item.upvoteCount}
        hasUpvoted={item.hasUpvoted}
        isAuthenticated={isAuthenticated}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin ? (
            <AdminStatusDropdown
              itemId={item.id}
              currentStatus={item.status}
              projectId={projectId}
            />
          ) : (
            <StatusBadge status={item.status} />
          )}
          {item.category && (
            <Badge variant="outline" className="text-xs">
              {item.category.name}
            </Badge>
          )}
        </div>

        <Link
          href={`${basePath}/${item.slug}`}
          className="mt-1.5 block font-medium text-foreground hover:underline"
        >
          {item.title}
        </Link>

        {descriptionPreview && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {descriptionPreview}
          </p>
        )}

        <div className="mt-2.5 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <UserAvatar
              avatarUrl={item.author.avatarUrl}
              displayName={item.author.displayName}
              size="xs"
              className="!w-5 !h-5"
            />
            <span>{item.author.displayName}</span>
          </div>
          <span>{timeAgo(item.createdAt)}</span>
          {item.commentCount > 0 && (
            <span className="flex items-center gap-0.5">
              <Icon name="chat_bubble" size="3" />
              {item.commentCount}
            </span>
          )}
          {item.status === "shipped" && (
            <span className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
              <Icon name="check_circle" size="3" />
              Shipped
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
