"use client";

import { useState, useTransition } from "react";
import { AlertDialog } from "radix-ui";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { banUser } from "@/app/admin/users/actions";

interface BanUserDialogProps {
  profileId: string;
  displayName: string;
  trigger: React.ReactNode;
  onComplete?: () => void;
}

export function BanUserDialog({
  profileId,
  displayName,
  trigger,
  onComplete,
}: BanUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleBan() {
    setError("");
    startTransition(async () => {
      const result = await banUser({
        profileId,
        reason: reason || undefined,
      });
      if (result.success) {
        setOpen(false);
        setReason("");
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
            Ban user
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
            This will hide <strong>{displayName}</strong> from all public pages
            and disable their login. Only an admin can reverse this.
          </AlertDialog.Description>

          <div className="mt-4 space-y-2">
            <Label htmlFor="ban-reason" className="text-sm text-muted-foreground">
              Reason (optional)
            </Label>
            <Textarea
              id="ban-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this user being banned?"
              className="resize-none"
              rows={3}
            />
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
              variant="destructive"
              onClick={handleBan}
              disabled={isPending}
            >
              {isPending ? "Banning..." : "Ban user"}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
