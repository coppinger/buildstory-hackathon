"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { BanUserDialog } from "@/components/admin/ban-user-dialog";
import { HideUserDialog } from "@/components/admin/hide-user-dialog";
import { unhideUser, unbanUser } from "../actions";

interface UserDetailActionsProps {
  profileId: string;
  displayName: string;
  bannedAt: string | null;
  hiddenAt: string | null;
  currentRole: "admin" | "moderator";
}

export function UserDetailActions({
  profileId,
  displayName,
  bannedAt,
  hiddenAt,
  currentRole,
}: UserDetailActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleUnhide() {
    startTransition(async () => {
      await unhideUser({ profileId });
      router.refresh();
    });
  }

  function handleUnban() {
    startTransition(async () => {
      await unbanUser({ profileId });
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      {/* Hide / Unhide */}
      {!bannedAt && !hiddenAt && (
        <HideUserDialog
          profileId={profileId}
          displayName={displayName}
          trigger={
            <Button variant="outline" className="w-full justify-start gap-2">
              <Icon name="visibility_off" size="4" />
              Hide from public
            </Button>
          }
          onComplete={() => router.refresh()}
        />
      )}
      {hiddenAt && !bannedAt && (
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          disabled={isPending}
          onClick={handleUnhide}
        >
          <Icon name="visibility" size="4" />
          {isPending ? "Unhiding..." : "Unhide user"}
        </Button>
      )}

      {/* Ban / Unban */}
      {!bannedAt && (
        <BanUserDialog
          profileId={profileId}
          displayName={displayName}
          trigger={
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            >
              <Icon name="block" size="4" />
              Ban user
            </Button>
          }
          onComplete={() => router.refresh()}
        />
      )}
      {bannedAt && currentRole === "admin" && (
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          disabled={isPending}
          onClick={handleUnban}
        >
          <Icon name="check_circle" size="4" className="text-green-400" />
          {isPending ? "Unbanning..." : "Unban user"}
        </Button>
      )}
    </div>
  );
}
