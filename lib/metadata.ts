import type { Metadata } from "next";
import { stripMarkdown } from "@/lib/markdown";

/**
 * Strip markdown and truncate text for use in meta descriptions.
 * Truncates at a word boundary and appends "..." if shortened.
 */
export function truncateForMeta(text: string, maxLength = 160): string {
  const plain = stripMarkdown(text);
  if (plain.length <= maxLength) return plain;
  const truncated = plain.slice(0, maxLength - 3);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + "...";
}

/** Not-found metadata for dynamic routes. */
export const notFoundMeta: Metadata = { title: "Not Found" };

/**
 * Build a Metadata object with title, description, and matching OG/Twitter fields.
 * Pass raw markdown for `description` — it will be stripped and truncated automatically.
 */
export function ogMeta(title: string, rawDescription?: string | null): Metadata {
  const description = rawDescription
    ? truncateForMeta(rawDescription)
    : undefined;

  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { title, description },
  };
}
