"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { ReviewQueue } from "./review-queue";
import { ReceivedHighlights } from "./received-highlights";
import { cn } from "@/lib/utils";

type Tab = "queue" | "highlights";

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

interface ReviewPageClientProps {
  eventId: string;
  eventSlug: string;
  reviewOpen: boolean;
  initialReviewCount: number;
  totalSubmissions: number;
  userProjectId: string;
  receivedReviews: ReceivedReview[];
}

export function ReviewPageClient({
  eventId,
  eventSlug,
  reviewOpen,
  initialReviewCount,
  totalSubmissions,
  receivedReviews,
}: ReviewPageClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("queue");
  const [reviewCount, setReviewCount] = useState(initialReviewCount);

  // The user can't review their own project, so subtract 1 from total
  const reviewableCount = Math.max(0, totalSubmissions - 1);
  const progressPct =
    reviewableCount > 0
      ? Math.min(100, Math.round((reviewCount / reviewableCount) * 100))
      : 0;

  if (!reviewOpen) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <Icon name="schedule" size="6" className="text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">
          Reviews are not currently open
        </p>
        <p className="text-xs text-muted-foreground">
          Check back when the review period begins.
        </p>
        <Link
          href={`/hackathons/${eventSlug}`}
          className="text-xs font-mono text-buildstory-500 hover:text-foreground transition-colors mt-2"
        >
          &larr; Back to hackathon
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <Link
          href={`/hackathons/${eventSlug}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors font-mono"
        >
          &larr; Back to hackathon
        </Link>
        <h1 className="text-2xl font-heading mt-4">Peer Review</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review fellow builders&apos; submissions and highlight what stands out.
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground">
            {reviewCount} of {reviewableCount} reviewed
          </span>
          <span className="text-xs font-mono text-muted-foreground">
            {progressPct}%
          </span>
        </div>
        <div className="h-1.5 bg-muted overflow-hidden">
          <div
            className="h-full bg-buildstory-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab("queue")}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
            activeTab === "queue"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Review Queue
        </button>
        <button
          onClick={() => setActiveTab("highlights")}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
            activeTab === "highlights"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Your Highlights
          {receivedReviews.length > 0 && (
            <span className="ml-1.5 text-xs text-muted-foreground">
              ({receivedReviews.length})
            </span>
          )}
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "queue" ? (
        <ReviewQueue
          eventId={eventId}
          onReviewSubmitted={() => setReviewCount((c) => c + 1)}
        />
      ) : (
        <ReceivedHighlights reviews={receivedReviews} />
      )}
    </div>
  );
}
