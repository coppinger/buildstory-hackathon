"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { checkProjectSlugAvailability } from "@/app/(onboarding)/hackathon/actions";
import {
  createProject,
  updateProject,
} from "@/app/(app)/projects/actions";

type SlugStatus = "idle" | "checking" | "available" | "taken";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

interface ProjectData {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  startingPoint: "new" | "existing" | null;
  goalText: string | null;
  githubUrl: string | null;
  liveUrl: string | null;
}

interface ProjectFormProps {
  mode: "create" | "edit";
  project?: ProjectData;
  onSuccess?: () => void;
}

export function ProjectForm({ mode, project, onSuccess }: ProjectFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(project?.name ?? "");
  const [manualSlug, setManualSlug] = useState<string | null>(
    mode === "edit" && project?.slug ? project.slug : null
  );
  const [customSlug, setCustomSlug] = useState(mode === "edit" && !!project?.slug);
  const [description, setDescription] = useState(project?.description ?? "");
  const [startingPoint, setStartingPoint] = useState<"new" | "existing">(
    project?.startingPoint ?? "new"
  );
  const [goalText, setGoalText] = useState(project?.goalText ?? "");
  const [repoUrl, setRepoUrl] = useState(project?.githubUrl ?? "");
  const [liveUrl, setLiveUrl] = useState(project?.liveUrl ?? "");
  const [error, setError] = useState<string | null>(null);

  // Derive effective slug: use manual slug if custom, otherwise auto-generate from name
  const slug = customSlug && manualSlug !== null ? manualSlug : slugify(name);

  // Slug availability
  const [checkResult, setCheckResult] = useState<{
    slug: string;
    status: "available" | "taken";
  } | null>(null);

  const slugStatus: SlugStatus = useMemo(() => {
    const s = slug.trim();
    if (!s || s.length < 2) return "idle";
    // In edit mode, if slug hasn't changed, it's available
    if (mode === "edit" && project?.slug === s) return "available";
    if (checkResult?.slug === s) return checkResult.status;
    return "checking";
  }, [slug, checkResult, mode, project?.slug]);

  // Debounced slug check
  useEffect(() => {
    const s = slug.trim();
    if (!s || s.length < 2) return;
    // Skip check if slug is the same as the existing project slug
    if (mode === "edit" && project?.slug === s) return;

    const timer = setTimeout(async () => {
      const result = await checkProjectSlugAvailability(s);
      if (result.success && result.data) {
        setCheckResult({
          slug: s,
          status: result.data.available ? "available" : "taken",
        });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [slug, mode, project?.slug]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Project name is required");
      return;
    }
    if (!description.trim()) {
      setError("Description is required");
      return;
    }
    if (slugStatus === "taken") {
      setError("Project URL is already taken");
      return;
    }

    startTransition(async () => {
      if (mode === "create") {
        const result = await createProject({
          name,
          slug,
          description,
          startingPoint,
          goalText,
          repoUrl,
          liveUrl,
        });

        if (result.success) {
          if (onSuccess) {
            onSuccess();
          } else if (result.data?.slug) {
            router.push(`/projects/${result.data.slug}`);
          } else {
            router.push("/projects");
          }
        } else {
          setError(result.error);
        }
      } else if (mode === "edit" && project) {
        const result = await updateProject({
          projectId: project.id,
          name,
          slug,
          description,
          startingPoint,
          goalText,
          repoUrl,
          liveUrl,
        });

        if (result.success) {
          if (onSuccess) {
            onSuccess();
          } else if (result.data?.slug) {
            router.push(`/projects/${result.data.slug}`);
          } else {
            router.push("/projects");
          }
        } else {
          setError(result.error);
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <Label htmlFor="projectName" className="text-muted-foreground text-sm">
          Project name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="projectName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My cool AI thing"
          className="mt-1.5"
        />
        {slug && (
          <div className="mt-1.5 flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              buildstory.com/projects/{slug}
            </p>
            {!customSlug && (
              <button
                type="button"
                onClick={() => {
                  setCustomSlug(true);
                  setManualSlug(slug);
                }}
                className="text-sm text-primary hover:text-primary/80 cursor-pointer"
              >
                Customize URL
              </button>
            )}
            {slugStatus === "taken" && (
              <span className="text-sm text-destructive">URL taken</span>
            )}
            {slugStatus === "available" && slug.length >= 2 && (
              <span className="text-sm text-green-600">
                <Icon name="check_circle" size="3.5" className="text-green-600" />
              </span>
            )}
          </div>
        )}
        {customSlug && (
          <div className="mt-2">
            <Label
              htmlFor="projectSlug"
              className="text-muted-foreground text-sm"
            >
              Custom URL
            </Label>
            <div className="relative mt-1">
              <Input
                id="projectSlug"
                value={slug}
                onChange={(e) =>
                  setManualSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "")
                  )
                }
                className="pr-9"
              />
              {slugStatus === "checking" && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Icon
                    name="progress_activity"
                    size="3.5"
                    className="animate-spin text-muted-foreground"
                  />
                </div>
              )}
              {slugStatus === "available" && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Icon
                    name="check_circle"
                    size="3.5"
                    className="text-green-600"
                  />
                </div>
              )}
              {slugStatus === "taken" && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Icon
                    name="cancel"
                    size="3.5"
                    className="text-destructive"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="projectDesc" className="text-muted-foreground text-sm">
          Description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="projectDesc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does it do? One or two sentences."
          rows={3}
          className="mt-1.5 resize-none"
        />
      </div>

      {/* Starting point */}
      <div>
        <Label className="text-muted-foreground text-sm">Starting point</Label>
        <div className="mt-2 flex gap-3">
          <button
            type="button"
            onClick={() => setStartingPoint("new")}
            className={`flex-1 border px-4 py-3 text-sm text-left cursor-pointer transition-colors ${
              startingPoint === "new"
                ? "border-primary bg-primary/5 text-foreground"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            <span className="font-medium">New project</span>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Starting from scratch
            </p>
          </button>
          <button
            type="button"
            onClick={() => setStartingPoint("existing")}
            className={`flex-1 border px-4 py-3 text-sm text-left cursor-pointer transition-colors ${
              startingPoint === "existing"
                ? "border-primary bg-primary/5 text-foreground"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            <span className="font-medium">Existing project</span>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Building on something
            </p>
          </button>
        </div>
      </div>

      {/* Goal */}
      <div>
        <Label htmlFor="goalText" className="text-muted-foreground text-sm">
          Goal
        </Label>
        <Textarea
          id="goalText"
          value={goalText}
          onChange={(e) => setGoalText(e.target.value)}
          placeholder="What do you want to accomplish?"
          rows={2}
          className="mt-1.5 resize-none"
        />
      </div>

      {/* GitHub URL */}
      <div>
        <Label htmlFor="repoUrl" className="text-muted-foreground text-sm">
          GitHub URL
        </Label>
        <Input
          id="repoUrl"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/you/project"
          className="mt-1.5"
        />
      </div>

      {/* Live URL */}
      <div>
        <Label htmlFor="liveUrl" className="text-muted-foreground text-sm">
          Live URL
        </Label>
        <Input
          id="liveUrl"
          value={liveUrl}
          onChange={(e) => setLiveUrl(e.target.value)}
          placeholder="https://your-project.vercel.app"
          className="mt-1.5"
        />
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isPending || slugStatus === "taken"}>
          {isPending
            ? mode === "create"
              ? "Creating..."
              : "Saving..."
            : mode === "create"
              ? "Create project"
              : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
