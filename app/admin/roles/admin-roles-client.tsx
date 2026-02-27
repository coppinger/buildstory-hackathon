"use client";

import { useState, useRef, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { setUserRole, searchProfilesByName } from "./actions";

interface ElevatedUser {
  id: string;
  clerkId: string;
  displayName: string;
  username: string | null;
  role: "user" | "moderator" | "admin";
  isSuperAdmin: boolean;
}

interface SearchResult {
  id: string;
  displayName: string;
  username: string | null;
  role: "user" | "moderator" | "admin";
  clerkId: string;
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

export function AdminRolesClient({
  elevatedUsers,
}: {
  elevatedUsers: ElevatedUser[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    if (timerRef.current) clearTimeout(timerRef.current);

    if (value.length < 2) {
      setResults([]);
      return;
    }

    timerRef.current = setTimeout(async () => {
      const found = await searchProfilesByName(value);
      setResults(found);
    }, 300);
  }, []);

  function handleRoleChange(profileId: string, role: "user" | "moderator" | "admin") {
    setError("");
    startTransition(async () => {
      const result = await setUserRole({ profileId, role });
      if (result.success) {
        router.refresh();
        setSearch("");
        setResults([]);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl">Role Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Assign admin or moderator roles to existing users.
        </p>
      </div>

      {error && (
        <div className="border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive rounded-md">
          {error}
        </div>
      )}

      {/* Search + Assign */}
      <Card className="p-6 space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Add Role
        </p>
        <div className="relative max-w-sm">
          <Icon
            name="search"
            size="4"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search by name or username..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 border border-border rounded-md"
              >
                <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <span className="text-xs font-medium text-muted-foreground">
                    {user.displayName[0]?.toUpperCase() ?? "?"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.displayName}
                  </p>
                  {user.username && (
                    <p className="text-xs text-muted-foreground">
                      @{user.username}
                    </p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs ${getRoleBadge(user.role)}`}
                >
                  {user.role}
                </Badge>
                <div className="flex items-center gap-1">
                  {user.role !== "moderator" && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleRoleChange(user.id, "moderator")}
                    >
                      Make Mod
                    </Button>
                  )}
                  {user.role !== "admin" && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleRoleChange(user.id, "admin")}
                    >
                      Make Admin
                    </Button>
                  )}
                  {user.role !== "user" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleRoleChange(user.id, "user")}
                      className="text-destructive hover:text-destructive"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {search.length >= 2 && results.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No users found matching &quot;{search}&quot;
          </p>
        )}
      </Card>

      {/* Current Elevated Users */}
      <Card className="p-6 space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Current Admins &amp; Moderators
        </p>

        {elevatedUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No elevated users found.
          </p>
        ) : (
          <div className="space-y-2">
            {elevatedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 border border-border rounded-md"
              >
                <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <span className="text-xs font-medium text-muted-foreground">
                    {user.displayName[0]?.toUpperCase() ?? "?"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.displayName}
                  </p>
                  {user.username && (
                    <p className="text-xs text-muted-foreground">
                      @{user.username}
                    </p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs ${getRoleBadge(user.role)}`}
                >
                  {user.role}
                  {user.isSuperAdmin && " (super)"}
                </Badge>
                {!user.isSuperAdmin && (
                  <div className="flex items-center gap-1">
                    {user.role === "moderator" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleRoleChange(user.id, "admin")}
                      >
                        Promote
                      </Button>
                    )}
                    {user.role === "admin" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleRoleChange(user.id, "moderator")}
                      >
                        Demote
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleRoleChange(user.id, "user")}
                      className="text-destructive hover:text-destructive"
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
