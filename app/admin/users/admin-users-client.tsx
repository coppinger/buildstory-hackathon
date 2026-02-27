"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ObfuscatedField } from "@/components/admin/obfuscated-field";
import { BanUserDialog } from "@/components/admin/ban-user-dialog";
import { HideUserDialog } from "@/components/admin/hide-user-dialog";
import { unhideUser, unbanUser } from "./actions";

interface SerializedUser {
  id: string;
  clerkId: string;
  username: string | null;
  displayName: string;
  country: string | null;
  role: "user" | "moderator" | "admin";
  bannedAt: string | null;
  hiddenAt: string | null;
  banReason: string | null;
  createdAt: string;
}

interface UserStats {
  total: number;
  hidden: number;
  banned: number;
  elevated: number;
}

type TabFilter = "all" | "active" | "hidden" | "banned";

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

function getStatusInfo(user: SerializedUser) {
  if (user.bannedAt)
    return { label: "Banned", color: "text-red-400 bg-red-400/10" };
  if (user.hiddenAt)
    return { label: "Hidden", color: "text-yellow-400 bg-yellow-400/10" };
  return { label: "Active", color: "text-green-400 bg-green-400/10" };
}

function getRoleBadge(role: string) {
  switch (role) {
    case "admin":
      return "text-purple-400 bg-purple-400/10";
    case "moderator":
      return "text-blue-400 bg-blue-400/10";
    default:
      return "text-muted-foreground bg-muted";
  }
}

export function AdminUsersClient({
  users,
  stats,
  currentRole,
}: {
  users: SerializedUser[];
  stats: UserStats;
  currentRole: "admin" | "moderator";
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabFilter>("all");
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const PAGE_SIZE = 20;

  const filtered = useMemo(() => {
    let list = users;

    // Tab filter
    switch (tab) {
      case "active":
        list = list.filter((u) => !u.bannedAt && !u.hiddenAt);
        break;
      case "hidden":
        list = list.filter((u) => u.hiddenAt && !u.bannedAt);
        break;
      case "banned":
        list = list.filter((u) => u.bannedAt);
        break;
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.displayName.toLowerCase().includes(q) ||
          u.username?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [users, tab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, filtered.length);

  const statCards = [
    { label: "Total Users", value: stats.total, icon: "group" },
    { label: "Hidden", value: stats.hidden, icon: "visibility_off" },
    { label: "Banned", value: stats.banned, icon: "block" },
    { label: "Admins / Mods", value: stats.elevated, icon: "shield_person" },
  ];

  const tabs: { key: TabFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: users.length },
    {
      key: "active",
      label: "Active",
      count: users.filter((u) => !u.bannedAt && !u.hiddenAt).length,
    },
    {
      key: "hidden",
      label: "Hidden",
      count: users.filter((u) => u.hiddenAt && !u.bannedAt).length,
    },
    {
      key: "banned",
      label: "Banned",
      count: users.filter((u) => u.bannedAt).length,
    },
  ];

  function handleUnhide(profileId: string) {
    startTransition(async () => {
      await unhideUser({ profileId });
      router.refresh();
    });
  }

  function handleUnban(profileId: string) {
    startTransition(async () => {
      await unbanUser({ profileId });
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl">User Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View, hide, and ban users. PII is obfuscated for streaming safety.
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

      {/* Search + Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Icon
            name="search"
            size="4"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search by name or username..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setPage(1);
              }}
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
      </div>

      {/* User list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-sm text-muted-foreground">
              {search ? "No users match your search." : "No users found."}
            </p>
          </Card>
        ) : (
          paginated.map((user) => {
            const status = getStatusInfo(user);
            return (
              <Card
                key={user.id}
                className="p-4 flex flex-col lg:flex-row lg:items-center gap-4"
              >
                {/* Avatar + Name */}
                <div className="flex items-center gap-3 min-w-0 lg:w-56">
                  <div className="size-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <span className="text-sm font-medium text-muted-foreground">
                      {user.displayName[0]?.toUpperCase() ?? "?"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <ObfuscatedField value={user.displayName} type="text" />
                    {user.username && (
                      <p className="text-xs text-muted-foreground truncate">
                        @{user.username}
                      </p>
                    )}
                  </div>
                </div>

                {/* Clerk ID */}
                <div className="lg:w-36 min-w-0">
                  <ObfuscatedField value={user.clerkId} type="id" />
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 lg:w-40">
                  <Badge
                    variant="outline"
                    className={`text-xs ${getRoleBadge(user.role)}`}
                  >
                    {user.role}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs ${status.color}`}
                  >
                    {status.label}
                  </Badge>
                </div>

                {/* Country + Date */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground lg:w-32">
                  {user.country && <span>{user.country}</span>}
                  <span>{relativeTime(user.createdAt)}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 lg:ml-auto">
                  <Link href={`/admin/users/${user.id}`}>
                    <Button variant="ghost" size="icon-xs" title="View details">
                      <Icon name="open_in_new" size="4" />
                    </Button>
                  </Link>

                  {/* Hide / Unhide */}
                  {!user.bannedAt && !user.hiddenAt && (
                    <HideUserDialog
                      profileId={user.id}
                      displayName={user.displayName}
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          title="Hide user"
                        >
                          <Icon name="visibility_off" size="4" />
                        </Button>
                      }
                      onComplete={() => router.refresh()}
                    />
                  )}
                  {user.hiddenAt && !user.bannedAt && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      title="Unhide user"
                      disabled={isPending}
                      onClick={() => handleUnhide(user.id)}
                    >
                      <Icon name="visibility" size="4" />
                    </Button>
                  )}

                  {/* Ban / Unban */}
                  {!user.bannedAt && (
                    <BanUserDialog
                      profileId={user.id}
                      displayName={user.displayName}
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          title="Ban user"
                          className="text-destructive hover:text-destructive"
                        >
                          <Icon name="block" size="4" />
                        </Button>
                      }
                      onComplete={() => router.refresh()}
                    />
                  )}
                  {user.bannedAt && currentRole === "admin" && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      title="Unban user"
                      disabled={isPending}
                      onClick={() => handleUnban(user.id)}
                    >
                      <Icon
                        name="check_circle"
                        size="4"
                        className="text-green-400"
                      />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

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
