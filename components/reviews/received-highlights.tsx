"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { getCategoryLabel, getCategoryIcon, getCategoryColor } from "@/lib/review-categories";

interface ReceivedReview {
  id: string;
  feedback: string;
  createdAt: string;
  reviewer: {
    displayName: string;
    username: string | null;
    avatarUrl: string | null;
  };
  highlights: {
    category: string;
    text: string;
  }[];
}

interface ReceivedHighlightsProps {
  reviews: ReceivedReview[];
}

export function ReceivedHighlights({ reviews }: ReceivedHighlightsProps) {
  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <Icon name="rate_review" size="6" className="text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          No reviews yet. Check back after others start reviewing!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {reviews.length} {reviews.length === 1 ? "review" : "reviews"} received
      </p>

      {reviews.map((review) => (
        <Card key={review.id} className="flex flex-col gap-3">
          {/* Reviewer info */}
          <div className="flex items-center gap-2">
            {review.reviewer.avatarUrl ? (
              <Image
                src={review.reviewer.avatarUrl}
                alt={review.reviewer.displayName}
                width={24}
                height={24}
                className="h-6 w-6 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground shrink-0">
                {review.reviewer.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm font-medium text-foreground">
              {review.reviewer.displayName}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {new Date(review.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Feedback */}
          <p className="text-sm text-foreground/90">{review.feedback}</p>

          {/* Highlights */}
          {review.highlights.length > 0 && (
            <div className="flex flex-col gap-2">
              {review.highlights.map((h) => (
                <div key={h.category} className="flex items-start gap-2">
                  <Badge
                    variant="outline"
                    className={`text-xs gap-1 shrink-0 ${getCategoryColor(h.category)}`}
                  >
                    <Icon name={getCategoryIcon(h.category)} size="3" />
                    {getCategoryLabel(h.category)}
                  </Badge>
                  <p className="text-xs text-muted-foreground">{h.text}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
