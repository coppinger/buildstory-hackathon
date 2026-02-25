"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import allActivities from "@/data/mock-activity.json";

const SEED_COUNT = 12;

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

const colors = [
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
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

export function DashboardActivityFeed() {
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
      return [newItem, ...prev].slice(0, 12);
    });
    setNextIndex((prev) => prev + 1);
  }, [nextIndex]);

  useEffect(() => {
    const interval = setInterval(addItem, 3000);
    return () => clearInterval(interval);
  }, [addItem]);

  return (
    <div className="relative flex-1 overflow-hidden -mx-8 -mb-8">
      {/* Bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-white to-transparent" />
      <div className="h-full overflow-hidden px-8">
        <div className="flex flex-col gap-0.5">
          <AnimatePresence initial={false}>
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: -40, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  opacity: { duration: 0.3 },
                  y: { type: "spring", stiffness: 300, damping: 28 },
                  scale: { duration: 0.2 },
                  layout: { type: "spring", stiffness: 300, damping: 28 },
                }}
                className="flex items-center gap-3 px-3 py-2.5"
              >
                {/* Activity icon */}
                <span className="w-4 shrink-0 text-center text-sm text-buildstory-500">
                  {getActivityIcon(item.action)}
                </span>

                {/* Avatar */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-medium ${colors[i % colors.length]}`}
                >
                  {getInitials(item.name)}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="truncate text-sm font-medium text-foreground">
                      {item.name}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {item.handle}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.action}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
