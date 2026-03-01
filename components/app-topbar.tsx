import Link from "next/link";
import Image from "next/image";
import { currentUser } from "@clerk/nextjs/server";
import { ensureProfile } from "@/lib/db/ensure-profile";
import { getPendingInvitesForUser } from "@/lib/queries";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { UserMenu } from "@/components/user-menu";

export async function AppTopbar() {
  const user = await currentUser();

  let displayName = "Builder";
  let username: string | null = null;
  let profileId: string | null = null;

  if (user) {
    const profile = await ensureProfile(user.id);
    if (profile) {
      displayName = profile.displayName ?? user.firstName ?? "Builder";
      username = profile.username ?? null;
      profileId = profile.id;
    } else {
      displayName = user.firstName ?? "Builder";
    }
  }

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
              {profileId && <InviteBell profileId={profileId} />}
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

async function InviteBell({ profileId }: { profileId: string }) {
  const invites = await getPendingInvitesForUser(profileId);

  return <NotificationBell invites={invites} count={invites.length} />;
}
