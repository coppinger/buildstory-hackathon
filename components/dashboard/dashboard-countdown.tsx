"use client";

import { useEffect, useState } from "react";

const START_DATE = new Date("2026-03-01T20:00:00Z").getTime();
const END_DATE = new Date("2026-03-08T20:00:00Z").getTime();

type Phase = "before" | "live" | "ended";

function getState() {
  const now = Date.now();

  let phase: Phase;
  let diff: number;

  if (now < START_DATE) {
    phase = "before";
    diff = START_DATE - now;
  } else if (now < END_DATE) {
    phase = "live";
    diff = END_DATE - now;
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

export function DashboardCountdown({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<ReturnType<typeof getState> | null>(null);

  useEffect(() => {
    const tick = () => setState(getState());
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

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
      <div className={compact ? "flex items-center gap-2" : "flex items-center gap-3 sm:gap-4"}>
        {segments.map((seg, i) => (
          <div key={seg.label} className={compact ? "flex items-center gap-2" : "flex items-center gap-3 sm:gap-4"}>
            <div className="flex flex-col items-center">
              <span className={compact
                ? "font-mono text-2xl tabular-nums tracking-tight text-foreground"
                : "font-mono text-4xl sm:text-5xl tabular-nums tracking-tight text-foreground"
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
                : "text-2xl sm:text-3xl text-muted-foreground/30 font-light -mt-4"
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
