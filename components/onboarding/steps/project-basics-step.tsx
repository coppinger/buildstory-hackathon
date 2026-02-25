"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/ui/icon";
import { checkProjectSlugAvailability } from "@/app/(onboarding)/hackathon/actions";

type SlugStatus = "idle" | "checking" | "available" | "taken";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

interface ProjectBasicsStepProps {
  projectName: string;
  projectSlug: string;
  projectDescription: string;
  onUpdate: (partial: {
    projectName?: string;
    projectSlug?: string;
    projectDescription?: string;
  }) => void;
  onSlugStatusChange: (status: SlugStatus) => void;
}

export function ProjectBasicsStep({
  projectName,
  projectSlug,
  projectDescription,
  onUpdate,
  onSlugStatusChange,
}: ProjectBasicsStepProps) {
  const [customSlug, setCustomSlug] = useState(false);

  // Store the result of the last async slug check
  const [checkResult, setCheckResult] = useState<{
    slug: string;
    status: "available" | "taken";
  } | null>(null);

  // Derive slug status from current value + last check result
  const slugStatus: SlugStatus = useMemo(() => {
    const slug = projectSlug.trim();
    if (!slug || slug.length < 2) return "idle";
    if (checkResult?.slug === slug) return checkResult.status;
    return "checking";
  }, [projectSlug, checkResult]);

  // Report status to parent whenever it changes
  useEffect(() => {
    onSlugStatusChange(slugStatus);
  }, [slugStatus, onSlugStatusChange]);

  useEffect(() => {
    if (!customSlug) {
      onUpdate({ projectSlug: slugify(projectName) });
    }
  }, [projectName, customSlug, onUpdate]);

  // Debounced async slug availability check
  useEffect(() => {
    const slug = projectSlug.trim();
    if (!slug || slug.length < 2) return;

    const timer = setTimeout(async () => {
      const result = await checkProjectSlugAvailability(slug);
      if (result.success && result.data) {
        setCheckResult({
          slug,
          status: result.data.available ? "available" : "taken",
        });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [projectSlug]);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="projectName" className="text-neutral-400 text-sm">
          Project name <span className="text-amber-400">*</span>
        </Label>
        <Input
          id="projectName"
          value={projectName}
          onChange={(e) => onUpdate({ projectName: e.target.value })}
          placeholder="My cool AI thing"
          className="mt-1.5 bg-white/5 border-neutral-700 text-white placeholder:text-neutral-600"
        />
        {projectSlug && (
          <div className="mt-1.5 flex items-center gap-2">
            <p className="text-sm text-neutral-500">
              buildstory.com/project/{projectSlug}
            </p>
            {!customSlug && (
              <button
                type="button"
                onClick={() => setCustomSlug(true)}
                className="text-sm text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                Customize URL
              </button>
            )}
            {slugStatus === "taken" && (
              <span className="text-sm text-red-400">URL taken</span>
            )}
          </div>
        )}
        {customSlug && (
          <div className="mt-2">
            <Label
              htmlFor="projectSlug"
              className="text-neutral-400 text-sm"
            >
              Custom URL
            </Label>
            <div className="relative mt-1">
              <Input
                id="projectSlug"
                value={projectSlug}
                onChange={(e) =>
                  onUpdate({
                    projectSlug: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, ""),
                  })
                }
                className="bg-white/5 border-neutral-700 text-white placeholder:text-neutral-600 pr-9"
              />
              {slugStatus === "checking" && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Icon
                    name="progress_activity"
                    size="3.5"
                    className="animate-spin text-neutral-500"
                  />
                </div>
              )}
              {slugStatus === "available" && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Icon
                    name="check_circle"
                    size="3.5"
                    className="text-green-400"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="projectDesc" className="text-neutral-400 text-sm">
          Description <span className="text-amber-400">*</span>
        </Label>
        <Textarea
          id="projectDesc"
          value={projectDescription}
          onChange={(e) => onUpdate({ projectDescription: e.target.value })}
          placeholder="What does it do? One or two sentences."
          rows={3}
          className="mt-1.5 bg-white/5 border-neutral-700 text-white placeholder:text-neutral-600 resize-none"
        />
      </div>
    </div>
  );
}
