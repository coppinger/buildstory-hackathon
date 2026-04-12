"use client";

import { useEffect, useState } from "react";

type Phase = "before" | "live" | "ended";

function getState(startDate: number, endDate: number) {
  const now = Date.now();

  let phase: Phase;
  let diff: number;

  if (now < startDate) {
    phase = "before";
    diff = startDate - now;
  } else if (now < endDate) {
    phase = "live";
    diff = endDate - now;
  } else {
    phase = "ended";
    diff = 0;
  }

  diff = Math.max(0, diff);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { phase, days, hours, minutes, seconds };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function DashboardCountdown({ startsAt, endsAt, compact = false }: { startsAt: number; endsAt: number; compact?: boolean }) {
  const [state, setState] = useState<ReturnType<typeof getState> | null>(null);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const tick = () => setState(getState(startsAt, endsAt));

    const stop = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const start = () => {
      if (intervalId !== null || document.hidden) return;
      tick();
      intervalId = setInterval(tick, 1000);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        stop();
        return;
      }
      start();
    };

    start();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [startsAt, endsAt]);

  if (state?.phase === "ended") {
    return (
      <p className="text-sm text-muted-foreground">Event has ended</p>
    );
  }

  const placeholder = [
    { value: "--", label: "days" },
    { value: "--", label: "hrs" },
    { value: "--", label: "min" },
    { value: "--", label: "sec" },
  ];

  const segments = state
    ? [
        { value: pad(state.days), label: "days" },
        { value: pad(state.hours), label: "hrs" },
        { value: pad(state.minutes), label: "min" },
        { value: pad(state.seconds), label: "sec" },
      ]
    : placeholder;

  return (
    <div className="flex flex-col gap-4">
      <div className={compact ? "flex items-center gap-2" : "flex items-center gap-1.5 sm:gap-3 md:gap-4"}>
        {segments.map((seg, i) => (
          <div key={seg.label} className={compact ? "flex items-center gap-2" : "flex items-center gap-1.5 sm:gap-3 md:gap-4"}>
            <div className="flex flex-col items-center">
              <span className={compact
                ? "font-mono text-2xl tabular-nums tracking-tight text-foreground"
                : "font-mono text-2xl sm:text-4xl lg:text-5xl tabular-nums tracking-tight text-foreground"
              }>
                {seg.value}
              </span>
              <span className={compact
                ? "text-[10px] uppercase tracking-widest text-muted-foreground/60 mt-0.5"
                : "text-[11px] uppercase tracking-widest text-muted-foreground/60 mt-1"
              }>
                {seg.label}
              </span>
            </div>
            {i < segments.length - 1 && (
              <span className={compact
                ? "text-lg text-muted-foreground/30 font-light -mt-3"
                : "text-xl sm:text-2xl md:text-3xl text-muted-foreground/30 font-light -mt-4"
              }>
                :
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
