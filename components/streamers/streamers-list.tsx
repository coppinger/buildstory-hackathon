"use client";

import { StreamerCard } from "./streamer-card";
import { useLiveStreamers } from "@/lib/streamers/use-live-streamers";

export function StreamersList() {
  const { streamers, loading, initialError } = useLiveStreamers();

  if (loading) {
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

  if (initialError) {
    return (
      <p className="mt-12 text-muted-foreground text-center">{initialError}</p>
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
