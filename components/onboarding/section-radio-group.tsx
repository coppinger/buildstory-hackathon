"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RadioOption {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
}

interface SectionRadioGroupProps {
  options: RadioOption[];
  value: string | null;
  onChange: (value: string) => void;
  columns?: 1 | 2;
  className?: string;
}

export function SectionRadioGroup({
  options,
  value,
  onChange,
  columns = 1,
  className,
}: SectionRadioGroupProps) {
  return (
    <div
      className={cn(
        "grid gap-3",
        columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1",
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "border p-4 text-left transition-colors cursor-pointer",
            option.icon && "flex items-center gap-4",
            value === option.value
              ? "border-amber-400 bg-amber-400/5"
              : "border-neutral-800 hover:border-neutral-600"
          )}
        >
          {option.icon && (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-800">
              {option.icon}
            </div>
          )}
          <div>
            <p className="text-base font-medium text-white">{option.label}</p>
            {option.description && (
              <p className="mt-1 text-sm text-neutral-500">
                {option.description}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
