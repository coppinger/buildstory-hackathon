"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DiscordIcon } from "@/components/icons";
import { DISCORD_INVITE_URL } from "@/lib/constants";
import { dismissDiscordCard } from "@/app/(app)/dashboard/actions";

export function DiscordCard() {
  const [dismissed, setDismissed] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDismiss() {
    startTransition(async () => {
      const result = await dismissDiscordCard();
      if (result.success) {
        setDismissed(true);
      }
    });
  }

  if (dismissed || isPending) return null;

  return (
    <Card className="w-full relative">
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1"
        aria-label="Dismiss Discord card"
      >
        <svg
          viewBox="0 0 16 16"
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>
      <div className="flex items-start gap-4">
        <DiscordIcon className="w-5 h-5 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">
            Buildstory Discord
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Find teammates, get help, and share your progress.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 bg-[#5F66EB] text-white"
            asChild
          >
            <a
              href={DISCORD_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Join the Discord
            </a>
          </Button>
        </div>
      </div>
    </Card>
  );
}
