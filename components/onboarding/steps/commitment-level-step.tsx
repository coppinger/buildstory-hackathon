"use client";

import { SectionRadioGroup } from "@/components/onboarding/section-radio-group";

const commitmentOptions = [
  {
    value: "all_in",
    label: "All-in",
    description: "Full days, full week. Clearing the decks.",
  },
  {
    value: "daily",
    label: "Daily",
    description: "A few focused hours each day.",
  },
  {
    value: "nights_weekends",
    label: "Nights & Weekends",
    description: "Building around a day job.",
  },
  {
    value: "not_sure",
    label: "Not sure yet",
    description: "You'll figure it out as you go. That's fine, too.",
  },
];

interface CommitmentLevelStepProps {
  value: string | null;
  onChange: (value: string) => void;
}

export function CommitmentLevelStep({ value, onChange }: CommitmentLevelStepProps) {
  return (
    <SectionRadioGroup
      options={commitmentOptions}
      value={value}
      onChange={onChange}
      columns={2}
    />
  );
}
