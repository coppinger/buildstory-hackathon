"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { HIGHLIGHT_CATEGORIES } from "@/lib/review-categories";
import { cn } from "@/lib/utils";

const MAX_FEEDBACK_LENGTH = 512;
const MAX_HIGHLIGHT_TEXT = 256;
const MAX_HIGHLIGHTS = 3;

interface ReviewFormProps {
  onSubmit: (data: {
    feedback: string;
    highlights: { category: string; text: string }[];
  }) => void;
  onSkip: () => void;
  isPending: boolean;
}

export function ReviewForm({ onSubmit, onSkip, isPending }: ReviewFormProps) {
  const [feedback, setFeedback] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<
    Map<string, string>
  >(new Map());

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) => {
      const next = new Map(prev);
      if (next.has(category)) {
        next.delete(category);
      } else if (next.size < MAX_HIGHLIGHTS) {
        next.set(category, "");
      }
      return next;
    });
  };

  const updateHighlightText = (category: string, text: string) => {
    setSelectedCategories((prev) => {
      const next = new Map(prev);
      next.set(category, text);
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    const highlights = Array.from(selectedCategories.entries())
      .filter(([, text]) => text.trim().length > 0)
      .map(([category, text]) => ({ category, text: text.trim() }));

    onSubmit({ feedback: feedback.trim(), highlights });
  };

  const canSubmit = feedback.trim().length > 0 && !isPending;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Feedback textarea */}
      <div>
        <label
          htmlFor="feedback"
          className="text-base font-medium text-foreground block mb-1"
        >
          Your feedback
        </label>
        <p className="text-sm text-muted-foreground mb-3">
          Be encouraging and specific — what did this builder do well? What would help them grow?
        </p>
        <textarea
          id="feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          maxLength={MAX_FEEDBACK_LENGTH}
          rows={4}
          placeholder="Share your thoughts. Keep it kind and constructive."
          className="w-full border bg-background text-foreground text-sm p-3 resize-none focus:outline-hidden focus:ring-1 focus:ring-buildstory-500"
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground mt-1 text-right font-mono">
          {feedback.length}/{MAX_FEEDBACK_LENGTH}
        </p>
      </div>

      {/* Highlight categories */}
      <div>
        <p className="text-base font-medium text-foreground mb-1">
          Highlights{" "}
          <span className="text-muted-foreground font-normal">
            (optional, up to {MAX_HIGHLIGHTS})
          </span>
        </p>
        <p className="text-sm text-muted-foreground mb-3">
          Select categories where this project shines and add a short note.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {HIGHLIGHT_CATEGORIES.map((cat) => {
            const isSelected = selectedCategories.has(cat.value);
            const isDisabled =
              !isSelected && selectedCategories.size >= MAX_HIGHLIGHTS;

            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => toggleCategory(cat.value)}
                disabled={isDisabled || isPending}
                className={cn(
                  "inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm border transition-colors",
                  isSelected
                    ? `${cat.colorClass} border-current`
                    : "text-muted-foreground border-border hover:border-foreground/30",
                  isDisabled && "opacity-40 cursor-not-allowed"
                )}
              >
                <Icon name={cat.icon} size="4" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Text inputs for selected highlights */}
        {selectedCategories.size > 0 && (
          <div className="flex flex-col gap-3 mt-4">
            {Array.from(selectedCategories.entries()).map(([category, text]) => {
              const meta = HIGHLIGHT_CATEGORIES.find(
                (c) => c.value === category
              );
              return (
                <div key={category}>
                  <label className="text-xs text-muted-foreground block mb-1">
                    <span className={meta?.colorClass}>
                      <Icon
                        name={meta?.icon ?? "star"}
                        size="3"
                        className="inline mr-1"
                      />
                      {meta?.label}
                    </span>
                  </label>
                  <textarea
                    value={text}
                    onChange={(e) =>
                      updateHighlightText(category, e.target.value)
                    }
                    maxLength={MAX_HIGHLIGHT_TEXT}
                    rows={2}
                    placeholder={`What makes this project stand out for ${meta?.label.toLowerCase()}?`}
                    className="w-full border bg-background text-foreground text-sm p-3 resize-none focus:outline-hidden focus:ring-1 focus:ring-buildstory-500"
                    disabled={isPending}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={!canSubmit} className="flex-1">
          {isPending ? "Submitting..." : "Submit Review"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onSkip}
          disabled={isPending}
        >
          Skip
        </Button>
      </div>
    </form>
  );
}
