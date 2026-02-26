"use client";

import { useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const GOAL_SUGGESTIONS = [
  "Ship a working MVP",
  "Launch a public beta",
  "Get 10 users to try it",
  "Record a demo video",
  "Open-source it on GitHub",
];

interface ProjectGoalStepProps {
  projectGoalText: string;
  projectRepoUrl: string;
  showRepoUrl: boolean;
  onUpdate: (partial: {
    projectGoalText?: string;
    projectRepoUrl?: string;
  }) => void;
}

export function ProjectGoalStep({
  projectGoalText,
  projectRepoUrl,
  showRepoUrl,
  onUpdate,
}: ProjectGoalStepProps) {
  const goalRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    goalRef.current?.focus();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="goalText" className="text-neutral-400 text-sm">
          Goal for the week{" "}
          <Badge variant="outline" className="ml-1 text-[10px] py-0">
            Optional
          </Badge>
        </Label>
        <Input
          ref={goalRef}
          id="goalText"
          value={projectGoalText}
          onChange={(e) => onUpdate({ projectGoalText: e.target.value })}
          placeholder="What do you want to ship by the end?"
          className="mt-1.5 bg-white/5 border-neutral-700 text-white placeholder:text-neutral-600"
        />
        {!projectGoalText && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {GOAL_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onUpdate({ projectGoalText: suggestion })}
                className="text-xs px-2.5 py-1 rounded-full border border-neutral-700 text-neutral-400 hover:border-amber-400/50 hover:text-amber-400 transition-colors cursor-pointer"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {showRepoUrl && (
        <div>
          <Label htmlFor="repoUrl" className="text-neutral-400 text-sm">
            Repo URL{" "}
            <Badge variant="outline" className="ml-1 text-[10px] py-0">
              Optional
            </Badge>
          </Label>
          <Input
            id="repoUrl"
            value={projectRepoUrl}
            onChange={(e) => onUpdate({ projectRepoUrl: e.target.value })}
            placeholder="https://github.com/..."
            className="mt-1.5 bg-white/5 border-neutral-700 text-white placeholder:text-neutral-600 font-mono text-sm"
          />
        </div>
      )}
    </div>
  );
}
