"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { approveMentorApplication, declineMentorApplication } from "./actions";

interface SerializedApplication {
  id: string;
  name: string;
  email: string;
  discordHandle: string;
  twitterHandle: string | null;
  websiteUrl: string | null;
  githubHandle: string | null;
  mentorTypes: string[];
  background: string;
  availability: string;
  status: "pending" | "approved" | "declined";
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MentorStats {
  total: number;
  pending: number;
  approved: number;
  declined: number;
}

type TabFilter = "all" | "pending" | "approved" | "declined";

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

function getTypeBadgeClass(type: string) {
  switch (type) {
    case "design":
      return "text-purple-400 bg-purple-400/10";
    case "technical":
      return "text-blue-400 bg-blue-400/10";
    case "growth":
      return "text-green-400 bg-green-400/10";
    default:
      return "text-muted-foreground bg-muted";
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "approved":
      return { label: "Approved", className: "text-green-400 bg-green-400/10" };
    case "declined":
      return { label: "Declined", className: "text-red-400 bg-red-400/10" };
    default:
      return {
        label: "Pending",
        className: "text-yellow-400 bg-yellow-400/10",
      };
  }
}

export function AdminMentorsClient({
  applications,
  stats,
}: {
  applications: SerializedApplication[];
  stats: MentorStats;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabFilter>("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (tab === "all") return applications;
    return applications.filter((a) => a.status === tab);
  }, [applications, tab]);

  const statCards = [
    { label: "Total", value: stats.total, icon: "groups" },
    { label: "Pending", value: stats.pending, icon: "pending" },
    { label: "Approved", value: stats.approved, icon: "check_circle" },
    { label: "Declined", value: stats.declined, icon: "cancel" },
  ];

  const tabs: { key: TabFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: stats.total },
    { key: "pending", label: "Pending", count: stats.pending },
    { key: "approved", label: "Approved", count: stats.approved },
    { key: "declined", label: "Declined", count: stats.declined },
  ];

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleApprove(applicationId: string) {
    setActionError(null);
    startTransition(async () => {
      const result = await approveMentorApplication({ applicationId });
      if (!result.success) {
        setActionError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleDecline(applicationId: string) {
    setActionError(null);
    startTransition(async () => {
      const result = await declineMentorApplication({ applicationId });
      if (!result.success) {
        setActionError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl">Mentor Applications</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review and manage mentor volunteer applications.
        </p>
      </div>

      {actionError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      )}

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

      {/* Tabs */}
      <div className="flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              tab === t.key
                ? "bg-foreground text-background font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-xs opacity-60">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Application list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-sm text-muted-foreground">
              No applications found.
            </p>
          </Card>
        ) : (
          filtered.map((app) => {
            const status = getStatusBadge(app.status);
            const isExpanded = expandedIds.has(app.id);
            const TRUNCATE_LENGTH = 150;
            const isLong = app.background.length > TRUNCATE_LENGTH;

            return (
              <Card key={app.id} className="p-5 space-y-3">
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="size-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <span className="text-sm font-medium text-muted-foreground">
                        {app.name[0]?.toUpperCase() ?? "?"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{app.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {app.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className={`text-xs ${status.className}`}
                    >
                      {status.label}
                    </Badge>
                    {app.mentorTypes.map((type) => (
                      <Badge
                        key={type}
                        variant="outline"
                        className={`text-xs capitalize ${getTypeBadgeClass(type)}`}
                      >
                        {type}
                      </Badge>
                    ))}
                    <span className="text-xs text-muted-foreground">
                      {relativeTime(app.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                    <span>Discord: {app.discordHandle}</span>
                    {app.twitterHandle && (
                      <a
                        href={`https://x.com/${app.twitterHandle.replace(/^@/, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground transition-colors"
                      >
                        Twitter: {app.twitterHandle}
                      </a>
                    )}
                    {app.websiteUrl && (
                      <a
                        href={app.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground transition-colors"
                      >
                        Website
                      </a>
                    )}
                    {app.githubHandle && (
                      <a
                        href={`https://github.com/${app.githubHandle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground transition-colors"
                      >
                        GitHub: {app.githubHandle}
                      </a>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Background
                    </p>
                    <p className="text-foreground">
                      {isLong && !isExpanded
                        ? `${app.background.slice(0, TRUNCATE_LENGTH)}...`
                        : app.background}
                    </p>
                    {isLong && (
                      <button
                        onClick={() => toggleExpand(app.id)}
                        className="text-xs text-muted-foreground hover:text-foreground mt-1"
                      >
                        {isExpanded ? "Show less" : "Show more"}
                      </button>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Availability
                    </p>
                    <p className="text-foreground">{app.availability}</p>
                  </div>
                </div>

                {/* Actions */}
                {app.status === "pending" && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleApprove(app.id)}
                    >
                      <Icon name="check" size="4" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleDecline(app.id)}
                    >
                      <Icon name="close" size="4" />
                      Decline
                    </Button>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
