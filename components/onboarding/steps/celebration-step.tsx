"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Confetti } from "@/components/ui/confetti";
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

export function CelebrationStep({ variant, state }: CelebrationStepProps) {
  const [copied, setCopied] = useState(false);

  const title =
    variant === "with_project"
      ? "You're registered and your project is locked in!"
      : "You're registered for Hackathon 00!";

  const shareText =
    variant === "with_project" && state.projectGoalText
      ? `7 days to ${state.projectGoalText} — I'm building ${state.projectName} at @buildstory's first hackathon. buildstory.com/project/${state.projectSlug}`
      : "I just signed up for @buildstory's first hackathon — 7 days to build something real with AI. buildstory.com/event/hackathon-00";

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
    <div className="w-full max-w-lg mx-auto space-y-8">
      <Confetti />

      {/* Header */}
      <div className="text-center space-y-3">
        {/* <Icon name="rocket_launch" size="8" className="text-amber-500 mx-auto" /> */}
        <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl text-white">
          {title}
        </h1>

        {variant === "joining_team" && (
          <p className="text-base text-neutral-400">
            Your team lead can add you as a collaborator from the project page.
          </p>
        )}

        {/* Pills */}
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {variant === "with_project" && state.projectName && (
            <Badge className="bg-amber-400/10 text-amber-400 border-amber-400/20">
              {state.projectName}
            </Badge>
          )}
          {variant === "with_project" && state.projectGoalText && (
            <Badge variant="outline" className="text-neutral-400">
              {state.projectGoalText}
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

      {/* Countdown card */}
      <div className="border border-neutral-800 p-6 space-y-4">
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
          Hackathon starts in
        </p>
        <DashboardCountdown />
        <p className="text-base text-neutral-400">
          We&apos;re kicking things off with a live 30-minute session to welcome
          everyone, walk through the week, and get you building. Don&apos;t miss
          it.
        </p>
        <Button variant="outline"  asChild>
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
        <p className="text-base font-medium text-white">Join the community</p>
        <p className="text-base text-neutral-400">
          The Discord is where it all happens — find teammates, get unstuck,
          share progress, and hang out with other builders all week.
        </p>
        <Button
          variant="outline"
          
          className="bg-[#5F66EB] text-white border-[#5F66EB]"
          asChild
        >
          <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer">
            Join the Discord →
          </a>
        </Button>
      </div>

      {/* Share card */}
      <div className="border border-neutral-800 p-6 space-y-3">
        <p className="text-base font-medium text-white">Tell the world</p>
        <p className="text-sm text-neutral-500 font-mono bg-neutral-900 px-3 py-2 break-words">
          {shareText}
        </p>
        <div className="flex gap-2">
          <Button variant="outline"  onClick={handleCopy}>
            <Icon name={copied ? "check" : "content_copy"} size="3.5" />
            {copied ? "Copied!" : "Copy link"}
          </Button>
          <Button variant="outline"  onClick={handleShareX}>
            Share on X
          </Button>
        </div>
      </div>

      {/* Footer actions */}
      <div className="space-y-2 pb-8">
        <Button
          asChild
          className="w-full h-12 text-sm font-medium bg-foreground text-background hover:bg-foreground/90"
        >
          <Link href="/dashboard">Go to dashboard →</Link>
        </Button>
        <Button
          variant="outline"
          asChild
          className="w-full h-11"
        >
          <Link href="/profile/edit">Edit your profile →</Link>
        </Button>
      </div>
    </div>
  );
}
