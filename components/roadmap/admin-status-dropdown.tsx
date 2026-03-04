"use client";

import { useTransition } from "react";
import { DropdownMenu } from "radix-ui";
import { updateItem } from "@/app/(app)/roadmap/actions";
import { Button } from "@/components/ui/button";
import { StatusBadge, ADMIN_STATUSES } from "./status-badge";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface AdminStatusDropdownProps {
  itemId: string;
  currentStatus: string;
  /** Pass projectId for project-level admin actions */
  projectId?: string;
}

export function AdminStatusDropdown({
  itemId,
  currentStatus,
  projectId,
}: AdminStatusDropdownProps) {
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(status: string) {
    if (status === currentStatus) return;
    startTransition(async () => {
      await updateItem({ itemId, status, projectId });
    });
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          variant="ghost"
          disabled={isPending}
          className="gap-1"
        >
          <StatusBadge status={currentStatus} />
          <Icon
            name="expand_more"
            size="3.5"
            className="text-muted-foreground"
          />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={4}
          className="z-50 min-w-[140px] rounded-md border border-border bg-popover p-1 shadow-md animate-in fade-in-0 zoom-in-95"
        >
          {ADMIN_STATUSES.map((status) => (
            <DropdownMenu.Item
              key={status}
              onClick={() => handleStatusChange(status)}
              className={cn(
                "flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer outline-none hover:bg-accent",
                status === currentStatus && "bg-accent"
              )}
            >
              <StatusBadge status={status} />
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
