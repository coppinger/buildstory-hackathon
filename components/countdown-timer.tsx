"use client";

import { useEffect, useState } from "react";

// March 1st, 12:00 PM PST (UTC-8) = 20:00 UTC
const START_DATE = new Date("2026-03-01T20:00:00Z").getTime();
// One week later exactly
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

export function CountdownTimer() {
  const [state, setState] = useState(getState);

  useEffect(() => {
    const interval = setInterval(() => setState(getState()), 1000);
    return () => clearInterval(interval);
  }, []);

  const segments = [
    { value: state.days, label: "days" },
    { value: state.hours, label: "hrs" },
    { value: state.minutes, label: "min" },
    { value: state.seconds, label: "sec" },
  ];

  const label =
    state.phase === "before"
      ? "Starts March 1st, 12 pm PST"
      : state.phase === "live"
        ? "Live now \u2014 ends March 8th, 12 pm PST"
        : "That\u2019s a wrap!";

  return (
    <div className="flex flex-col items-center gap-6">
      {state.phase !== "ended" && (
        <div className="flex items-center gap-3 sm:gap-4">
          {segments.map((seg, i) => (
            <div key={seg.label} className="flex items-center gap-3 sm:gap-4">
              <div className="flex flex-col items-center">
                <span className="font-mono text-4xl sm:text-5xl tabular-nums tracking-tight text-white">
                  {pad(seg.value)}
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
      )}
      <p className="text-xs uppercase tracking-[0.2em] text-white/40">
        {label}
      </p>
    </div>
  );
}
