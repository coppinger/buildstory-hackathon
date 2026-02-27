"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ObfuscatedField } from "@/components/admin/obfuscated-field";

interface AuditEntry {
  id: string;
  action: string;
  actorName: string;
  targetName: string | null;
  metadata: string | null;
  createdAt: string;
}

type ActionFilter = "all" | "ban" | "hide" | "role";

const ACTION_CONFIG: Record<
  string,
  { label: string; icon: string; color: string; group: ActionFilter }
> = {
  ban_user: {
    label: "Banned",
    icon: "block",
    color: "text-red-400 bg-red-400/10",
    group: "ban",
  },
  unban_user: {
    label: "Unbanned",
    icon: "check_circle",
    color: "text-green-400 bg-green-400/10",
    group: "ban",
  },
  hide_user: {
    label: "Hidden",
    icon: "visibility_off",
    color: "text-yellow-400 bg-yellow-400/10",
    group: "hide",
  },
  unhide_user: {
    label: "Unhidden",
    icon: "visibility",
    color: "text-blue-400 bg-blue-400/10",
    group: "hide",
  },
  set_role: {
    label: "Role changed",
    icon: "shield_person",
    color: "text-purple-400 bg-purple-400/10",
    group: "role",
  },
};

function getActionConfig(action: string) {
  return (
    ACTION_CONFIG[action] ?? {
      label: action,
      icon: "info",
      color: "text-muted-foreground bg-muted",
      group: "all" as ActionFilter,
    }
  );
}

function formatMetadata(action: string, metadata: string | null): string {
  if (!metadata) return "";
  try {
    const data = JSON.parse(metadata);
    if (action === "set_role" && data.oldRole && data.newRole) {
      return `${data.oldRole} \u2192 ${data.newRole}`;
    }
    if (action === "ban_user" && data.reason) {
      return `Reason: ${data.reason}`;
    }
    return "";
  } catch {
    return "";
  }
}

const PAGE_SIZE = 20;

export function AdminAuditClient({ entries }: { entries: AuditEntry[] }) {
  const [filter, setFilter] = useState<ActionFilter>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (filter === "all") return entries;
    return entries.filter((e) => getActionConfig(e.action).group === filter);
  }, [entries, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, filtered.length);

  const filters: { key: ActionFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "ban", label: "Bans" },
    { key: "hide", label: "Hides" },
    { key: "role", label: "Roles" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Record of all admin and moderator actions.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => {
              setFilter(f.key);
              setPage(1);
            }}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter === f.key
                ? "bg-foreground text-background font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Entries */}
      <Card className="p-6">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No audit log entries found.
          </p>
        ) : (
          <div className="space-y-3">
            {paginated.map((entry) => {
              const config = getActionConfig(entry.action);
              const meta = formatMetadata(entry.action, entry.metadata);

              return (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 py-2 border-b border-border last:border-0"
                >
                  <Icon
                    name={config.icon}
                    size="4"
                    className={`mt-0.5 ${config.color.split(" ")[0]}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <ObfuscatedField
                        value={entry.actorName}
                        type="text"
                      />
                      <Badge
                        variant="outline"
                        className={`text-xs ${config.color}`}
                      >
                        {config.label}
                      </Badge>
                      {entry.targetName && (
                        <>
                          <span className="text-xs text-muted-foreground">
                            &rarr;
                          </span>
                          <ObfuscatedField
                            value={entry.targetName}
                            type="text"
                          />
                        </>
                      )}
                    </div>
                    {meta && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {meta}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {rangeStart}–{rangeEnd} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <Icon name="chevron_left" size="4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground tabular-nums px-2">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <Icon name="chevron_right" size="4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
