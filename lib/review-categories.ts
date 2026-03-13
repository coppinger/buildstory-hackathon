export const HIGHLIGHT_CATEGORIES = [
  {
    value: "creativity" as const,
    label: "Creativity",
    icon: "lightbulb",
    colorClass: "text-amber-500 bg-amber-500/10",
  },
  {
    value: "business_case" as const,
    label: "Business Case",
    icon: "trending_up",
    colorClass: "text-green-500 bg-green-500/10",
  },
  {
    value: "technical_challenge" as const,
    label: "Technical Challenge",
    icon: "code",
    colorClass: "text-blue-500 bg-blue-500/10",
  },
  {
    value: "impact" as const,
    label: "Impact",
    icon: "bolt",
    colorClass: "text-purple-500 bg-purple-500/10",
  },
  {
    value: "design" as const,
    label: "Design",
    icon: "palette",
    colorClass: "text-pink-500 bg-pink-500/10",
  },
] as const;

export type HighlightCategoryValue = (typeof HIGHLIGHT_CATEGORIES)[number]["value"];

export function getCategoryMeta(category: string) {
  return HIGHLIGHT_CATEGORIES.find((c) => c.value === category);
}

export function getCategoryLabel(category: string): string {
  return getCategoryMeta(category)?.label ?? category;
}

export function getCategoryIcon(category: string): string {
  return getCategoryMeta(category)?.icon ?? "star";
}

export function getCategoryColor(category: string): string {
  return getCategoryMeta(category)?.colorClass ?? "text-muted-foreground bg-muted";
}
