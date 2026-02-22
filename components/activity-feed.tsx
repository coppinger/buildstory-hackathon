"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import allActivities from "@/data/mock-activity.json";

const SEED_COUNT = 20;

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

const colors = [
  "bg-amber-700/60",
  "bg-emerald-700/60",
  "bg-sky-700/60",
  "bg-violet-700/60",
  "bg-rose-700/60",
  "bg-teal-700/60",
];

function getActivityIcon(action: string) {
  if (action.startsWith("signed up")) return "→";
  if (action.startsWith("added a project")) return "◆";
  if (action.startsWith("created a new team")) return "⬡";
  if (action.startsWith("volunteer")) return "✦";
  return "→";
}

interface FeedItem {
  id: number;
  name: string;
  handle: string;
  action: string;
}

export function ActivityFeed() {
  const [items, setItems] = useState<FeedItem[]>(() => {
    return allActivities
      .slice(0, SEED_COUNT)
      .reverse()
      .map((a, i) => ({ id: i, ...a }));
  });
  const [nextIndex, setNextIndex] = useState(SEED_COUNT);

  const addItem = useCallback(() => {
    const activity = allActivities[nextIndex % allActivities.length];
    setItems((prev) => {
      const newItem: FeedItem = { id: Date.now(), ...activity };
      return [newItem, ...prev].slice(0, 20);
    });
    setNextIndex((prev) => prev + 1);
  }, [nextIndex]);

  useEffect(() => {
    const interval = setInterval(addItem, 2400);
    return () => clearInterval(interval);
  }, [addItem]);

  return (
    <div className="relative h-full overflow-hidden max-w-lg">
        {/* Top fade */}
        <div className="pointer-events-none absolute inset-x-px top-0 z-10 h-16 bg-gradient-to-b from-neutral-950 to-transparent" />
        {/* Bottom fade */}
        <div className="pointer-events-none absolute inset-x-px bottom-0 z-10 h-16 bg-gradient-to-t from-neutral-950 to-transparent" />
      <div className="h-full overflow-hidden border-x border-border px-6">
        <div className="flex flex-col gap-3 py-4">
          <AnimatePresence initial={false}>
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: -60, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  opacity: { duration: 0.4 },
                  y: { type: "spring", stiffness: 300, damping: 28 },
                  scale: { duration: 0.3 },
                  layout: { type: "spring", stiffness: 300, damping: 28 },
                }}
                className="flex items-center gap-3 bg-white/[0.03] px-4 py-3"
              >
                {/* Activity type icon */}
                <span className="w-4 shrink-0 text-center text-sm text-buildstory-300">
                  {getActivityIcon(item.action)}
                </span>

                {/* Avatar */}
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white/80 ${colors[i % colors.length]}`}
                >
                  {getInitials(item.name)}
                </div>

                {/* Info */}
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="truncate text-sm font-semibold text-white/90">
                      {item.name}
                    </span>
                    <span className="shrink-0 text-sm text-white/30">
                      {item.handle}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-white/50">{item.action}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
