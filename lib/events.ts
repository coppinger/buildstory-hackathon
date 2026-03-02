import type { Event } from "@/lib/db/schema";

/**
 * Returns a human-readable label for an event's current status.
 *
 * Primary: maps the DB `status` enum directly.
 * Fallback: if the status doesn't match reality (e.g., status is still
 * "open" but the event has already started), the date range wins.
 */
export function getEventStatusLabel(
  event: Pick<Event, "status" | "startsAt" | "endsAt">
): string {
  // Judging and complete are explicit admin-set phases — trust them directly.
  if (event.status === "judging") return "Judging In Progress";
  if (event.status === "complete") return "Completed Event";

  // For draft/open/active, cross-reference with dates to catch stale status.
  const now = new Date();
  if (event.startsAt && event.endsAt) {
    return datesToLabel(now, event.startsAt, event.endsAt);
  }

  // No dates available, fall back to status enum mapping.
  return statusToLabel(event.status);
}

function statusToLabel(
  status: Event["status"]
): string {
  switch (status) {
    case "draft":
    case "open":
      return "Upcoming Event";
    case "active":
      return "On-Going Event";
    case "judging":
      return "Judging In Progress";
    case "complete":
      return "Completed Event";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function datesToLabel(
  now: Date,
  startsAt: Date,
  endsAt: Date
): string {
  if (now < startsAt) {
    return "Upcoming Event";
  }
  if (now <= endsAt) {
    return "On-Going Event";
  }
  return "Completed Event";
}
