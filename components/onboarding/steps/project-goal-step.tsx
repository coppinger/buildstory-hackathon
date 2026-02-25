"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface ProjectGoalStepProps {
  projectGoalText: string;
  projectRepoUrl: string;
  onUpdate: (partial: {
    projectGoalText?: string;
    projectRepoUrl?: string;
  }) => void;
}

export function ProjectGoalStep({
  projectGoalText,
  projectRepoUrl,
  onUpdate,
}: ProjectGoalStepProps) {
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
          id="goalText"
          value={projectGoalText}
          onChange={(e) => onUpdate({ projectGoalText: e.target.value })}
          placeholder="What do you want to ship by the end?"
          className="mt-1.5 bg-white/5 border-neutral-700 text-white placeholder:text-neutral-600"
        />
      </div>

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
    </div>
  );
}
