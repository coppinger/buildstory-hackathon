import type { Event } from "@/lib/db/schema";

// --- Event Status (admin-controlled, stored in DB) ---

export type EventStatus = Event["status"];

/** Registration is open when event is open or active */
export function isRegistrationOpen(event: Pick<Event, "status">): boolean {
  return event.status === "open" || event.status === "active";
}

/** Submissions are open during active and judging phases */
export function isSubmissionOpen(event: Pick<Event, "status">): boolean {
  return event.status === "active" || event.status === "judging";
}

/** Reviews are open during judging phase */
export function isReviewOpen(event: Pick<Event, "status">): boolean {
  return event.status === "judging";
}

/** Human-readable label for an event status */
export function getEventStateLabel(status: EventStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "open":
      return "Upcoming Event";
    case "active":
      return "On-Going Event";
    case "judging":
      return "Judging In Progress";
    case "complete":
      return "Completed Event";
  }
}

/** Badge color variant for an event status */
export function getEventStateBadgeVariant(
  status: EventStatus
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "active":
      return "default";
    case "open":
      return "secondary";
    case "judging":
      return "outline";
    case "complete":
      return "secondary";
    case "draft":
      return "outline";
  }
}
