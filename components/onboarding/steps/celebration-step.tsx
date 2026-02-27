"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { DashboardCountdown } from "@/components/dashboard/dashboard-countdown";
import { DISCORD_INVITE_URL } from "@/lib/constants";

type CelebrationVariant = "no_project" | "joining_team" | "with_project";

const KICKOFF_START = "2026-03-01T12:00:00Z";
const KICKOFF_END = "2026-03-01T12:30:00Z";

function buildCalendarUrl() {
  const title = encodeURIComponent("Buildstory Hackathon 00 Kickoff");
  const details = encodeURIComponent(
    "Hackathon 00 kicks off! 7 days to build something real with AI.\n\nhttps://buildstory.com/event/hackathon-00"
  );
  const start = KICKOFF_START.replace(/[-:]/g, "").replace(".000", "");
  const end = KICKOFF_END.replace(/[-:]/g, "").replace(".000", "");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`;
}

interface CelebrationStepProps {
  variant: CelebrationVariant;
  state: {
    displayName: string;
    username: string;
    experienceLevel: string | null;
    teamPreference: string | null;
    projectName: string;
    projectGoalText: string;
    projectSlug: string;
  };
}

const experienceLabels: Record<string, string> = {
  getting_started: "Just getting started",
  built_a_few: "Built a few things",
  ships_constantly: "Ships constantly",
};

const teamLabels: Record<string, string> = {
  solo: "Solo",
  has_team: "Has a team",
  has_team_open: "Team (open)",
  looking_for_team: "Looking for team",
};

function fireConfetti() {
  const end = Date.now() + 1500;
  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ["#fbbf24", "#f59e0b", "#ffffff"],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ["#fbbf24", "#f59e0b", "#ffffff"],
    });
    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
}

export function CelebrationStep({ variant, state }: CelebrationStepProps) {
  const [copied, setCopied] = useState(false);

  // Enhanced confetti: first burst immediately, second burst at 500ms
  useEffect(() => {
    fireConfetti();
    const timer = setTimeout(fireConfetti, 500);
    return () => clearTimeout(timer);
  }, []);

  const title =
    variant === "with_project"
      ? "You\u2019re registered and your project is locked in!"
      : "You\u2019re registered for Hackathon 00!";

  const shareText =
    variant === "with_project" && state.projectGoalText
      ? `7 days to ${state.projectGoalText} \u2014 I'm building ${state.projectName} at @buildstory's first hackathon. buildstory.com/project/${state.projectSlug}`
      : "I just signed up for @buildstory's first hackathon \u2014 7 days to build something real with AI. buildstory.com/event/hackathon-00";

  function handleCopy() {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleShareX() {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 pb-32">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="font-heading text-4xl sm:text-5xl text-white">
          {title}
        </h1>

        {variant === "joining_team" && (
          <p className="text-base text-neutral-400">
            Your team lead can add you as a collaborator from the project page.
          </p>
        )}

        {/* Pills */}
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {state.username && (
            <Badge variant="outline" className="text-neutral-400 font-mono">
              @{state.username}
            </Badge>
          )}
          {variant === "with_project" && state.projectName && (
            <Badge className="bg-amber-400/10 text-amber-400 border-amber-400/20">
              {state.projectName}
            </Badge>
          )}
          {state.experienceLevel && (
            <Badge variant="outline" className="text-neutral-400">
              {experienceLabels[state.experienceLevel] ?? state.experienceLevel}
            </Badge>
          )}
          {state.teamPreference && (
            <Badge variant="outline" className="text-neutral-400">
              {teamLabels[state.teamPreference] ?? state.teamPreference}
            </Badge>
          )}
        </div>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Pseudo-tweet share card — spans full width */}
        <div className="md:col-span-2 border border-neutral-800 p-6 space-y-4">
          <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
            Share the news
          </p>
          <div className="bg-neutral-900 border border-neutral-800 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center text-xs font-medium text-amber-400">
                {state.displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{state.displayName}</p>
                {state.username && (
                  <p className="text-xs text-neutral-500 font-mono">@{state.username}</p>
                )}
              </div>
            </div>
            <p className="text-sm text-neutral-300 leading-relaxed break-words">
              {shareText}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopy}>
              <Icon name={copied ? "check" : "content_copy"} size="3.5" />
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button variant="outline" onClick={handleShareX}>
              Share on X
            </Button>
          </div>
        </div>

        {/* Countdown card */}
        <div className="border border-neutral-800 p-6 space-y-4">
          <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
            Hackathon starts in
          </p>
          <DashboardCountdown />
          <p className="text-sm text-neutral-400">
            Live 30-min kickoff to welcome everyone and get you building.
          </p>
          <Button variant="outline" asChild>
            <a
              href={buildCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="calendar_today" size="3.5" />
              Add to calendar
            </a>
          </Button>
        </div>

        {/* Discord card */}
        <div className="border border-neutral-800 p-6 space-y-3">
          <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
            Community
          </p>
          <p className="text-base font-medium text-white">Join the Discord</p>
          <p className="text-sm text-neutral-400">
            Find teammates, get unstuck, share progress, and hang out with
            builders all week.
          </p>
          <Button
            variant="outline"
            className="bg-[#5F66EB] text-white border-[#5F66EB]"
            asChild
          >
            <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer">
              Join the Discord
            </a>
          </Button>
        </div>

        {/* Streaming nudge — spans full width */}
        <div className="md:col-span-2 border border-neutral-800 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-base font-medium text-white">Stream your build</p>
              <Badge variant="outline" className="text-[10px] py-0">
                Optional
              </Badge>
            </div>
            <p className="text-sm text-neutral-400">
              Go live on Twitch or X while you build. Add your stream URL in
              settings so others can watch.
            </p>
          </div>
          <Button variant="outline" asChild className="shrink-0">
            <Link href="/settings">
              <Icon name="settings" size="3.5" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-800 bg-neutral-950/95 backdrop-blur-xl">
        <div className="mx-auto max-w-2xl flex items-center gap-3 px-6 py-4">
          <Button
            asChild
            className="flex-1 h-11 text-sm font-medium bg-foreground text-background hover:bg-foreground/90"
          >
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="flex-1 h-11 text-sm"
          >
            <Link href="/settings">Edit profile</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
