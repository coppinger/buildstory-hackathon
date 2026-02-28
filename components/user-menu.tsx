"use client";

import Image from "next/image";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { Popover } from "radix-ui";
import { Icon } from "@/components/ui/icon";

interface UserMenuProps {
  imageUrl: string;
  firstName: string | null;
  username: string | null;
  emailFallback: string;
}

export function UserMenu({
  imageUrl,
  firstName,
  username,
  emailFallback,
}: UserMenuProps) {
  const { signOut } = useClerk();

  const displayName = firstName ?? username ?? "Builder";
  const handle = username ?? emailFallback;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
          <Image
            src={imageUrl}
            alt={displayName}
            width={48}
            height={48}
            className="rounded-full"
          />
          <div className="flex flex-col text-left">
            <p className="text-base font-semibold">{displayName}</p>
            <p className="text-sm text-muted-foreground">@{handle}</p>
          </div>
          <Icon
            name="expand_more"
            size="5"
            className="text-muted-foreground ml-1"
          />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-48 border border-border bg-background shadow-lg animate-in fade-in-0 zoom-in-95"
        >
          <div className="py-1">
            <Popover.Close asChild>
              <Link
                href="/settings"
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Icon name="settings" size="4" className="text-muted-foreground" />
                Settings
              </Link>
            </Popover.Close>
            <Popover.Close asChild>
              <button
                onClick={() => signOut({ redirectUrl: "/" })}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors w-full text-left cursor-pointer"
              >
                <Icon name="logout" size="4" className="text-muted-foreground" />
                Log out
              </button>
            </Popover.Close>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
