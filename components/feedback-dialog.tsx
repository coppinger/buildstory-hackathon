"use client";

import { useState, useTransition } from "react";
import { AlertDialog } from "radix-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitFeedback } from "@/app/(app)/feedback/actions";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError("");
    startTransition(async () => {
      const result = await submitFeedback({
        title: title.trim(),
        description: description.trim(),
      });
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error);
      }
    });
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      // Reset state when closing
      setTimeout(() => {
        setTitle("");
        setDescription("");
        setError("");
        setSubmitted(false);
      }, 200);
    }
    onOpenChange(next);
  }

  return (
    <AlertDialog.Root open={open} onOpenChange={handleOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <AlertDialog.Content className="fixed inset-x-4 bottom-4 top-auto sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-auto sm:w-full sm:max-w-md border border-border bg-background p-6 shadow-lg rounded-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-bottom sm:data-[state=closed]:slide-out-to-bottom-0 data-[state=open]:slide-in-from-bottom sm:data-[state=open]:slide-in-from-bottom-0">
          {submitted ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <AlertDialog.Title className="font-heading text-lg">
                Thank you for your feedback
              </AlertDialog.Title>
              <AlertDialog.Description className="text-sm text-muted-foreground">
                We&apos;ll take a look as soon as possible.
              </AlertDialog.Description>
              <Button
                className="mt-4"
                onClick={() => handleOpenChange(false)}
              >
                Close
              </Button>
            </div>
          ) : (
            <>
              <AlertDialog.Title className="font-heading text-2xl">
                Send feedback
              </AlertDialog.Title>
              <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
                Help us improve Buildstory. Bug reports, feature requests, and
                general feedback are all welcome.
              </AlertDialog.Description>

              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="feedback-title" className="text-sm">
                    Title
                  </Label>
                  <Input
                    id="feedback-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief summary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feedback-description" className="text-sm">
                    Description
                  </Label>
                  <Textarea
                    id="feedback-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell us more..."
                    className="resize-none"
                    rows={4}
                  />
                </div>
              </div>

              {error && (
                <p className="mt-3 text-sm text-destructive">{error}</p>
              )}

              <div className="mt-6 flex items-center justify-end gap-3">
                <AlertDialog.Cancel asChild>
                  <Button variant="outline" disabled={isPending}>
                    Cancel
                  </Button>
                </AlertDialog.Cancel>
                <Button
                  onClick={handleSubmit}
                  disabled={isPending || !title.trim() || !description.trim()}
                >
                  {isPending ? "Sending..." : "Submit"}
                </Button>
              </div>
            </>
          )}
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
