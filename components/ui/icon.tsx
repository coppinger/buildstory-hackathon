import { cn } from "@/lib/utils";

const sizeMap = {
  "3": "0.75rem",
  "3.5": "0.875rem",
  "4": "1rem",
  "5": "1.25rem",
  "6": "1.5rem",
  "8": "2rem",
} as const;

type IconSize = keyof typeof sizeMap;

interface IconProps {
  name: string;
  size?: IconSize;
  className?: string;
  "aria-label"?: string;
}

export function Icon({ name, size = "5", className, "aria-label": ariaLabel }: IconProps) {
  return (
    <span
      className={cn("material-symbols-sharp shrink-0", className)}
      style={{ fontSize: sizeMap[size] }}
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      role={ariaLabel ? "img" : undefined}
    >
      {name}
    </span>
  );
}
