"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { acceptInviteLink } from "@/app/(app)/projects/[slug]/team-actions";

interface AcceptInviteCardProps {
  token: string;
}

export function AcceptInviteCard({ token }: AcceptInviteCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAccept() {
    setError(null);
    startTransition(async () => {
      const result = await acceptInviteLink({ token });
      if (result.success && result.data?.projectSlug) {
        router.push(`/projects/${result.data.projectSlug}`);
      } else if (!result.success) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <Button onClick={handleAccept} disabled={isPending} className="w-full h-11">
        {isPending ? "Joining..." : "Join project"}
      </Button>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <Icon name="error" size="4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
