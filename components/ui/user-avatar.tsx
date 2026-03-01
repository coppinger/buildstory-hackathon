import Image from "next/image";
import { cn } from "@/lib/utils";

const sizeMap = {
  xs: { container: "w-8 h-8", text: "text-xs", pixels: 32 },
  sm: { container: "w-10 h-10", text: "text-sm", pixels: 40 },
  md: { container: "w-14 h-14", text: "text-xl", pixels: 56 },
  lg: { container: "w-20 h-20", text: "text-2xl", pixels: 80 },
} as const;

interface UserAvatarProps {
  avatarUrl?: string | null;
  displayName: string;
  size: keyof typeof sizeMap;
  className?: string;
}

export function UserAvatar({
  avatarUrl,
  displayName,
  size,
  className,
}: UserAvatarProps) {
  const { container, text, pixels } = sizeMap[size];
  const initials = displayName.charAt(0)?.toUpperCase() || "?";

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={displayName}
        width={pixels}
        height={pixels}
        className={cn(
          container,
          "rounded-full object-cover shrink-0",
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        container,
        "rounded-full bg-muted flex items-center justify-center font-medium text-foreground shrink-0",
        text,
        className
      )}
    >
      {initials}
    </div>
  );
}
