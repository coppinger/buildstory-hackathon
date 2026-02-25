"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { PredictiveSearch } from "@/components/onboarding/predictive-search";
import { searchUsers, searchProjects } from "@/app/(onboarding)/hackathon/actions";
import { cn } from "@/lib/utils";

type BridgeChoice = "add_project" | "no_project" | "joining_team";

interface SearchResult {
  id: string;
  label: string;
  sublabel?: string;
}

interface BridgeStepProps {
  onChoose: (choice: BridgeChoice) => void;
  onJoinTeam: (teamLeadId: string | null, projectId: string | null) => void;
}

const options = [
  {
    id: "add_project" as const,
    icon: "build",
    title: "Yes, let's add it",
    description: "Set up your project now",
  },
  {
    id: "no_project" as const,
    icon: "lightbulb",
    title: "Not yet",
    description: "I'll figure it out later",
  },
  {
    id: "joining_team" as const,
    icon: "group",
    title: "I'm joining an existing team",
    description: "Someone else is leading the project",
  },
];

export function BridgeStep({ onChoose, onJoinTeam }: BridgeStepProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<SearchResult | null>(null);
  const [selectedProject, setSelectedProject] = useState<SearchResult | null>(null);

  const handleUserSearch = useCallback(async (query: string) => {
    const result = await searchUsers(query);
    if (!result.success || !result.data) return [];
    return result.data.map((u) => ({
      id: u.id,
      label: u.displayName,
      sublabel: u.username ? `@${u.username}` : undefined,
    }));
  }, []);

  const handleProjectSearch = useCallback(
    async (query: string) => {
      const result = await searchProjects(query, selectedLead?.id);
      if (!result.success || !result.data) return [];
      return result.data.map((p) => ({
        id: p.id,
        label: p.name,
        sublabel: p.description ?? undefined,
      }));
    },
    [selectedLead?.id]
  );

  function handleOptionClick(id: BridgeChoice) {
    if (id === "add_project") {
      onChoose("add_project");
    } else if (id === "no_project") {
      onChoose("no_project");
    } else if (id === "joining_team") {
      setExpanded(expanded === "joining_team" ? null : "joining_team");
    }
  }

  function handleJoinContinue() {
    onJoinTeam(selectedLead?.id ?? null, selectedProject?.id ?? null);
  }

  const canContinueJoin = selectedLead || selectedProject;

  return (
    <div className="w-full max-w-lg mx-auto space-y-8">
      <div className="text-center space-y-2">
        <p className="text-4xl">🎉</p>
        <h1 className="font-heading text-3xl sm:text-4xl text-white">
          You&apos;re in!
        </h1>
        <p className="text-base text-neutral-400">
          One more thing — do you know what you&apos;re going to build?
        </p>
      </div>

      <div className="space-y-3">
        {options.map((option) => (
          <div key={option.id}>
            <button
              type="button"
              onClick={() => handleOptionClick(option.id)}
              className={cn(
                "w-full border p-4 text-left transition-colors cursor-pointer flex items-center gap-4",
                expanded === option.id
                  ? "border-amber-400 bg-amber-400/5"
                  : "border-neutral-800 hover:border-neutral-600"
              )}
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-800">
                <Icon name={option.icon} size="5" className="text-neutral-400" />
              </div>
              <div>
                <p className="text-base font-medium text-white">{option.title}</p>
                <p className="text-sm text-neutral-500">{option.description}</p>
              </div>
            </button>

            {/* Expanded join team section */}
            {option.id === "joining_team" && expanded === "joining_team" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="border border-t-0 border-neutral-800 px-4 py-5 space-y-4">
                  <PredictiveSearch
                    label="Team lead"
                    placeholder="Search by username..."
                    onSearch={handleUserSearch}
                    onSelect={setSelectedLead}
                    selected={selectedLead}
                    onClear={() => setSelectedLead(null)}
                  />
                  <PredictiveSearch
                    label="Project"
                    placeholder="Search by project name..."
                    onSearch={handleProjectSearch}
                    onSelect={setSelectedProject}
                    selected={selectedProject}
                    onClear={() => setSelectedProject(null)}
                  />
                  <p className="text-sm text-neutral-500">
                    Search by either field — we&apos;ll match you up.
                  </p>
                  <Button
                    onClick={handleJoinContinue}
                    disabled={!canContinueJoin}
                    className="w-full h-11 bg-foreground text-background hover:bg-foreground/90 font-medium"
                  >
                    Continue →
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
