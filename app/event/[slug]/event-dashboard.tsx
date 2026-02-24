"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, ExternalLink, Github, X, Check } from "lucide-react";
import {
  registerForEvent,
  createProject,
  enterProjectInEvent,
  removeProjectFromEvent,
} from "./actions";
import type { Event, EventRegistration, Project, EventProject } from "@/lib/db/schema";

function ErrorMessage({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="mt-3 text-sm text-red-400 font-mono">{message}</p>
  );
}

const teamOptions = [
  { value: "solo" as const, label: "Solo", desc: "Building on my own" },
  { value: "has_team" as const, label: "Have a team", desc: "Team is set" },
  {
    value: "has_team_open" as const,
    label: "Team (open)",
    desc: "Have a team, open to more",
  },
  {
    value: "looking_for_team" as const,
    label: "Looking for team",
    desc: "Want to find collaborators",
  },
];

// --- Registration card ---

function RegisterCard({ event }: { event: Event }) {
  const [selected, setSelected] = useState<
    "solo" | "has_team" | "has_team_open" | "looking_for_team" | null
  >(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRegister() {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const result = await registerForEvent(event.id, selected);
      if (!result.success) setError(result.error);
    });
  }

  return (
    <div className="border border-border p-6 md:p-8">
      <h3 className="font-heading text-2xl text-[#e8e4de]">
        Join this hackathon
      </h3>
      <p className="mt-2 text-neutral-500">
        Pick how you&apos;re planning to participate.
      </p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {teamOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSelected(opt.value)}
            className={`border p-4 text-left transition-colors cursor-pointer ${
              selected === opt.value
                ? "border-buildstory-500 bg-buildstory-500/5"
                : "border-border hover:border-white/20"
            }`}
          >
            <p className="text-[#e8e4de] font-medium">{opt.label}</p>
            <p className="mt-1 text-sm text-neutral-500">{opt.desc}</p>
          </button>
        ))}
      </div>

      <Button
        onClick={handleRegister}
        disabled={!selected || isPending}
        className="mt-6 bg-buildstory-500 text-black hover:bg-white/90 px-8 h-12 text-sm font-medium ease-in duration-200"
      >
        {isPending && <Loader2 className="animate-spin" />}
        Register
      </Button>
      <ErrorMessage message={error} />
    </div>
  );
}

// --- Entered projects list ---

function EnteredProjects({
  event,
  enteredProjects,
}: {
  event: Event;
  enteredProjects: (EventProject & { project: Project })[];
}) {
  const [isPending, startTransition] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleRemove(projectId: string) {
    setRemovingId(projectId);
    setError(null);
    startTransition(async () => {
      const result = await removeProjectFromEvent(event.id, projectId);
      if (!result.success) setError(result.error);
    });
  }

  if (enteredProjects.length === 0) return null;

  return (
    <div className="border border-border p-6 md:p-8">
      <h3 className="font-heading text-2xl text-[#e8e4de]">Your entries</h3>
      <p className="mt-2 text-neutral-500">
        Projects you&apos;ve entered in this hackathon.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {enteredProjects.map(({ project }) => (
          <div
            key={project.id}
            className="flex items-center justify-between border border-border p-4"
          >
            <div className="min-w-0">
              <p className="text-[#e8e4de] font-medium truncate">
                {project.name}
              </p>
              {project.description && (
                <p className="mt-1 text-sm text-neutral-500 line-clamp-1">
                  {project.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4 shrink-0">
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-500 hover:text-white transition-colors"
                >
                  <Github className="size-4" />
                </a>
              )}
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-500 hover:text-white transition-colors"
                >
                  <ExternalLink className="size-4" />
                </a>
              )}
              <button
                onClick={() => handleRemove(project.id)}
                disabled={isPending}
                className="text-neutral-500 hover:text-red-400 transition-colors cursor-pointer ml-2"
                title="Remove from event"
              >
                {isPending && removingId === project.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <X className="size-4" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
      <ErrorMessage message={error} />
    </div>
  );
}

// --- Select existing project ---

function SelectProject({
  event,
  availableProjects,
}: {
  event: Event;
  availableProjects: Project[];
}) {
  const [isPending, startTransition] = useTransition();
  const [enteringId, setEnteringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleEnter(projectId: string) {
    setEnteringId(projectId);
    setError(null);
    startTransition(async () => {
      const result = await enterProjectInEvent(event.id, projectId);
      if (!result.success) setError(result.error);
    });
  }

  if (availableProjects.length === 0) return null;

  return (
    <div className="border border-border p-6 md:p-8">
      <h3 className="font-heading text-2xl text-[#e8e4de]">
        Enter an existing project
      </h3>
      <p className="mt-2 text-neutral-500">
        Select one of your projects to enter in this hackathon.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {availableProjects.map((project) => (
          <div
            key={project.id}
            className="flex items-center justify-between border border-border p-4"
          >
            <div className="min-w-0">
              <p className="text-[#e8e4de] font-medium truncate">
                {project.name}
              </p>
              {project.description && (
                <p className="mt-1 text-sm text-neutral-500 line-clamp-1">
                  {project.description}
                </p>
              )}
            </div>
            <button
              onClick={() => handleEnter(project.id)}
              disabled={isPending}
              className="ml-4 shrink-0 text-neutral-500 hover:text-buildstory-500 transition-colors cursor-pointer"
              title="Enter in event"
            >
              {isPending && enteringId === project.id ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
            </button>
          </div>
        ))}
      </div>
      <ErrorMessage message={error} />
    </div>
  );
}

// --- Create new project form ---

function CreateProjectForm({ event }: { event: Event }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createProject(formData, event.id);
      if (result.success) {
        setOpen(false);
      } else {
        setError(result.error);
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full border border-dashed border-border hover:border-white/20 p-6 md:p-8 text-center transition-colors cursor-pointer group"
      >
        <div className="flex items-center justify-center gap-2 text-neutral-500 group-hover:text-white/70 transition-colors">
          <Plus className="size-5" />
          <span className="font-medium">Create a new project</span>
        </div>
      </button>
    );
  }

  return (
    <div className="border border-border p-6 md:p-8">
      <h3 className="font-heading text-2xl text-[#e8e4de]">New project</h3>
      <p className="mt-2 text-neutral-500">
        Create a project and enter it in this hackathon.
      </p>

      <form action={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <Label htmlFor="name" className="text-neutral-400">
            Project name
          </Label>
          <Input
            id="name"
            name="name"
            required
            placeholder="My cool project"
            className="mt-1.5 bg-white/5 border-border text-white placeholder:text-neutral-600"
          />
        </div>

        <div>
          <Label htmlFor="description" className="text-neutral-400">
            Description
            <span className="text-neutral-600 font-normal ml-1">optional</span>
          </Label>
          <Input
            id="description"
            name="description"
            placeholder="A brief description of what you're building"
            className="mt-1.5 bg-white/5 border-border text-white placeholder:text-neutral-600"
          />
        </div>

        <div>
          <Label htmlFor="githubUrl" className="text-neutral-400">
            GitHub URL
            <span className="text-neutral-600 font-normal ml-1">optional</span>
          </Label>
          <Input
            id="githubUrl"
            name="githubUrl"
            type="url"
            placeholder="https://github.com/you/project"
            className="mt-1.5 bg-white/5 border-border text-white placeholder:text-neutral-600"
          />
        </div>

        <div className="flex items-center gap-3 mt-2">
          <Button
            type="submit"
            disabled={isPending}
            className="bg-buildstory-500 text-black hover:bg-white/90 px-6 h-10 text-sm font-medium ease-in duration-200"
          >
            {isPending && <Loader2 className="animate-spin" />}
            Create & enter
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            className="text-neutral-500 hover:text-white"
          >
            Cancel
          </Button>
        </div>
      </form>
      <ErrorMessage message={error} />
    </div>
  );
}

// --- Main dashboard ---

export function EventDashboard({
  event,
  registration,
  enteredProjects,
  availableProjects,
}: {
  event: Event;
  registration: EventRegistration | null;
  enteredProjects: (EventProject & { project: Project })[];
  availableProjects: Project[];
}) {
  if (!registration) {
    return <RegisterCard event={event} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <EnteredProjects event={event} enteredProjects={enteredProjects} />
      <SelectProject event={event} availableProjects={availableProjects} />
      <CreateProjectForm event={event} />
    </div>
  );
}
