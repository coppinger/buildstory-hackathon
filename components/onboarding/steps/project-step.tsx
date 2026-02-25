"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { BlurFade } from "@/components/blur-fade";
import { SectionRadioGroup } from "@/components/onboarding/section-radio-group";
import {
  createOnboardingProject,
  checkProjectSlugAvailability,
} from "@/app/(onboarding)/hackathon/actions";
import { cn } from "@/lib/utils";

type SlugStatus = "idle" | "checking" | "available" | "taken";

interface ProjectStepProps {
  eventId: string;
  devMode?: boolean;
  onComplete: () => void;
  onBack: () => void;
  state: {
    projectName: string;
    projectSlug: string;
    projectDescription: string;
    projectStartingPoint: "new" | "existing" | null;
    projectGoalText: string;
    projectRepoUrl: string;
  };
  update: (partial: Partial<ProjectStepProps["state"]>) => void;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

const startingPointOptions = [
  {
    value: "new",
    label: "New project",
    description: "You're starting with a blank canvas.",
  },
  {
    value: "existing",
    label: "Existing project",
    description: "You'll ship a feature or improvement on an existing project.",
  },
];

export function ProjectStep({
  eventId,
  devMode = false,
  onComplete,
  onBack,
  state,
  update,
}: ProjectStepProps) {
  const [revealedSection, setRevealedSection] = useState(0);
  const [customSlug, setCustomSlug] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from name
  useEffect(() => {
    if (!customSlug) {
      update({ projectSlug: slugify(state.projectName) });
    }
  }, [state.projectName, customSlug, update]);

  // Debounced slug availability check
  useEffect(() => {
    const slug = state.projectSlug.trim();
    if (!slug || slug.length < 2) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    const timer = setTimeout(async () => {
      const result = await checkProjectSlugAvailability(slug);
      if (result.success && result.data) {
        setSlugStatus(result.data.available ? "available" : "taken");
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [state.projectSlug]);

  // Reveal starting point after basics are done
  const tryRevealStartingPoint = useCallback(() => {
    if (
      revealedSection < 1 &&
      state.projectName.trim().length > 0 &&
      state.projectDescription.trim().length > 0
    ) {
      setRevealedSection(1);
    }
  }, [revealedSection, state.projectName, state.projectDescription]);

  // Reveal goal after starting point selected
  useEffect(() => {
    if (revealedSection < 2 && state.projectStartingPoint) {
      setRevealedSection(2);
    }
  }, [state.projectStartingPoint, revealedSection]);

  const canSubmit =
    state.projectName.trim() &&
    state.projectDescription.trim() &&
    state.projectStartingPoint &&
    slugStatus !== "taken";

  function handleSubmit() {
    if (devMode) {
      onComplete();
      return;
    }

    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      const result = await createOnboardingProject({
        name: state.projectName,
        slug: state.projectSlug,
        description: state.projectDescription,
        startingPoint: state.projectStartingPoint!,
        goalText: state.projectGoalText,
        repoUrl: state.projectRepoUrl,
        eventId,
      });
      if (result.success) {
        onComplete();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="w-full max-w-lg mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="font-heading text-3xl sm:text-4xl text-white">
          Tell us about your project.
        </h1>
        <p className="text-lg text-neutral-400">
          Don&apos;t overthink it — you can update everything later.
        </p>
      </div>

      {/* Basics section */}
      <div className="space-y-5">
        <div className="flex items-center gap-3 text-neutral-400">
          <div className="flex items-center justify-center size-10 border border-border">
            <Icon name="inventory_2" size="5" />
          </div>
          <div>
            <p className="text-lg font-medium text-white">The basics</p>
            <p className="text-base text-neutral-500">
              Give your project a name and tell people what it does.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="projectName" className="text-neutral-400 text-base">
              Project name <span className="text-amber-400">*</span>
            </Label>
            <Input
              id="projectName"
              value={state.projectName}
              onChange={(e) => update({ projectName: e.target.value })}
              placeholder="My cool AI thing"
              className="mt-1.5 bg-white/5 border-neutral-700 text-white placeholder:text-neutral-600"
            />
            {state.projectSlug && (
              <div className="mt-1.5 flex items-center gap-2">
                <p className="text-base text-neutral-500">
                  buildstory.com/project/{state.projectSlug}
                </p>
                {!customSlug && (
                  <button
                    type="button"
                    onClick={() => setCustomSlug(true)}
                    className="text-base text-amber-400 hover:text-amber-300 cursor-pointer"
                  >
                    Customize URL
                  </button>
                )}
                {slugStatus === "taken" && (
                  <span className="text-base text-red-400">URL taken</span>
                )}
              </div>
            )}
            {customSlug && (
              <div className="mt-2">
                <Label htmlFor="projectSlug" className="text-neutral-400 text-base">
                  Custom URL
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="projectSlug"
                    value={state.projectSlug}
                    onChange={(e) =>
                      update({
                        projectSlug: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, ""),
                      })
                    }
                    className="bg-white/5 border-neutral-700 text-white placeholder:text-neutral-600 pr-9"
                  />
                  {slugStatus === "checking" && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Icon name="progress_activity" size="3.5" className="animate-spin text-neutral-500" />
                    </div>
                  )}
                  {slugStatus === "available" && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Icon name="check_circle" size="3.5" className="text-green-400" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="projectDesc" className="text-neutral-400 text-base">
              Description <span className="text-amber-400">*</span>
            </Label>
            <Textarea
              id="projectDesc"
              value={state.projectDescription}
              onChange={(e) => update({ projectDescription: e.target.value })}
              onBlur={tryRevealStartingPoint}
              placeholder="What does it do? One or two sentences."
              rows={3}
              className="mt-1.5 bg-white/5 border-neutral-700 text-white placeholder:text-neutral-600 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Starting point section */}
      {revealedSection >= 1 && (
        <BlurFade delay={0.1} duration={0.5} yOffset={12}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-neutral-400">
              <div className="flex items-center justify-center size-10 border border-border">
                <Icon name="construction" size="5" />
              </div>
              <div>
                <p className="text-lg font-medium text-white">Starting point</p>
                <p className="text-base text-neutral-500">
                  Are you starting fresh or adding to something you&apos;ve
                  already got?
                </p>
              </div>
            </div>
            <SectionRadioGroup
              options={startingPointOptions}
              value={state.projectStartingPoint}
              onChange={(v) =>
                update({
                  projectStartingPoint: v as "new" | "existing",
                })
              }
            />
          </div>
        </BlurFade>
      )}

      {/* Goal section */}
      {revealedSection >= 2 && (
        <BlurFade delay={0.1} duration={0.5} yOffset={12}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-neutral-400">
              <div className="flex items-center justify-center size-10 border border-border">
                <Icon name="flag" size="5" />
              </div>
              <div>
                <p className="text-lg font-medium text-white">Your goal</p>
                <p className="text-base text-neutral-500">
                  What does &quot;done&quot; look like at the end of the week?
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="goalText" className="text-neutral-400 text-base">
                  Goal for the week{" "}
                  <Badge variant="outline" className="ml-1 text-[10px] py-0">
                    Optional
                  </Badge>
                </Label>
                <Input
                  id="goalText"
                  value={state.projectGoalText}
                  onChange={(e) => update({ projectGoalText: e.target.value })}
                  placeholder="What do you want to ship by the end?"
                  className="mt-1.5 bg-white/5 border-neutral-700 text-white placeholder:text-neutral-600"
                />
              </div>

              <div>
                <Label htmlFor="repoUrl" className="text-neutral-400 text-base">
                  Repo URL{" "}
                  <Badge variant="outline" className="ml-1 text-[10px] py-0">
                    Optional
                  </Badge>
                </Label>
                <Input
                  id="repoUrl"
                  value={state.projectRepoUrl}
                  onChange={(e) => update({ projectRepoUrl: e.target.value })}
                  placeholder="https://github.com/..."
                  className="mt-1.5 bg-white/5 border-neutral-700 text-white placeholder:text-neutral-600 font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </BlurFade>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <Button
          onClick={handleSubmit}
          disabled={!devMode && (isPending || !canSubmit)}
          className={cn(
            "w-full h-12 text-base font-medium",
            "bg-foreground text-background hover:bg-foreground/90"
          )}
        >
          {isPending && (
            <Icon name="progress_activity" className="animate-spin" size="4" />
          )}
          Create project →
        </Button>
        <Button
          variant="outline"
          onClick={onBack}
          className="w-full h-11"
        >
          ← Back
        </Button>
        {error && (
          <p className="text-base text-red-400 font-mono text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
