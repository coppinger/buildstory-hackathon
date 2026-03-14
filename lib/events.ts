import type { Event } from "@/lib/db/schema";

// --- Computed Event State Machine ---

export type ComputedEventState =
  | "draft"
  | "upcoming"
  | "active"
  | "judging"
  | "complete";

/** 48-hour judging window after event ends */
export const JUDGING_DURATION_MS = 48 * 60 * 60 * 1000;

/**
 * Derives the current state of an event from its dates and status.
 * Date-driven — no manual status toggling needed for the happy path.
 * Explicit DB status for "draft" and "judging" is always respected,
 * allowing admins to hold judging open beyond the automatic 48-hour window.
 */
export function getComputedEventState(
  event: Pick<Event, "status" | "startsAt" | "endsAt">
): ComputedEventState {
  if (event.status === "draft") return "draft";
  if (event.status === "judging") return "judging";

  const now = new Date();

  if (now < event.startsAt) return "upcoming";
  if (now < event.endsAt) return "active";
  if (now.getTime() < event.endsAt.getTime() + JUDGING_DURATION_MS)
    return "judging";

  return "complete";
}

/** Registration is open when event is upcoming or active */
export function isRegistrationOpen(
  event: Pick<Event, "status" | "startsAt" | "endsAt">
): boolean {
  const state = getComputedEventState(event);
  return state === "upcoming" || state === "active";
}

/** Submissions are open during active and judging phases */
export function isSubmissionOpen(
  event: Pick<Event, "status" | "startsAt" | "endsAt">
): boolean {
  const state = getComputedEventState(event);
  return state === "active" || state === "judging";
}

/** Human-readable label for a computed event state */
export function getEventStateLabel(state: ComputedEventState): string {
  switch (state) {
    case "draft":
      return "Draft";
    case "upcoming":
      return "Upcoming Event";
    case "active":
      return "On-Going Event";
    case "judging":
      return "Judging In Progress";
    case "complete":
      return "Completed Event";
  }
}

/** Reviews are open between reviewOpensAt (or endsAt if unset) and reviewClosesAt */
export function isReviewOpen(
  event: Pick<Event, "endsAt" | "reviewOpensAt" | "reviewClosesAt">
): boolean {
  const now = new Date();
  const opensAt = event.reviewOpensAt ?? event.endsAt;
  if (now < opensAt) return false;
  if (event.reviewClosesAt && now >= event.reviewClosesAt) return false;
  return true;
}

/** Badge color variant for a computed event state */
export function getEventStateBadgeVariant(
  state: ComputedEventState
): "default" | "secondary" | "outline" | "destructive" {
  switch (state) {
    case "active":
      return "default";
    case "upcoming":
      return "secondary";
    case "judging":
      return "outline";
    case "complete":
      return "secondary";
    case "draft":
      return "outline";
  }
}

/**
 * Returns a human-readable label for an event's current status.
 * Uses getComputedEventState internally.
 */
export function getEventStatusLabel(
  event: Pick<Event, "status" | "startsAt" | "endsAt">
): string {
  return getEventStateLabel(getComputedEventState(event));
}
