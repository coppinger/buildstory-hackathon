"use client";

import { useState, useTransition } from "react";
import { AlertDialog } from "radix-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteUser } from "@/app/admin/users/actions";

interface DeleteUserDialogProps {
  profileId: string;
  displayName: string;
  username: string | null;
  trigger: React.ReactNode;
  onComplete?: () => void;
}

export function DeleteUserDialog({
  profileId,
  displayName,
  username,
  trigger,
  onComplete,
}: DeleteUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const confirmText = username || displayName;
  const isConfirmed = confirmText.length > 0 && confirmation === confirmText;

  function handleDelete() {
    if (!isConfirmed) return;
    setError("");
    startTransition(async () => {
      const result = await deleteUser({ profileId });
      if (result.success) {
        setOpen(false);
        setConfirmation("");
        onComplete?.();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) {
          setConfirmation("");
          setError("");
        }
      }}
    >
      <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md border border-border bg-background p-6 shadow-lg rounded-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <AlertDialog.Title className="font-heading text-lg">
            Delete user permanently
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
            This will permanently delete{" "}
            <strong className="text-foreground">{displayName}</strong> and all
            their data (projects, registrations, team memberships). The
            user&apos;s Clerk account will also be deleted. This cannot be
            undone.
          </AlertDialog.Description>

          <div className="mt-4 space-y-2">
            <Label htmlFor="delete-confirm" className="text-sm text-muted-foreground">
              Type <strong className="text-foreground">{confirmText}</strong> to
              confirm
            </Label>
            <Input
              id="delete-confirm"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder={confirmText}
              autoComplete="off"
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
              onClick={handleDelete}
              disabled={!isConfirmed || isPending}
            >
              {isPending ? "Deleting..." : "Delete user"}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
