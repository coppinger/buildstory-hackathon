"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionRadioGroup } from "@/components/onboarding/section-radio-group";
import { registerForHackathon } from "@/app/(app)/hackathons/[slug]/actions";

const commitmentOptions = [
  { value: "all_in", label: "All-in", description: "I'm going full-time this week" },
  { value: "daily", label: "Daily", description: "A few hours each day" },
  { value: "nights_weekends", label: "Nights & weekends", description: "Building around my schedule" },
  { value: "not_sure", label: "Not sure yet", description: "I'll figure it out" },
];

const teamOptions = [
  { value: "solo", label: "Solo", description: "Building on my own" },
  { value: "has_team", label: "Have a team", description: "My team is set" },
  { value: "has_team_open", label: "Team (open)", description: "Have a team, open to more" },
  { value: "looking_for_team", label: "Looking for a team", description: "Want to find teammates" },
];

interface HackathonRegisterProps {
  eventId: string;
  isLoggedIn: boolean;
  hasProfile: boolean;
  isRegistered: boolean;
}

export function HackathonRegister({
  eventId,
  isLoggedIn,
  hasProfile,
  isRegistered,
}: HackathonRegisterProps) {
  const [commitmentLevel, setCommitmentLevel] = useState("not_sure");
  const [teamPreference, setTeamPreference] = useState("solo");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(isRegistered);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <Card className="w-full border-green-500/30 bg-green-500/5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">
              You&apos;re registered!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Head to the dashboard to get started.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </Card>
    );
  }

  if (!isLoggedIn) {
    return (
      <Card className="w-full border-buildstory-500/30 bg-buildstory-900/20">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Join this hackathon</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Sign up to participate.
            </p>
          </div>
          <Button
            asChild
            className="w-fit bg-buildstory-500 text-background"
            size="lg"
          >
            <Link href="/sign-up">Sign up</Link>
          </Button>
        </div>
      </Card>
    );
  }

  if (!hasProfile) {
    return (
      <Card className="w-full border-buildstory-500/30 bg-buildstory-900/20">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Join this hackathon</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Complete your profile to register.
            </p>
          </div>
          <Button
            asChild
            className="w-fit bg-buildstory-500 text-background"
            size="lg"
          >
            <Link href="/hackathon">Complete registration</Link>
          </Button>
        </div>
      </Card>
    );
  }

  async function handleRegister() {
    setIsSubmitting(true);
    setError(null);

    const result = await registerForHackathon(
      eventId,
      commitmentLevel as "all_in" | "daily" | "nights_weekends" | "not_sure",
      teamPreference as "solo" | "has_team" | "has_team_open" | "looking_for_team"
    );

    setIsSubmitting(false);

    if (result.success) {
      setDone(true);
    } else {
      setError(result.error ?? "Something went wrong");
    }
  }

  return (
    <Card className="w-full border-buildstory-500/30 bg-buildstory-900/20">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Register for this hackathon
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Quick registration — you&apos;re already signed in.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium text-foreground mb-2">
              Commitment level
            </p>
            <SectionRadioGroup
              options={commitmentOptions}
              value={commitmentLevel}
              onChange={setCommitmentLevel}
            />
          </div>

          <div>
            <p className="text-sm font-medium text-foreground mb-2">
              Team preference
            </p>
            <SectionRadioGroup
              options={teamOptions}
              value={teamPreference}
              onChange={setTeamPreference}
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button
          onClick={handleRegister}
          disabled={isSubmitting}
          className="w-fit bg-buildstory-500 text-background"
          size="lg"
        >
          {isSubmitting ? "Registering..." : "Register"}
        </Button>
      </div>
    </Card>
  );
}
