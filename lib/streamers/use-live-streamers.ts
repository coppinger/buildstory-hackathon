"use client";

import { useSyncExternalStore } from "react";
import type { LiveStreamer } from "@/lib/streamers/types";

const POLL_INTERVAL_MS = 60_000;
const INITIAL_ERROR_MESSAGE = "Failed to load live streamers";

interface LiveStreamersSnapshot {
  streamers: LiveStreamer[];
  loading: boolean;
  initialError: string | null;
}

let snapshot: LiveStreamersSnapshot = {
  streamers: [],
  loading: true,
  initialError: null,
};

const subscribers = new Set<() => void>();
let pollIntervalId: ReturnType<typeof setInterval> | null = null;
let visibilityHandler: (() => void) | null = null;
let inFlight: Promise<void> | null = null;
let hasLoadedSuccessfully = false;

function notifySubscribers() {
  subscribers.forEach((subscriber) => subscriber());
}

function updateSnapshot(partial: Partial<LiveStreamersSnapshot>) {
  snapshot = { ...snapshot, ...partial };
  notifySubscribers();
}

async function fetchLiveStreamers() {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const response = await fetch("/api/streamers");
      if (!response.ok) throw new Error("Failed to fetch streamers");

      const data = await response.json();
      const streamers = Array.isArray(data.streamers) ? data.streamers : [];

      hasLoadedSuccessfully = true;
      updateSnapshot({
        streamers,
        loading: false,
        initialError: null,
      });
    } catch {
      if (!hasLoadedSuccessfully) {
        updateSnapshot({
          loading: false,
          initialError: INITIAL_ERROR_MESSAGE,
        });
        return;
      }

      // Preserve stale data after the initial successful load.
      updateSnapshot({ loading: false });
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

function startPollingIfNeeded() {
  if (pollIntervalId !== null) return;

  void fetchLiveStreamers();

  pollIntervalId = setInterval(() => {
    if (!document.hidden) {
      void fetchLiveStreamers();
    }
  }, POLL_INTERVAL_MS);

  visibilityHandler = () => {
    if (!document.hidden) {
      void fetchLiveStreamers();
    }
  };
  document.addEventListener("visibilitychange", visibilityHandler);
}

function stopPollingIfNeeded() {
  if (subscribers.size > 0) return;

  if (pollIntervalId !== null) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
  }

  if (visibilityHandler) {
    document.removeEventListener("visibilitychange", visibilityHandler);
    visibilityHandler = null;
  }
}

function subscribe(callback: () => void) {
  subscribers.add(callback);
  startPollingIfNeeded();

  return () => {
    subscribers.delete(callback);
    stopPollingIfNeeded();
  };
}

function getSnapshot() {
  return snapshot;
}

export function useLiveStreamers() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
