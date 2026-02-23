"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

interface BlurFadeProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  blur?: string;
  yOffset?: number;
  className?: string;
}

export function BlurFade({
  children,
  delay = 0,
  duration = 0.8,
  blur = "12px",
  yOffset = 6,
  className,
}: BlurFadeProps) {
  return (
    <motion.div
      initial={{ filter: `blur(${blur})`, opacity: 0, y: yOffset }}
      animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
