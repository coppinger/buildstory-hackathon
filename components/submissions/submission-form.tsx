"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ToolSelector } from "@/components/submissions/tool-selector";
import { DemoUpload } from "@/components/submissions/demo-upload";
import { LocationInline } from "@/components/submissions/location-inline";
import type { AiTool, EventSubmission, Profile, Project } from "@/lib/db/schema";
import {
  submitProject,
  addCustomTool,
} from "@/app/(app)/projects/[slug]/submit/actions";

interface SubmissionFormProps {
  project: Project;
  eventId: string;
  tools: AiTool[];
  profile: Profile;
  existingSubmission?: {
    submission: EventSubmission;
    toolIds: string[];
  } | null;
}

export function SubmissionForm({
  project,
  eventId,
  tools,
  profile,
  existingSubmission,
}: SubmissionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [whatBuilt, setWhatBuilt] = useState(
    existingSubmission?.submission.whatBuilt ?? ""
  );
  const [demoUrl, setDemoUrl] = useState(
    existingSubmission?.submission.demoUrl ?? ""
  );
  const [demoMediaUrl, setDemoMediaUrl] = useState<string | null>(
    existingSubmission?.submission.demoMediaUrl ?? null
  );
  const [demoMediaType, setDemoMediaType] = useState<"image" | "video" | null>(
    (existingSubmission?.submission.demoMediaType as "image" | "video") ?? null
  );
  const [repoUrl, setRepoUrl] = useState(
    existingSubmission?.submission.repoUrl ?? ""
  );
  const [lessonLearned, setLessonLearned] = useState(
    existingSubmission?.submission.lessonLearned ?? ""
  );
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>(
    existingSubmission?.toolIds ?? []
  );
  const [allTools, setAllTools] = useState<AiTool[]>(tools);
  const [country, setCountry] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showLocation = !profile.country;
  const isValid = whatBuilt.trim().length > 0;
  const isEdit = !!existingSubmission;

  const handleToggleTool = (toolId: string) => {
    setSelectedToolIds((prev) =>
      prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : [...prev, toolId]
    );
  };

  const handleAddCustomTool = async (
    name: string
  ): Promise<{ id: string; name: string } | null> => {
    const result = await addCustomTool(name);
    if (result.success && result.data) {
      const tool = result.data;
      setAllTools((prev) => {
        if (prev.some((t) => t.id === tool.id)) return prev;
        return [...prev, tool];
      });
      return { id: tool.id, name: tool.name };
    }
    return null;
  };

  const handleSubmit = () => {
    if (!isValid) return;
    setError(null);

    startTransition(async () => {
      const result = await submitProject({
        projectId: project.id,
        eventId,
        whatBuilt: whatBuilt.trim(),
        demoUrl: demoUrl.trim() || null,
        demoMediaUrl,
        demoMediaType,
        repoUrl: repoUrl.trim() || null,
        lessonLearned: lessonLearned.trim() || null,
        toolIds: selectedToolIds,
        country: showLocation ? country : undefined,
        region: showLocation ? region : undefined,
      });

      if (result.success) {
        router.push(`/projects/${project.slug}/submit/success`);
      } else {
        setError(result.error ?? "Something went wrong");
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-mono mb-4">
          Submit your project
        </p>
        <h1 className="font-heading text-3xl md:text-4xl text-foreground italic">
          Show what you shipped.
        </h1>
        <p className="mt-3 text-sm font-mono text-muted-foreground leading-relaxed">
          One field is required — everything else helps tell the story of what
          you built.
        </p>
      </div>

      {/* Project context bar */}
      <div className="bg-card border border-border p-4 mb-10 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 font-mono mb-1">
            Submitting for
          </p>
          <p className="text-sm font-semibold text-foreground">{project.name}</p>
        </div>
        <span className="text-[10px] font-mono text-buildstory-500 uppercase tracking-[0.1em]">
          Hackathon 00
        </span>
      </div>

      {/* Fields */}
      <div className="space-y-8">
        {/* What I built — required */}
        <div>
          <FormLabel required sub="Tweet-length pitch \u2014 what does it do?">
            What I built
          </FormLabel>
          <div className="relative">
            <Textarea
              placeholder="Describe what you built in a sentence or two..."
              value={whatBuilt}
              onChange={(e) => setWhatBuilt(e.target.value)}
              maxLength={280}
              rows={3}
              className="font-mono text-sm resize-y"
            />
            <CharCount current={whatBuilt.length} max={280} />
          </div>
        </div>

        {/* Demo link */}
        <div>
          <FormLabel sub="Where can people try it or see it?">
            Demo link
          </FormLabel>
          <Input
            type="url"
            placeholder="https://my-app.vercel.app"
            value={demoUrl}
            onChange={(e) => setDemoUrl(e.target.value)}
            className="font-mono text-sm"
          />
        </div>

        {/* Demo video / screenshot */}
        <div>
          <FormLabel sub="Screenshot, demo recording, or walkthrough">
            Demo video / screenshot
          </FormLabel>
          <DemoUpload
            onUploadComplete={(url, type) => {
              setDemoMediaUrl(url);
              setDemoMediaType(type);
            }}
            onRemove={() => {
              setDemoMediaUrl(null);
              setDemoMediaType(null);
            }}
            initialUrl={demoMediaUrl}
            initialMediaType={demoMediaType}
          />
        </div>

        {/* Repo link */}
        <div>
          <FormLabel sub="Share your code if it's public">Repo link</FormLabel>
          <Input
            type="url"
            placeholder="https://github.com/you/project"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className="font-mono text-sm"
          />
        </div>

        <hr className="border-border" />

        {/* AI tools used */}
        <div>
          <FormLabel sub="What AI tools helped you build this?">
            AI tools used
          </FormLabel>
          <ToolSelector
            tools={allTools}
            selectedIds={selectedToolIds}
            onToggle={handleToggleTool}
            onAddCustom={handleAddCustomTool}
          />
        </div>

        <hr className="border-border" />

        {/* Something I learned */}
        <div>
          <FormLabel sub="Share a takeaway from your hackathon experience">
            Something I learned
          </FormLabel>
          <div className="relative">
            <Textarea
              placeholder="What's one thing you learned or discovered this week?"
              value={lessonLearned}
              onChange={(e) => setLessonLearned(e.target.value)}
              maxLength={280}
              rows={3}
              className="font-mono text-sm resize-y"
            />
            <CharCount current={lessonLearned.length} max={280} />
          </div>
        </div>

        {/* Location prompt */}
        {showLocation && (
          <LocationInline
            country={country}
            region={region}
            onCountryChange={setCountry}
            onRegionChange={setRegion}
          />
        )}

        {/* Error */}
        {error && (
          <p className="text-sm font-mono text-destructive">{error}</p>
        )}

        {/* Submit */}
        <div className="pt-4">
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isPending}
            className="w-full py-6 text-sm font-mono font-semibold uppercase tracking-[0.15em] bg-foreground text-background hover:bg-buildstory-500 transition-all disabled:bg-muted disabled:text-muted-foreground"
          >
            {isPending
              ? "Submitting..."
              : isEdit
                ? "Update submission \u2192"
                : "Submit project \u2192"}
          </Button>
          {!isValid && (
            <p className="text-[10px] font-mono text-muted-foreground/50 text-center mt-3">
              Fill in &quot;What I built&quot; to submit
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function FormLabel({
  children,
  required,
  sub,
}: {
  children: React.ReactNode;
  required?: boolean;
  sub?: string;
}) {
  return (
    <div className="mb-2">
      <label className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-mono flex items-center gap-2">
        {children}
        {required && (
          <span className="text-buildstory-500 text-[9px]">REQUIRED</span>
        )}
      </label>
      {sub && (
        <p className="text-xs font-mono text-muted-foreground/50 mt-1">
          {sub}
        </p>
      )}
    </div>
  );
}

function CharCount({ current, max }: { current: number; max: number }) {
  return (
    <span
      className={`absolute right-3 bottom-3 text-[10px] font-mono ${
        current > max * 0.9
          ? "text-buildstory-500"
          : "text-muted-foreground/30"
      }`}
    >
      {current}/{max}
    </span>
  );
}
