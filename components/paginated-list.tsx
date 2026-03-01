"use client";

import { useRef, useTransition } from "react";
import { useQueryStates } from "nuqs";
import { paginationParsers } from "@/lib/search-params";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

interface PaginatedListProps {
  children: React.ReactNode;
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function PaginatedList({
  children,
  totalCount,
  page,
  pageSize,
  totalPages,
}: PaginatedListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  const [, setParams] = useQueryStates(paginationParsers, {
    shallow: false,
    startTransition,
  });

  if (totalPages <= 1) return <>{children}</>;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);

  function handlePageChange(newPage: number) {
    setParams({ page: newPage });
    containerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <div ref={containerRef}>
      <div
        className="relative transition-opacity duration-150"
        style={{
          opacity: isPending ? 0.6 : 1,
          pointerEvents: isPending ? "none" : "auto",
        }}
      >
        {children}
        {isPending && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon
              name="progress_activity"
              size="5"
              className="animate-spin text-muted-foreground"
            />
          </div>
        )}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {start}&ndash;{end} of {totalCount}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isPending}
              onClick={() => handlePageChange(page - 1)}
            >
              <Icon name="chevron_left" size="4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isPending}
              onClick={() => handlePageChange(page + 1)}
            >
              Next
              <Icon name="chevron_right" size="4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
