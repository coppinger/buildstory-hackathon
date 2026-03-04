import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  inbox: {
    label: "Inbox",
    className: "bg-muted text-muted-foreground",
  },
  exploring: {
    label: "Exploring",
    className:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  },
  next: {
    label: "Next",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  now: {
    label: "Now",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
  shipped: {
    label: "Shipped",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  },
  closed: {
    label: "Closed",
    className:
      "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
  },
  archived: {
    label: "Archived",
    className:
      "bg-gray-100 text-gray-500 dark:bg-gray-800/30 dark:text-gray-400",
  },
};

export { STATUS_CONFIG };

export const VISIBLE_STATUSES = [
  "exploring",
  "next",
  "now",
  "shipped",
] as const;
export const ADMIN_STATUSES = [
  "inbox",
  "exploring",
  "next",
  "now",
  "shipped",
  "closed",
  "archived",
] as const;

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
