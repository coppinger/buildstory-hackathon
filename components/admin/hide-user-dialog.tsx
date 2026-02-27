"use client";

import { useState, useTransition } from "react";
import { AlertDialog } from "radix-ui";
import { Button } from "@/components/ui/button";
import { hideUser } from "@/app/admin/users/actions";

interface HideUserDialogProps {
  profileId: string;
  displayName: string;
  trigger: React.ReactNode;
  onComplete?: () => void;
}

export function HideUserDialog({
  profileId,
  displayName,
  trigger,
  onComplete,
}: HideUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleHide() {
    setError("");
    startTransition(async () => {
      const result = await hideUser({ profileId });
      if (result.success) {
        setOpen(false);
        onComplete?.();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md border border-border bg-background p-6 shadow-lg rounded-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <AlertDialog.Title className="font-heading text-lg">
            Hide user
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
            This will remove <strong>{displayName}</strong> from all public
            pages. They can still sign in and use the app. This can be reversed
            at any time.
          </AlertDialog.Description>

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
              variant="secondary"
              onClick={handleHide}
              disabled={isPending}
            >
              {isPending ? "Hiding..." : "Hide user"}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
