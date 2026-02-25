"use client";

import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { motion } from "motion/react";

interface LivePreviewBadgeProps {
  displayName: string;
  username: string;
}

export function LivePreviewBadge({
  displayName,
  username,
}: LivePreviewBadgeProps) {
  return (
    <div className="flex items-center gap-3 border border-neutral-800 bg-neutral-900/50 px-4 py-3">
      {/* Avatar placeholder */}
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-800">
        <Icon name="person" size="5" className="text-neutral-500" />
      </div>

      <div className="min-w-0 flex-1">
        <motion.p
          layout
          className="truncate text-lg font-medium text-white"
        >
          {displayName || "Your Name"}
        </motion.p>
        <motion.p
          layout
          className="truncate text-base text-neutral-500"
        >
          @{username || "username"}
        </motion.p>
      </div>

      <Badge className="shrink-0 rounded-full bg-amber-400/10 text-amber-400 border-amber-400/20 text-[10px] uppercase tracking-wider">
        Founding Member
      </Badge>
    </div>
  );
}
