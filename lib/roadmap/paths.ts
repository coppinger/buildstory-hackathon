/**
 * Build URL paths for roadmap items.
 *
 * Platform board:  /roadmap, /roadmap/{itemSlug}
 * Project board:   /projects/{projectSlug}/roadmap, /projects/{projectSlug}/roadmap/{itemSlug}
 */

/** Return the base path for a roadmap board (list page). */
export function roadmapBasePath(projectSlug?: string | null): string {
  if (projectSlug) return `/projects/${projectSlug}/roadmap`;
  return "/roadmap";
}

/** Return the path to a single roadmap item's detail page. */
export function roadmapItemPath(
  itemSlug: string | null,
  projectSlug?: string | null
): string {
  const base = roadmapBasePath(projectSlug);
  if (!itemSlug) return base;
  return `${base}/${itemSlug}`;
}
