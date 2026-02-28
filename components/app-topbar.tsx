import Link from "next/link";
import Image from "next/image";
import { currentUser } from "@clerk/nextjs/server";
import { ensureProfile } from "@/lib/db/ensure-profile";
import { getPendingInvitesForUser } from "@/lib/queries";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { UserMenu } from "@/components/user-menu";

export async function AppTopbar() {
  const user = await currentUser();

  return (
    <header className="border-b border-border">
      <div className="max-w-8xl mx-auto h-20 flex items-center border-border">
        {/* Logo area — matches sidebar column width */}
        <div className="max-w-xs w-full border-r border-border h-full flex items-center px-16">
          <Link href="/">
            <Image
              src="/buildstory-logo.svg"
              alt="BuildStory"
              width={140}
              height={28}
            />
          </Link>
        </div>

        {/* Right section */}
        <div className="flex justify-end w-full items-center px-8">
          {user ? (
            <div className="flex items-center gap-3">
              <InviteBell userId={user.id} />
              <UserMenu
                imageUrl={user.imageUrl}
                firstName={user.firstName}
                username={user.username}
                emailFallback={user.primaryEmailAddress?.emailAddress?.split("@")[0] ?? "user"}
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
