"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { ReviewSubmissionCard } from "./review-submission-card";
import { ReviewForm } from "./review-form";
import { getNextReviewableSubmission, submitReview } from "@/app/(app)/hackathons/[slug]/review/actions";
import { Icon } from "@/components/ui/icon";

type SubmissionData = NonNullable<
  Awaited<ReturnType<typeof getNextReviewableSubmission>>
>;

interface ReviewQueueProps {
  eventId: string;
  onReviewSubmitted: () => void;
}

export function ReviewQueue({ eventId, onReviewSubmitted }: ReviewQueueProps) {
  const [current, setCurrent] = useState<SubmissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [skippedIds, setSkippedIds] = useState<string[]>([]);
  const [allDone, setAllDone] = useState(false);
  const [successFlash, setSuccessFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchNext = useCallback(
    async (skipIds: string[]) => {
      setLoading(true);
      setError(null);
      const result = await getNextReviewableSubmission(eventId, skipIds);
      if (result) {
        setCurrent(result);
        setAllDone(false);
      } else {
        setCurrent(null);
        setAllDone(true);
      }
      setLoading(false);
    },
    [eventId]
  );

  useEffect(() => {
    fetchNext(skippedIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (data: {
    feedback: string;
    highlights: { category: string; text: string }[];
  }) => {
    if (!current) return;
    const projectId = current.project.id;

    startTransition(async () => {
      const result = await submitReview(eventId, projectId, data);
      if (result.success) {
        setSuccessFlash(true);
        onReviewSubmitted();
        setTimeout(() => {
          setSuccessFlash(false);
          fetchNext(skippedIds);
        }, 1200);
      } else {
        setError(result.error ?? "Something went wrong");
      }
    });
  };

  const handleSkip = () => {
    if (!current) return;
    const newSkipped = [...skippedIds, current.project.id];
    setSkippedIds(newSkipped);
    fetchNext(newSkipped);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-48 bg-muted animate-pulse" />
        <div className="h-32 bg-muted animate-pulse" />
      </div>
    );
  }

  if (successFlash) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
          <Icon name="check" size="6" className="text-green-500" />
        </div>
        <p className="text-sm font-medium text-foreground">Review submitted!</p>
      </div>
    );
  }

  if (allDone) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div className="h-12 w-12 rounded-full bg-buildstory-500/10 flex items-center justify-center">
          <Icon name="celebration" size="6" className="text-buildstory-500" />
        </div>
        <p className="text-sm font-medium text-foreground">
          You&apos;ve reviewed all available submissions!
        </p>
        <p className="text-xs text-muted-foreground">
          Check back later or view your highlights tab.
        </p>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="flex flex-col gap-6">
      <ReviewSubmissionCard
        submission={current.submission}
        profile={current.profile}
        project={current.project}
        tools={current.tools}
      />

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <ReviewForm
        onSubmit={handleSubmit}
        onSkip={handleSkip}
        isPending={isPending}
      />
    </div>
  );
}
