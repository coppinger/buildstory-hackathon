"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

const MAX_ITEMS = 12;
const ROTATE_INTERVAL_MS = 5000;

function getInitials(name: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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
  if (type === "signup") return "\u2192";
  if (type === "project") return "\u25C6";
  if (type === "team_join") return "\u2B21";
  if (type === "submission") return "\u2605";
  return "\u2192";
}

function formatAction(type: string, detail: string | null) {
  if (type === "signup") return "signed up";
  if (type === "project") return `added a project: '${detail}'`;
  if (type === "team_join") return `joined team on '${detail}'`;
  if (type === "submission") return `submitted '${detail}'`;
  return "signed up";
}

interface SerializedActivity {
  type: "signup" | "project" | "team_join" | "submission";
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  detail: string | null;
}

interface FeedItem {
  id: number;
  type: "signup" | "project" | "team_join" | "submission";
  name: string;
  handle: string;
  avatarUrl: string | null;
  action: string;
}

interface DashboardActivityFeedProps {
  activities: SerializedActivity[];
}

function toFeedItem(activity: SerializedActivity, id: number): FeedItem {
  return {
    id,
    type: activity.type,
    name: activity.displayName,
    handle: activity.username ? `@${activity.username}` : "",
    avatarUrl: activity.avatarUrl,
    action: formatAction(activity.type, activity.detail),
  };
}

export function DashboardActivityFeed({ activities }: DashboardActivityFeedProps) {
  const nextIndexRef = useRef(Math.min(MAX_ITEMS, activities.length));
  const [items, setItems] = useState<FeedItem[]>(() => {
    if (activities.length === 0) return [];
    return activities
      .slice(0, MAX_ITEMS)
      .reverse()
      .map((activity, index) => toFeedItem(activity, index));
  });

  const addItem = useCallback(() => {
    if (activities.length === 0) return;

    const activity = activities[nextIndexRef.current % activities.length];
    setItems((prev) => {
      const newItem = toFeedItem(activity, Date.now());
      return [newItem, ...prev].slice(0, MAX_ITEMS);
    });
    nextIndexRef.current += 1;
  }, [activities]);

  useEffect(() => {
    if (activities.length === 0) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const stop = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const start = () => {
      if (intervalId !== null || document.hidden) return;
      intervalId = setInterval(addItem, ROTATE_INTERVAL_MS);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        stop();
        return;
      }

      addItem();
      start();
    };

    start();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
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
          {items.map((item, i) => (
            <div key={item.id} className="flex items-center gap-3 px-3 py-2.5">
              {/* Activity icon */}
              <span className="w-4 shrink-0 text-center text-sm text-buildstory-500">
                {getActivityIcon(item.type)}
              </span>

              {/* Avatar */}
              {item.avatarUrl ? (
                <Image
                  src={item.avatarUrl}
                  alt={item.name}
                  width={32}
                  height={32}
                  sizes="32px"
                  className="h-8 w-8 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-medium ${colors[i % colors.length]}`}
                >
                  {getInitials(item.name)}
                </div>
              )}

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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
