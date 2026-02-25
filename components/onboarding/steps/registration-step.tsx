"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { BlurFade } from "@/components/blur-fade";
import { LivePreviewBadge } from "@/components/onboarding/live-preview-badge";
import { SectionRadioGroup } from "@/components/onboarding/section-radio-group";
import {
  checkUsernameAvailability,
  completeRegistration,
} from "@/app/(onboarding)/hackathon/actions";
import { cn } from "@/lib/utils";

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

interface RegistrationStepProps {
  eventId: string;
  initialDisplayName: string;
  devMode?: boolean;
  onComplete: () => void;
  state: {
    displayName: string;
    username: string;
    experienceLevel: "getting_started" | "built_a_few" | "ships_constantly" | null;
    teamPreference: "solo" | "has_team" | "has_team_open" | "looking_for_team" | null;
  };
  update: (partial: Partial<RegistrationStepProps["state"]>) => void;
}

const USERNAME_REGEX = /^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$/;

const experienceOptions = [
  { value: "getting_started", label: "Just getting started" },
  { value: "built_a_few", label: "Built a few things" },
  { value: "ships_constantly", label: "Ship with AI constantly" },
];

const teamOptions = [
  { value: "solo", label: "Solo" },
  { value: "has_team", label: "I have a team" },
  {
    value: "has_team_open",
    label: "I have a team, open to more people",
    description: "You'll be listed in the participant directory.",
  },
  {
    value: "looking_for_team",
    label: "Looking for teammates",
    description: "You'll be listed in the participant directory.",
  },
];

export function RegistrationStep({
  eventId,
  initialDisplayName,
  devMode = false,
  onComplete,
  state,
  update,
}: RegistrationStepProps) {
  const [revealedSection, setRevealedSection] = useState(0);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Initialize display name from profile if empty
  useEffect(() => {
    if (!state.displayName && initialDisplayName && initialDisplayName !== "User") {
      update({ displayName: initialDisplayName });
    }
  }, [initialDisplayName, state.displayName, update]);

  // Debounced username availability check
  useEffect(() => {
    const username = state.username.trim().toLowerCase();
    if (!username) {
      setUsernameStatus("idle");
      return;
    }
    if (!USERNAME_REGEX.test(username)) {
      setUsernameStatus("invalid");
      return;
    }

    setUsernameStatus("checking");
    const timer = setTimeout(async () => {
      const result = await checkUsernameAvailability(username);
      if (result.success && result.data) {
        setUsernameStatus(result.data.available ? "available" : "taken");
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [state.username]);

  // Reveal experience section when identity is complete
  const tryRevealExperience = useCallback(() => {
    if (
      revealedSection < 1 &&
      state.displayName.trim().length > 0 &&
      usernameStatus === "available"
    ) {
      setRevealedSection(1);
    }
  }, [revealedSection, state.displayName, usernameStatus]);

  // Auto-reveal experience section when username becomes available
  useEffect(() => {
    if (
      revealedSection < 1 &&
      state.displayName.trim().length > 0 &&
      usernameStatus === "available"
    ) {
      setRevealedSection(1);
    }
  }, [usernameStatus, state.displayName, revealedSection]);

  // Reveal team pref when experience is selected
  useEffect(() => {
    if (revealedSection < 2 && state.experienceLevel) {
      setRevealedSection(2);
    }
  }, [state.experienceLevel, revealedSection]);

  // Reveal CTA when team pref is selected
  useEffect(() => {
    if (revealedSection < 3 && state.teamPreference) {
      setRevealedSection(3);
    }
  }, [state.teamPreference, revealedSection]);

  function handleSubmit() {
    if (devMode) {
      onComplete();
      return;
    }

    if (
      !state.displayName.trim() ||
      usernameStatus !== "available" ||
      !state.experienceLevel ||
      !state.teamPreference
    )
      return;

    setError(null);
    startTransition(async () => {
      const result = await completeRegistration({
        displayName: state.displayName.trim(),
        username: state.username.trim().toLowerCase(),
        experienceLevel: state.experienceLevel!,
        teamPreference: state.teamPreference!,
        eventId,
      });
      if (result.success) {
        onComplete();
      } else {
        setError(result.error);
      }
    });
  }

  const usernameIcon =
    usernameStatus === "checking" ? (
      <Icon name="progress_activity" size="3.5" className="animate-spin text-neutral-500" />
    ) : usernameStatus === "available" ? (
      <Icon name="check_circle" size="3.5" className="text-green-400" />
    ) : usernameStatus === "taken" ? (
      <Icon name="cancel" size="3.5" className="text-red-400" />
    ) : usernameStatus === "invalid" ? (
      <Icon name="error" size="3.5" className="text-amber-400" />
    ) : null;

  return (
    <div className="w-full max-w-lg mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <p className="text-base uppercase tracking-[0.2em] text-amber-400">
          Hackathon 00
        </p>
        <h1 className="font-heading text-3xl sm:text-4xl text-white">
          Let&apos;s get you set up.
        </h1>
        <p className="text-lg text-neutral-400">A few things before you join.</p>
      </div>

      {/* Identity section */}
      <div className="space-y-5">
        <div className="flex items-center gap-3 text-neutral-400">
          <div className="flex items-center justify-center size-10 border border-border">
            <Icon name="person" size="5" />
          </div>
          <div>
            <p className="text-lg font-medium text-white">Your identity</p>
            <p className="text-base text-neutral-500">
              How you&apos;ll appear to other participants.
            </p>
          </div>
        </div>

        <LivePreviewBadge
          displayName={state.displayName}
          username={state.username}
        />

        <div className="space-y-4">
          <div>
            <Label htmlFor="displayName" className="text-neutral-400 text-base">
              Display name{" "}
              <span className="text-amber-400">*</span>
            </Label>
            <Input
              id="displayName"
              value={state.displayName}
              onChange={(e) => update({ displayName: e.target.value })}
              onBlur={tryRevealExperience}
              placeholder="What should we call you?"
              className="mt-1.5 bg-white/5 border-neutral-700 text-white placeholder:text-neutral-600"
            />
          </div>

          <div>
            <Label htmlFor="username" className="text-neutral-400 text-base">
              Username{" "}
              <span className="text-amber-400">*</span>
            </Label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-lg">
                @
              </span>
              <Input
                id="username"
                value={state.username}
                onChange={(e) =>
                  update({
                    username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
                  })
                }
                onBlur={tryRevealExperience}
                placeholder="username"
                className="bg-white/5 border-neutral-700 text-white placeholder:text-neutral-600 pl-8 pr-9"
              />
              {usernameIcon && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameIcon}
                </div>
              )}
            </div>
            {usernameStatus === "invalid" && state.username.length > 0 && (
              <p className="mt-1 text-base text-amber-400">
                3–30 characters: letters, numbers, hyphens, underscores
              </p>
            )}
            {usernameStatus === "taken" && (
              <p className="mt-1 text-base text-red-400">
                This username is taken
              </p>
            )}
            {usernameStatus === "available" && (
              <p className="mt-1 text-base text-neutral-500">
                buildstory.com/@{state.username}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Experience section */}
      {revealedSection >= 1 && (
        <BlurFade delay={0.1} duration={0.5} yOffset={12}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-neutral-400">
              <div className="flex items-center justify-center size-10 border border-border">
                <Icon name="bolt" size="5" />
              </div>
              <div>
                <p className="text-lg font-medium text-white">
                  Experience building with AI
                </p>
                <p className="text-base text-neutral-500">
                  This helps us tailor resources and match you with the right
                  people.
                </p>
              </div>
            </div>
            <SectionRadioGroup
              options={experienceOptions}
              value={state.experienceLevel}
              onChange={(v) =>
                update({
                  experienceLevel: v as RegistrationStepProps["state"]["experienceLevel"],
                })
              }
            />
          </div>
        </BlurFade>
      )}

      {/* Team preference section */}
      {revealedSection >= 2 && (
        <BlurFade delay={0.1} duration={0.5} yOffset={12}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-neutral-400">
              <div className="flex items-center justify-center size-10 border border-border">
                <Icon name="group" size="5" />
              </div>
              <div>
                <p className="text-lg font-medium text-white">
                  How do you want to build?
                </p>
                <p className="text-base text-neutral-500">
                  Go solo or team up. You can always change this later.
                </p>
              </div>
            </div>
            <SectionRadioGroup
              options={teamOptions}
              value={state.teamPreference}
              onChange={(v) =>
                update({
                  teamPreference: v as RegistrationStepProps["state"]["teamPreference"],
                })
              }
            />
          </div>
        </BlurFade>
      )}

      {/* Context + CTA */}
      {revealedSection >= 3 && (
        <BlurFade delay={0.1} duration={0.5} yOffset={12}>
          <div className="space-y-4">
            <div className="border border-neutral-800 bg-neutral-900/50 px-4 py-3">
              <p className="text-lg text-neutral-400">
                You&apos;ll get a dashboard to track your progress. The event
                kicks off March 1.
              </p>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={
                !devMode &&
                (isPending ||
                !state.displayName.trim() ||
                usernameStatus !== "available" ||
                !state.experienceLevel ||
                !state.teamPreference)
              }
              className={cn(
                "w-full h-12 text-base font-medium",
                "bg-foreground text-background hover:bg-foreground/90"
              )}
            >
              {isPending && (
                <Icon
                  name="progress_activity"
                  className="animate-spin"
                  size="4"
                />
              )}
              Join the hackathon →
            </Button>
            {error && (
              <p className="text-base text-red-400 font-mono text-center">
                {error}
              </p>
            )}
          </div>
        </BlurFade>
      )}
    </div>
  );
}
