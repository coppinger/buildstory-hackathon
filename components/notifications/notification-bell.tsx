"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Popover } from "radix-ui";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { respondToInvite } from "@/app/(app)/projects/[slug]/team-actions";
import {
  markAsRead,
  markAllAsRead,
} from "@/app/(app)/notifications/actions";
import { timeAgo } from "@/lib/time";
import type { NotificationWithActor } from "@/lib/notifications/queries";

interface Invite {
  id: string;
  project: { id: string; name: string; slug: string | null };
  sender: { displayName: string; username: string | null };
}

interface NotificationBellProps {
  invites: Invite[];
  notifications: NotificationWithActor[];
  unreadCount: number;
}

export function NotificationBell({
  invites,
  notifications,
  unreadCount,
}: NotificationBellProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRespondInvite(inviteId: string, accept: boolean) {
    startTransition(async () => {
      await respondToInvite({ inviteId, accept });
      router.refresh();
    });
  }

  function handleMarkAsRead(notificationId: string) {
    startTransition(async () => {
      await markAsRead(notificationId);
      router.refresh();
    });
  }

  function handleMarkAllAsRead() {
    startTransition(async () => {
      await markAllAsRead();
      router.refresh();
    });
  }

  const totalCount = invites.length + unreadCount;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          className="relative p-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Icon name="notifications" size="5" />
          {totalCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
              {totalCount}
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
          <div className="p-4 border-b border-border flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              Notifications
            </p>
            {totalCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={isPending}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {invites.length === 0 && notifications.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  No notifications
                </p>
              </div>
            ) : (
              <>
                {/* Team invites — keep accept/decline buttons */}
                {invites.map((invite) => (
                  <div
                    key={`invite-${invite.id}`}
                    className="p-4 border-b border-border last:border-b-0 bg-muted/30"
                  >
                    <p className="text-sm text-foreground">
                      <span className="font-medium">
                        {invite.sender.displayName}
                      </span>{" "}
                      invited you to join{" "}
                      <span className="font-medium">
                        {invite.project.name}
                      </span>
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleRespondInvite(invite.id, true)}
                        className="h-7 text-xs"
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleRespondInvite(invite.id, false)}
                        className="h-7 text-xs"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}

                {/* General notifications */}
                {notifications.map((notif) => (
                  <div
                    key={`notif-${notif.id}`}
                    className="border-b border-border last:border-b-0"
                  >
                    {notif.href ? (
                      <Link
                        href={notif.href}
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors"
                      >
                        <NotificationContent notif={notif} />
                      </Link>
                    ) : (
                      <div
                        className="flex items-start gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleMarkAsRead(notif.id)}
                      >
                        <NotificationContent notif={notif} />
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function NotificationContent({
  notif,
}: {
  notif: NotificationWithActor;
}) {
  const iconName = getNotificationIcon(notif.type);

  return (
    <>
      {notif.actor ? (
        <UserAvatar
          avatarUrl={notif.actor.avatarUrl}
          displayName={notif.actor.displayName}
          size="xs"
        />
      ) : (
        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
          <Icon name={iconName} size="3.5" className="text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{notif.title}</p>
        {notif.body && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {notif.body}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {timeAgo(notif.createdAt)}
        </p>
      </div>
      {!notif.isRead && (
        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
      )}
    </>
  );
}

function getNotificationIcon(
  type: NotificationWithActor["type"]
): string {
  switch (type) {
    case "team_invite":
      return "group_add";
    case "mention":
      return "alternate_email";
    case "item_shipped":
      return "check_circle";
    case "comment_reply":
      return "chat_bubble";
    default:
      return "notifications";
  }
}
