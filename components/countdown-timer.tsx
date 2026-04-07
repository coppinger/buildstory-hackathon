"use client";

import { useEffect, useState } from "react";

type Phase = "before" | "live" | "ended";

export interface CountdownState {
  phase: Phase;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Pure function — given a current timestamp and event boundaries, compute
 * the countdown state. Exported for unit testing.
 */
export function computeCountdownState(
  now: number,
  startsAt: number,
  endsAt: number,
): CountdownState {
  let phase: Phase;
  let diff: number;

  if (now < startsAt) {
    phase = "before";
    diff = startsAt - now;
  } else if (now < endsAt) {
    phase = "live";
    diff = endsAt - now;
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

const dateLabelFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  timeZone: "America/Los_Angeles",
});

function formatLabel(state: CountdownState, startsAt: number, endsAt: number): string {
  if (state.phase === "before") {
    return `Starts ${dateLabelFormatter.format(new Date(startsAt))}, 12 pm PST`;
  }
  return `Live now — ends ${dateLabelFormatter.format(new Date(endsAt))}, 12 pm PST`;
}

export interface CountdownTimerProps {
  startsAt: string;
  endsAt: string;
}

export function CountdownTimer({ startsAt, endsAt }: CountdownTimerProps) {
  const startMs = new Date(startsAt).getTime();
  const endMs = new Date(endsAt).getTime();

  // Derive initial state during render so SSR and first client paint agree
  // (no `--` placeholder flicker). The effect ticks every second after mount.
  const [state, setState] = useState<CountdownState>(() =>
    computeCountdownState(Date.now(), startMs, endMs),
  );

  useEffect(() => {
    const tick = () => setState(computeCountdownState(Date.now(), startMs, endMs));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startMs, endMs]);

  if (state.phase === "ended") return null;

  const segments = [
    { value: pad(state.days), label: "days" },
    { value: pad(state.hours), label: "hrs" },
    { value: pad(state.minutes), label: "min" },
    { value: pad(state.seconds), label: "sec" },
  ];

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-3 sm:gap-4">
        {segments.map((seg, i) => (
          <div key={seg.label} className="flex items-center gap-3 sm:gap-4">
            <div className="flex flex-col items-center">
              <span className="font-mono text-4xl sm:text-5xl tabular-nums tracking-tight text-white">
                {seg.value}
              </span>
              <span className="text-[11px] uppercase tracking-widest text-white/40 mt-1">
                {seg.label}
              </span>
            </div>
            {i < segments.length - 1 && (
              <span className="text-2xl sm:text-3xl text-white/20 font-light -mt-4">
                :
              </span>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs uppercase tracking-[0.2em] text-white/40">
        {formatLabel(state, startMs, endMs)}
      </p>
    </div>
  );
}
