"use client";

import { Icon } from "@/components/ui/icon";
import { SectionRadioGroup } from "@/components/onboarding/section-radio-group";

const teamOptions = [
  {
    value: "solo",
    label: "Solo",
    description: "Flying solo — just you and your ideas.",
    icon: <Icon name="person" size="5" className="text-neutral-400" />,
  },
  {
    value: "has_team",
    label: "I have a team",
    description: "You already know who you're building with.",
    icon: <Icon name="group" size="5" className="text-neutral-400" />,
  },
  {
    value: "has_team_open",
    label: "I have a team, open to more",
    description: "You'll be listed in the participant directory.",
    icon: <Icon name="group_add" size="5" className="text-neutral-400" />,
  },
  {
    value: "looking_for_team",
    label: "Looking for teammates",
    description: "You'll be listed in the participant directory.",
    icon: <Icon name="person_search" size="5" className="text-neutral-400" />,
  },
];

interface TeamPreferenceStepProps {
  value: string | null;
  onChange: (value: string) => void;
}

export function TeamPreferenceStep({ value, onChange }: TeamPreferenceStepProps) {
  return (
    <div className="space-y-4">
      <SectionRadioGroup
        options={teamOptions}
        value={value}
        onChange={onChange}
      />
      <div className="border border-neutral-800 bg-neutral-900/50 px-4 py-3">
        <p className="text-base text-neutral-400">
          You&apos;ll get a dashboard to track your progress. The event kicks off
          March 1.
        </p>
      </div>
    </div>
  );
}
