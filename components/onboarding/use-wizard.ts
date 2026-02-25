"use client";

import { useState, useCallback } from "react";

export function useWizard({
  totalSteps,
  onComplete,
}: {
  totalSteps: number;
  onComplete?: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  const next = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      onComplete?.();
    }
  }, [currentStep, totalSteps, onComplete]);

  const back = useCallback(() => {
    setCurrentStep((s) => Math.max(0, s - 1));
  }, []);

  const goTo = useCallback(
    (step: number) => {
      setCurrentStep(Math.max(0, Math.min(totalSteps - 1, step)));
    },
    [totalSteps]
  );

  const reset = useCallback(() => {
    setCurrentStep(0);
  }, []);

  return {
    currentStep,
    totalSteps,
    isFirstStep,
    isLastStep,
    next,
    back,
    goTo,
    reset,
  };
}
