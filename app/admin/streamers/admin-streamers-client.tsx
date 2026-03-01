"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import {
  addTwitchCategory,
  removeTwitchCategory,
  searchTwitchCategories,
} from "./actions";

interface SerializedCategory {
  id: string;
  twitchId: string;
  name: string;
  boxArtUrl: string | null;
  createdAt: string;
}

interface SearchResult {
  id: string;
  name: string;
  box_art_url: string;
}

export function AdminStreamersClient({
  categories,
}: {
  categories: SerializedCategory[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);

  const existingTwitchIds = new Set(categories.map((c) => c.twitchId));

  function handleSearch() {
    if (!searchQuery.trim()) return;
    setActionError(null);

    startTransition(async () => {
      const result = await searchTwitchCategories({ query: searchQuery });
      if (!result.success) {
        setActionError(result.error);
        return;
      }
      setSearchResults(result.categories);
    });
  }

  function handleAdd(result: SearchResult) {
    setActionError(null);
    startTransition(async () => {
      const res = await addTwitchCategory({
        twitchId: result.id,
        name: result.name,
        boxArtUrl: result.box_art_url || null,
      });
      if (!res.success) {
        setActionError(res.error);
        return;
      }
      setSearchResults((prev) => prev.filter((r) => r.id !== result.id));
      router.refresh();
    });
  }

  function handleRemove(categoryId: string) {
    setActionError(null);
    startTransition(async () => {
      const res = await removeTwitchCategory({ categoryId });
      if (!res.success) {
        setActionError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function formatBoxArtUrl(url: string | null, width = 52, height = 72) {
    if (!url) return null;
    return url
      .replace("{width}", String(width))
      .replace("{height}", String(height));
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Twitch Categories</h1>
        <p className="mt-1 text-muted-foreground">
          Configure which Twitch categories to track for the streamers page.
          Only streams in these categories will appear.
        </p>
      </div>

      {actionError && (
        <div className="text-sm text-red-400 bg-red-400/10 px-4 py-2 rounded-md">
          {actionError}
        </div>
      )}

      {/* Search */}
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-4">Add Category</h2>
        <div className="flex gap-2">
          <Input
            placeholder="Search Twitch categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isPending}>
            {isPending ? "Searching..." : "Search"}
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {searchResults.map((result) => {
              const alreadyAdded = existingTwitchIds.has(result.id);
              const artUrl = formatBoxArtUrl(result.box_art_url, 40, 56);

              return (
                <div
                  key={result.id}
                  className="flex items-center justify-between gap-3 p-3 border border-border rounded-md"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {artUrl && (
                      <img
                        src={artUrl}
                        alt=""
                        className="w-10 h-14 rounded object-cover shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate">{result.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        ID: {result.id}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={alreadyAdded ? "outline" : "default"}
                    disabled={isPending || alreadyAdded}
                    onClick={() => handleAdd(result)}
                  >
                    {alreadyAdded ? "Added" : "Add"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Current categories */}
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-4">
          Active Categories ({categories.length})
        </h2>
        {categories.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No categories configured yet. Search and add one above.
          </p>
        ) : (
          <div className="space-y-2">
            {categories.map((cat) => {
              const artUrl = formatBoxArtUrl(cat.boxArtUrl, 40, 56);
              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between gap-3 p-3 border border-border rounded-md"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {artUrl && (
                      <img
                        src={artUrl}
                        alt=""
                        className="w-10 h-14 rounded object-cover shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate">{cat.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        Twitch ID: {cat.twitchId}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={isPending}
                    onClick={() => handleRemove(cat.id)}
                  >
                    <Icon name="delete" size="4" />
                    Remove
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
