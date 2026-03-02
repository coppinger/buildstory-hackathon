"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { StreamerCard } from "./streamer-card";
import type { LiveStreamer } from "@/app/api/streamers/route";

const POLL_INTERVAL_MS = 60_000; // 60 seconds

export function StreamersList() {
  const [streamers, setStreamers] = useState<LiveStreamer[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);

  const fetchStreamers = useCallback(async () => {
    try {
      const res = await fetch("/api/streamers");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStreamers(data.streamers);
      setError(null);
      hasLoadedOnce.current = true;
    } catch {
      // Only show error on initial load; keep stale data on subsequent failures
      if (!hasLoadedOnce.current) {
        setError("Failed to load live streamers");
      }
    } finally {
      setInitialLoading(false);
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

  if (initialLoading) {
    return (
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="border border-border animate-pulse"
          >
            <div className="aspect-video bg-muted" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-muted rounded-full" />
                <div className="h-3 bg-muted rounded w-24" />
              </div>
              <div className="h-5 bg-muted rounded w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="mt-12 text-muted-foreground text-center">{error}</p>
    );
  }

  if (streamers.length === 0) {
    return (
      <p className="mt-12 text-muted-foreground text-center">
        No hackathon participants are live right now. Check back later!
      </p>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {streamers.map((streamer) => (
        <StreamerCard key={streamer.profileId} streamer={streamer} />
      ))}
    </div>
  );
}
