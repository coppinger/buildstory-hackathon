"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

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

function getActivityIcon(type: string) {
  if (type === "signup") return "→";
  if (type === "project") return "◆";
  if (type === "team_join") return "⬡";
  return "→";
}

function formatAction(type: string, detail: string | null) {
  if (type === "signup") return "signed up";
  if (type === "project") return `added a project: '${detail}'`;
  if (type === "team_join") return `joined team on '${detail}'`;
  return "signed up";
}

interface SerializedActivity {
  type: "signup" | "project" | "team_join";
  displayName: string;
  username: string | null;
  detail: string | null;
  timestamp: string;
}

interface FeedItem {
  id: number;
  type: string;
  name: string;
  handle: string;
  action: string;
}

interface DashboardActivityFeedProps {
  activities: SerializedActivity[];
}

export function DashboardActivityFeed({ activities }: DashboardActivityFeedProps) {
  const [items, setItems] = useState<FeedItem[]>(() => {
    if (activities.length === 0) return [];
    return activities
      .slice(0, SEED_COUNT)
      .reverse()
      .map((a, i) => ({
        id: i,
        type: a.type,
        name: a.displayName,
        handle: a.username ? `@${a.username}` : "",
        action: formatAction(a.type, a.detail),
      }));
  });
  const [nextIndex, setNextIndex] = useState(SEED_COUNT);

  const addItem = useCallback(() => {
    if (activities.length === 0) return;
    const activity = activities[nextIndex % activities.length];
    setItems((prev) => {
      const newItem: FeedItem = {
        id: Date.now(),
        type: activity.type,
        name: activity.displayName,
        handle: activity.username ? `@${activity.username}` : "",
        action: formatAction(activity.type, activity.detail),
      };
      return [newItem, ...prev].slice(0, 12);
    });
    setNextIndex((prev) => prev + 1);
  }, [nextIndex, activities]);

  useEffect(() => {
    if (activities.length === 0) return;
    const interval = setInterval(addItem, 3000);
    return () => clearInterval(interval);
  }, [addItem, activities.length]);

  if (activities.length === 0) {
    return (
      <div className="relative flex-1 overflow-hidden -mx-8 -mb-8">
        <div className="h-full overflow-hidden px-8 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No activity yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-hidden -mx-8 -mb-8">
      {/* Top fade */}
        <div className="pointer-events-none absolute inset-x-px -top-10 z-10 h-16 bg-gradient-to-b from-neutral-950 to-transparent" />
        {/* Bottom fade */}
        <div className="pointer-events-none absolute inset-x-px bottom-0 z-10 h-16 bg-gradient-to-t from-neutral-950 to-transparent" />
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
                  {getActivityIcon(item.type)}
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
