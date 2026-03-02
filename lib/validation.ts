/**
 * Server-side field length limits for user-submitted text.
 * These prevent abuse (megabyte payloads, DB bloat) without being
 * restrictive for legitimate use.
 */

// ── Profile fields ──────────────────────────────────────────
export const MAX_DISPLAY_NAME = 100;
export const MAX_BIO = 500;
export const MAX_SOCIAL_HANDLE = 39; // GitHub's max username length
export const MAX_COUNTRY = 2; // ISO 3166-1 alpha-2
export const MAX_REGION = 10; // ISO 3166-2 subdivision codes

// ── URL fields (any) ────────────────────────────────────────
export const MAX_URL = 2000;

// ── Project fields ──────────────────────────────────────────
export const MAX_PROJECT_NAME = 100;
export const MAX_PROJECT_SLUG = 100;
export const MAX_PROJECT_DESCRIPTION = 2000;
export const MAX_GOAL_TEXT = 1000;

// ── Feedback ────────────────────────────────────────────────
export const MAX_FEEDBACK_TITLE = 200;
export const MAX_FEEDBACK_DESCRIPTION = 5000;

// ── Admin ───────────────────────────────────────────────────
export const MAX_BAN_REASON = 1000;

// ── Search queries ──────────────────────────────────────────
export const MAX_SEARCH_QUERY = 100;

// ── Helper ──────────────────────────────────────────────────
export function tooLong(value: string | null | undefined, max: number): boolean {
  if (!value) return false;
  return value.length > max;
}
