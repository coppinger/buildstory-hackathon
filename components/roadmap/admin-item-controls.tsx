"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/ui/icon";
import { AdminStatusDropdown } from "./admin-status-dropdown";
import { updateItem, pushToLinear } from "@/app/(app)/roadmap/actions";

interface AdminItemControlsProps {
  item: {
    id: string;
    status: string;
    internalNotes: string | null;
    linearIssueId: string | null;
    linearIssueUrl: string | null;
    title: string;
    description: string | null;
    slug: string | null;
    upvoteCount: number;
    commentCount: number;
    authorDisplayName: string;
  };
  /** Pass projectId for project-level admin actions */
  projectId?: string;
}

export function AdminItemControls({ item, projectId }: AdminItemControlsProps) {
  const [notes, setNotes] = useState(item.internalNotes ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const [linearPushed, setLinearPushed] = useState(!!item.linearIssueId);
  const [linearError, setLinearError] = useState("");
  const [isLinearPending, startLinearTransition] = useTransition();

  function handleSaveNotes() {
    setError("");
    setSaved(false);
    startTransition(async () => {
      const result = await updateItem({
        itemId: item.id,
        internalNotes: notes,
        projectId,
      });
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError(result.error);
      }
    });
  }

  function handlePushToLinear() {
    setLinearError("");
    startLinearTransition(async () => {
      const result = await pushToLinear({ itemId: item.id, projectId });
      if (result.success) {
        setLinearPushed(true);
        // The URL will be available on the next page load via revalidation;
        // for immediate feedback we mark it as pushed.
      } else {
        setLinearError(result.error);
      }
    });
  }

  return (
    <div className="mt-8 rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5 p-4 space-y-4">
      <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
        Admin Controls
      </p>

      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Status:</span>
        <AdminStatusDropdown itemId={item.id} currentStatus={item.status} projectId={projectId} />
      </div>

      {/* Linear Integration */}
      <div className="space-y-2">
        <Label className="text-sm">Linear</Label>
        {linearPushed || item.linearIssueUrl ? (
          <div className="flex items-center gap-2">
            <Icon
              name="check_circle"
              size="4"
              className="text-green-600 dark:text-green-400"
            />
            <span className="text-sm text-green-600 dark:text-green-400">
              Pushed to Linear
            </span>
            {item.linearIssueUrl && (
              <a
                href={item.linearIssueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                View issue
                <Icon name="open_in_new" size="3.5" />
              </a>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handlePushToLinear}
              disabled={isLinearPending}
            >
              {isLinearPending ? "Pushing..." : "Push to Linear"}
            </Button>
            {linearError && (
              <span className="text-xs text-destructive">{linearError}</span>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="internal-notes" className="text-sm">
          Internal notes
        </Label>
        <Textarea
          id="internal-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Private notes (not visible to users)..."
          className="resize-none"
          rows={3}
          maxLength={5000}
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSaveNotes}
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Save notes"}
          </Button>
          {saved && (
            <span className="text-xs text-green-600 dark:text-green-400">
              Saved
            </span>
          )}
          {error && <span className="text-xs text-destructive">{error}</span>}
        </div>
      </div>
    </div>
  );
}
