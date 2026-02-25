"use client";

import { useEffect, useState, useCallback } from "react";
import { Area, AreaChart, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface Stats {
  totalSignups: number;
  totalProjects: number;
  teamSeekers: number;
  activeToday: number;
}

interface SignupDataPoint {
  date: string;
  count: number;
}

interface ActivityItem {
  type: "signup" | "project";
  displayName: string;
  detail: string;
  timestamp: string;
}

interface AdminDashboardClientProps {
  eventId: string;
  eventName: string;
  initialStats: Stats;
  initialSignupsOverTime: SignupDataPoint[];
  initialRecentActivity: ActivityItem[];
}

const chartConfig = {
  count: {
    label: "Signups",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function AdminDashboardClient({
  eventId,
  eventName,
  initialStats,
  initialSignupsOverTime,
  initialRecentActivity,
}: AdminDashboardClientProps) {
  const [stats, setStats] = useState(initialStats);
  const [signupsOverTime, setSignupsOverTime] = useState(
    initialSignupsOverTime
  );
  const [recentActivity, setRecentActivity] = useState(initialRecentActivity);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/stats?eventId=${eventId}`);
      if (!res.ok) return;
      const data = await res.json();
      setStats(data.stats);
      setSignupsOverTime(data.signupsOverTime);
      setRecentActivity(data.recentActivity);
    } catch {
      // Silently ignore polling errors
    }
  }, [eventId]);

  useEffect(() => {
    const interval = setInterval(poll, 30_000);
    return () => clearInterval(interval);
  }, [poll]);

  const statCards = [
    { label: "Total Signups", value: stats.totalSignups, icon: "group" },
    { label: "Total Projects", value: stats.totalProjects, icon: "folder" },
    {
      label: "Team Seekers",
      value: stats.teamSeekers,
      icon: "person_search",
    },
    { label: "Active Today", value: stats.activeToday, icon: "today" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl">{eventName}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Growth dashboard — updates every 30s
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Icon
                name={s.icon}
                size="5"
                className="text-muted-foreground"
              />
              <span className="text-sm text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-4xl font-mono tabular-nums font-medium">
              {s.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Signups Over Time */}
        <Card className="lg:col-span-2 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Signups Over Time
          </p>
          {signupsOverTime.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <AreaChart data={signupsOverTime}>
                <defs>
                  <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-count)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-count)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => {
                    const d = new Date(v + "T00:00:00");
                    return d.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--color-count)"
                  fill="url(#fillCount)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-12 text-center">
              No signup data yet
            </p>
          )}
        </Card>

        {/* Recent Activity */}
        <Card className="p-6 flex flex-col">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Recent Activity
          </p>
          <div className="flex-1 overflow-y-auto max-h-80 space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Icon
                    name={item.type === "signup" ? "person_add" : "folder"}
                    size="4"
                    className="text-muted-foreground mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.type === "signup" ? "Registered" : item.detail}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {relativeTime(item.timestamp)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No activity yet
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
