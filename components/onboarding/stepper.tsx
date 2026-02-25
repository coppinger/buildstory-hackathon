"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepConfig {
  label: string;
  icon: ReactNode;
}

interface StepperProps {
  steps: StepConfig[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("flex items-center w-full max-w-lg mx-auto", className)}>
      {steps.map((step, i) => {
        const isCompleted = i < currentStep;
        const isActive = i === currentStep;

        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full transition-all",
                  (isCompleted || isActive) && "bg-amber-400",
                  !isCompleted && !isActive && "bg-neutral-800"
                )}
              >
                {isCompleted ? (
                  <Check className="size-3.5 text-neutral-950" strokeWidth={3} />
                ) : (
                  <span className={cn(
                    "[&>svg]:size-4",
                    isActive ? "text-neutral-950" : "text-neutral-500"
                  )}>
                    {step.icon}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "mt-2.5 text-xs tracking-wide whitespace-nowrap",
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
  );
}
