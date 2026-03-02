"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { UserAvatar } from "@/components/ui/user-avatar";
import { InviteUserSearch } from "@/components/projects/invite-user-search";
import {
  generateInviteLink,
  revokeInvite,
  removeTeamMember,
  leaveProject,
} from "@/app/(app)/projects/[slug]/team-actions";

interface MemberProfile {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  experienceLevel: string | null;
}

interface PendingInvite {
  id: string;
  type: "direct" | "link";
  token: string | null;
  recipient: { id: string; displayName: string; username: string | null } | null;
}

interface TeamSectionProps {
  projectId: string;
  isOwner: boolean;
  ownerProfile: MemberProfile;
  members: { profile: MemberProfile }[];
  pendingInvites: PendingInvite[];
  currentUserProfileId: string | null;
}

export function TeamSection({
  projectId,
  isOwner,
  ownerProfile,
  members,
  pendingInvites,
  currentUserProfileId,
}: TeamSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleGenerateLink() {
    setError(null);
    startTransition(async () => {
      const result = await generateInviteLink({ projectId });
      if (result.success && result.data) {
        const url = `${window.location.origin}/invite/${result.data.token}`;
        setGeneratedLink(url);
        router.refresh();
      } else {
        setError(result.success ? "Unexpected error" : result.error);
      }
    });
  }

  function handleCopy() {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleRevoke(inviteId: string) {
    startTransition(async () => {
      await revokeInvite({ inviteId });
      router.refresh();
    });
  }

  function handleRemove(memberId: string) {
    startTransition(async () => {
      await removeTeamMember({ projectId, memberId });
      router.refresh();
    });
  }

  function handleLeave() {
    startTransition(async () => {
      await leaveProject({ projectId });
      router.refresh();
    });
  }

  return (
    <div className="mt-10 border-t border-border pt-6">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
        Team
      </p>

      {/* Owner */}
      <div className="space-y-3">
        <MemberRow profile={ownerProfile} badge="Owner" />

        {/* Members */}
        {members.map((m) => (
          <div key={m.profile.id} className="flex items-center justify-between">
            <MemberRow profile={m.profile} />
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={() => handleRemove(m.profile.id)}
                className="h-7 text-xs text-muted-foreground hover:text-destructive"
              >
                Remove
              </Button>
            )}
            {!isOwner &&
              currentUserProfileId === m.profile.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={handleLeave}
                  className="h-7 text-xs text-muted-foreground hover:text-destructive"
                >
                  Leave
                </Button>
              )}
          </div>
        ))}
      </div>

      {/* Invite section — owner only */}
      {isOwner && (
        <div className="mt-6 space-y-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Invite teammates
          </p>

          <InviteUserSearch projectId={projectId} />

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={handleGenerateLink}
              className="h-8 text-xs"
            >
              <Icon name="link" size="3.5" className="mr-1" />
              Generate invite link
            </Button>
          </div>

          {generatedLink && (
            <div className="flex items-center gap-2 p-3 border border-border bg-muted/50">
              <code className="text-xs font-mono flex-1 truncate">
                {generatedLink}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 text-xs shrink-0"
              >
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          )}

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          {/* Pending invites */}
          {pendingInvites.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Pending invites</p>
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between text-sm py-1"
                >
                  <span className="text-muted-foreground">
                    {invite.type === "direct" && invite.recipient
                      ? `@${invite.recipient.username ?? invite.recipient.displayName}`
                      : "Invite link"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleRevoke(invite.id)}
                    className="h-6 text-xs text-muted-foreground hover:text-destructive"
                  >
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MemberRow({
  profile,
  badge,
}: {
  profile: MemberProfile;
  badge?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <UserAvatar
        avatarUrl={profile.avatarUrl}
        displayName={profile.displayName}
        size="sm"
      />
      <div>
        <div className="flex items-center gap-2">
          <p className="text-foreground font-medium break-words">{profile.displayName}</p>
          {badge && (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
        {profile.username && (
          <Link
            href={`/members/${profile.username}`}
            className="text-sm text-muted-foreground hover:text-buildstory-500 transition-colors font-mono"
          >
            @{profile.username}
          </Link>
        )}
      </div>
    </div>
  );
}
