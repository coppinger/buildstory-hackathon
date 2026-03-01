import Link from "next/link";
import Image from "next/image";
import { currentUser } from "@clerk/nextjs/server";
import { ensureProfile } from "@/lib/db/ensure-profile";
import { getPendingInvitesForUser } from "@/lib/queries";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { UserMenu } from "@/components/user-menu";

export async function AppTopbar() {
  const user = await currentUser();

  const displayName = user?.firstName ?? user?.username ?? "Builder";
  const username =
    user?.username ??
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ??
    "user";

  return (
    <header className="border-b border-border">
      <div className="max-w-8xl mx-auto h-18 flex items-center border-border">
        {/* Logo area — matches sidebar column width */}
        <div className="max-w-xs w-full border-r border-border h-full flex items-center px-16">
          <Link href="/">
            <Image
              className="w-[140px]"
              src="/buildstory-logo.svg"
              alt="BuildStory"
              width={120}
              height={24}
            />
          </Link>
        </div>

        {/* Right section */}
        <div className="flex justify-end w-full items-center px-6">
          {user ? (
            <div className="flex items-center gap-1">
              <InviteBell userId={user.id} />
              <UserMenu
                imageUrl={user.imageUrl}
                displayName={displayName}
                username={username}
              />
            </div>
          ) : (
            <Link
              href="/sign-in"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

async function InviteBell({ userId }: { userId: string }) {
  const profile = await ensureProfile(userId);
  if (!profile) return null;

  const invites = await getPendingInvitesForUser(profile.id);

  return <NotificationBell invites={invites} count={invites.length} />;
}
