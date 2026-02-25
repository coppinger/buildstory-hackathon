"use client";

import { Icon } from "@/components/ui/icon";
import { SectionRadioGroup } from "@/components/onboarding/section-radio-group";

const startingPointOptions = [
  {
    value: "new",
    label: "New project",
    description: "You're starting with a blank canvas.",
    icon: <Icon name="add_circle" size="5" className="text-neutral-400" />,
  },
  {
    value: "existing",
    label: "Existing project",
    description:
      "You'll ship a feature or improvement on an existing project.",
    icon: <Icon name="history" size="5" className="text-neutral-400" />,
  },
];

interface StartingPointStepProps {
  value: string | null;
  onChange: (value: string) => void;
}

export function StartingPointStep({ value, onChange }: StartingPointStepProps) {
  return (
    <SectionRadioGroup
      options={startingPointOptions}
      value={value}
      onChange={onChange}
    />
  );
}
