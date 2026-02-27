"use client";

import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface StepConfig {
  label: string;
  icon: ReactNode;
}

interface StepperProps {
  steps: StepConfig[];
  currentStep: number;
  subStepCounts?: number[];
  currentSubStep?: number;
  className?: string;
}

export function Stepper({
  steps,
  currentStep,
  subStepCounts,
  currentSubStep = 0,
  className,
}: StepperProps) {
  return (
    <div className={cn("flex flex-col items-center gap-4 w-full max-w-md mx-auto", className)}>
      <div className="flex items-center w-full">
        {steps.map((step, i) => {
          const isCompleted = i < currentStep;
          const isActive = i === currentStep;

          return (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-10 h-10">
                  {isCompleted ? (
                    <Icon name="check" size="5" className="text-amber-400 material-icon-bold" />
                  ) : (
                    <span className={cn(
                      isActive ? "text-amber-400" : "text-neutral-500"
                    )}>
                      {step.icon}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2.5 text-xs whitespace-nowrap",
                    isCompleted && "text-amber-400",
                    isActive && "text-amber-400",
                    !isCompleted && !isActive && "text-neutral-600"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-px mx-3 mb-5",
                    isCompleted ? "bg-amber-400" : "bg-neutral-800"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {subStepCounts && subStepCounts[currentStep] > 1 && (
        <div className="flex items-center gap-1.5">
          {Array.from({ length: subStepCounts[currentStep] }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors",
                i === currentSubStep
                  ? "bg-amber-400"
                  : i < currentSubStep
                    ? "bg-amber-400/40"
                    : "bg-neutral-700"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
