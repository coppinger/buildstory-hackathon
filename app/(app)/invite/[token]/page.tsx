import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getInviteByToken } from "@/lib/queries";
import { ensureProfile } from "@/lib/db/ensure-profile";
import { AcceptInviteCard } from "@/components/projects/accept-invite-card";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Auth gate — require sign-in before revealing invite details
  const { userId } = await auth();
  if (!userId) {
    redirect(`/sign-in?redirect_url=/invite/${encodeURIComponent(token)}`);
  }

  const invite = await getInviteByToken(token);

  if (!invite) {
    return (
      <div className="p-8 lg:p-12 w-full max-w-lg mx-auto text-center">
        <h1 className="font-heading text-2xl text-foreground">
          Invalid invite
        </h1>
        <p className="mt-3 text-muted-foreground">
          This invite link is invalid or has expired.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to dashboard
        </Link>
      </div>
    );
  }

  // Check if user is the owner
  const profile = await ensureProfile(userId);
  const isOwner = profile?.id === invite.project.profile.id;

  return (
    <div className="p-8 lg:p-12 w-full max-w-lg mx-auto">
      <h1 className="font-heading text-2xl text-foreground">
        You&apos;ve been invited
      </h1>
      <p className="mt-3 text-muted-foreground">
        <span className="font-medium text-foreground">
          {invite.sender.displayName}
        </span>{" "}
        invited you to join the project:
      </p>

      <div className="mt-6 border border-border p-5">
        <h2 className="font-heading text-lg text-foreground">
          {invite.project.name}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          by{" "}
          {invite.project.profile.username ? (
            <span className="font-mono">@{invite.project.profile.username}</span>
          ) : (
            invite.project.profile.displayName
          )}
        </p>
      </div>

      <div className="mt-6">
        {isOwner ? (
          <p className="text-sm text-muted-foreground">
            You are the owner of this project.
          </p>
        ) : (
          <AcceptInviteCard token={token} />
        )}
      </div>
    </div>
  );
}
