"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { TwitchIcon } from "@/components/icons";
import type { LiveStreamer } from "@/app/api/streamers/route";

const POLL_INTERVAL_MS = 60_000; // 60 seconds
const MAX_DISPLAYED = 4;

function DoItLiveLink() {
  return (
    <a
      href="https://doitlive.guide/"
      target="_blank"
      rel="noopener noreferrer"
      className="text-buildstory-500 hover:underline"
    >
      doitlive.guide
    </a>
  );
}

export function DashboardStreamsCard() {
  const [streamers, setStreamers] = useState<LiveStreamer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStreamers = useCallback(async () => {
    try {
      const res = await fetch("/api/streamers");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStreamers(Array.isArray(data.streamers) ? data.streamers : []);
    } catch {
      // Keep stale data on subsequent failures
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStreamers();

    const interval = setInterval(fetchStreamers, POLL_INTERVAL_MS);

    function handleVisibility() {
      if (!document.hidden) fetchStreamers();
    }

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchStreamers]);

  const displayed = streamers.slice(0, MAX_DISPLAYED);
  const hasMore = streamers.length > MAX_DISPLAYED;

  return (
    <Card className="w-full">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">
        Live Streams
      </p>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3 mt-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 bg-muted rounded-full shrink-0" />
              <div className="h-3 bg-muted rounded w-24" />
            </div>
          ))}
        </div>
      )}

      {/* Loaded: streamers live */}
      {!loading && displayed.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground mt-1">
            People streaming their hackathon, live on Twitch. Check out our
            guide on <DoItLiveLink />.
          </p>

          <div className="mt-3 space-y-2">
            {displayed.map((streamer) => {
              const twitchUrl = `https://twitch.tv/${streamer.twitchUsername}`;
              return (
                <a
                  key={streamer.profileId}
                  href={twitchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2 -mx-2 hover:bg-muted/50 transition-colors group"
                >
                  <span className="relative">
                    <UserAvatar
                      avatarUrl={streamer.avatarUrl}
                      displayName={streamer.displayName}
                      size="xs"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500 border-2 border-background" />
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-[#9146FF] transition-colors">
                      {streamer.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {streamer.streamTitle}
                    </p>
                  </div>
                  <TwitchIcon className="w-4 h-4 text-muted-foreground group-hover:text-[#9146FF] transition-colors shrink-0" />
                </a>
              );
            })}
          </div>

          {hasMore && (
            <Link
              href="/streamers"
              className="mt-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View all ({streamers.length} live) <span aria-hidden>→</span>
            </Link>
          )}
        </>
      )}

      {/* Loaded: nobody live */}
      {!loading && streamers.length === 0 && (
        <p className="text-sm text-muted-foreground mt-2">
          No one is live right now. Be the first to stream! Check out our guide
          on <DoItLiveLink />.
        </p>
      )}
    </Card>
  );
}
