"use client";

import { Icon } from "@/components/ui/icon";
import { SectionRadioGroup } from "@/components/onboarding/section-radio-group";

const experienceOptions = [
  {
    value: "getting_started",
    label: "Just getting started",
    description: "New to building with AI — excited to learn.",
    icon: <Icon name="emoji_objects" size="5" className="text-neutral-400" />,
  },
  {
    value: "built_a_few",
    label: "Built a few things",
    description: "Shipped a project or two, still exploring.",
    icon: <Icon name="construction" size="5" className="text-neutral-400" />,
  },
  {
    value: "ships_constantly",
    label: "Ship with AI constantly",
    description: "Building with AI is part of your daily workflow.",
    icon: <Icon name="rocket_launch" size="5" className="text-neutral-400" />,
  },
];

interface ExperienceStepProps {
  value: string | null;
  onChange: (value: string) => void;
}

export function ExperienceStep({ value, onChange }: ExperienceStepProps) {
  return (
    <SectionRadioGroup
      options={experienceOptions}
      value={value}
      onChange={onChange}
    />
  );
}
