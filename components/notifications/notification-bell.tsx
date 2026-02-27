"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Popover } from "radix-ui";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { respondToInvite } from "@/app/(app)/projects/[slug]/team-actions";

interface Invite {
  id: string;
  project: { id: string; name: string; slug: string | null };
  sender: { displayName: string; username: string | null };
}

interface NotificationBellProps {
  invites: Invite[];
  count: number;
}

export function NotificationBell({ invites, count }: NotificationBellProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRespond(inviteId: string, accept: boolean) {
    startTransition(async () => {
      await respondToInvite({ inviteId, accept });
      router.refresh();
    });
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          className="relative p-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Icon name="notifications" size="5" />
          {count > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
              {count}
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-80 border border-border bg-background shadow-lg animate-in fade-in-0 zoom-in-95"
        >
          <div className="p-4 border-b border-border">
            <p className="text-sm font-medium text-foreground">
              Team invites
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {invites.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  No pending invites
                </p>
              </div>
            ) : (
              invites.map((invite) => (
                <div
                  key={invite.id}
                  className="p-4 border-b border-border last:border-b-0"
                >
                  <p className="text-sm text-foreground">
                    <span className="font-medium">
                      {invite.sender.displayName}
                    </span>{" "}
                    invited you to join{" "}
                    <span className="font-medium">{invite.project.name}</span>
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleRespond(invite.id, true)}
                      className="h-7 text-xs"
                    >
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleRespond(invite.id, false)}
                      className="h-7 text-xs"
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
