"use client";

import { useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

interface UserMenuProps {
  imageUrl: string;
  displayName: string;
  username: string | null;
}

export function UserMenu({ imageUrl, displayName, username }: UserMenuProps) {
  const { signOut } = useClerk();

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Avatar className="size-7">
            <AvatarImage src={imageUrl} alt={displayName} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          {displayName}
          <Icon name="expand_more" size="4" className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium">{displayName}</p>
            <p className="text-xs text-muted-foreground">
              {username ? `@${username}` : "No username set"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            {username ? (
              <Link href={`/members/${username}`}>
                <Icon name="person" size="4" />
                Profile
              </Link>
            ) : (
              <Link href="/settings">
                <Icon name="person" size="4" />
                Set up profile
              </Link>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Icon name="settings" size="4" />
              Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ redirectUrl: "/" })}>
          <Icon name="logout" size="4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
