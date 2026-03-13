import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { getCategoryLabel, getCategoryIcon, getCategoryColor } from "@/lib/review-categories";

interface HighlightBadgesProps {
  categories: { category: string; count: number }[];
  totalReviews: number;
}

export function HighlightBadges({ categories, totalReviews }: HighlightBadgesProps) {
  if (totalReviews === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-muted-foreground font-mono mr-1">
        {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
      </span>
      {categories.map((c) => (
        <Badge
          key={c.category}
          variant="outline"
          className={`text-xs gap-1 ${getCategoryColor(c.category)}`}
        >
          <Icon name={getCategoryIcon(c.category)} size="3" />
          {getCategoryLabel(c.category)}
          {c.count > 1 && (
            <span className="opacity-70">{c.count}</span>
          )}
        </Badge>
      ))}
    </div>
  );
}
