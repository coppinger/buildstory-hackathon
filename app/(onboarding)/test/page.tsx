"use client";

import { Hand, Wrench, PartyPopper } from "lucide-react";
import { useWizard } from "@/components/onboarding/use-wizard";
import { Stepper } from "@/components/onboarding/stepper";
import { WizardCard } from "@/components/onboarding/wizard-card";

const STEPS = [
  {
    title: "Welcome",
    icon: <Hand />,
    description: "Let's get your profile set up",
    content: <p className="text-neutral-300 text-center">Step 1 content goes here.</p>,
  },
  {
    title: "Your Skills",
    icon: <Wrench />,
    description: "Tell us what you build with",
    content: <p className="text-neutral-300 text-center">Step 2 content goes here.</p>,
  },
  {
    title: "All Set",
    icon: <PartyPopper />,
    description: "You're ready to start building",
    content: <p className="text-neutral-300 text-center">Step 3 content goes here.</p>,
  },
];

export default function OnboardingTestPage() {
  const wizard = useWizard({
    totalSteps: STEPS.length,
    onComplete: () => alert("Wizard complete!"),
  });

  const step = STEPS[wizard.currentStep];

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <Stepper steps={STEPS.map((s) => ({ label: s.title, icon: s.icon }))} currentStep={wizard.currentStep} />

      <WizardCard
        title={step.title}
        description={step.description}
        primaryLabel={wizard.isLastStep ? "Complete" : "Continue"}
        onPrimary={wizard.next}
        secondaryLabel={wizard.isFirstStep ? undefined : "Back"}
        onSecondary={wizard.isFirstStep ? undefined : wizard.back}
      >
        {step.content}
      </WizardCard>
    </div>
  );
}
