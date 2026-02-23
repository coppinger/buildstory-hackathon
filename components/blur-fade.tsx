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
  /** If true, animates on scroll into view instead of on mount */
  inView?: boolean;
  /** Margin for triggering inView (e.g. "-100px") */
  inViewMargin?: string;
}

export function BlurFade({
  children,
  delay = 0,
  duration = 0.8,
  blur = "12px",
  yOffset = 6,
  className,
  inView = false,
  inViewMargin = "-50px",
}: BlurFadeProps) {
  const resolved = { filter: "blur(0px)", opacity: 1, y: 0 };

  return (
    <motion.div
      initial={{ filter: `blur(${blur})`, opacity: 0, y: yOffset }}
      {...(inView
        ? { whileInView: resolved, viewport: { once: true, margin: inViewMargin } }
        : { animate: resolved })}
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
