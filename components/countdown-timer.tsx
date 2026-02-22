"use client";

import { useEffect, useState } from "react";

const TARGET_DATE = new Date("2025-03-01T00:00:00Z").getTime();

function getTimeLeft() {
  const now = Date.now();
  const diff = Math.max(0, TARGET_DATE - now);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function CountdownTimer() {
  const [time, setTime] = useState(getTimeLeft);

  useEffect(() => {
    const interval = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, []);

  const segments = [
    { value: time.days, label: "days" },
    { value: time.hours, label: "hrs" },
    { value: time.minutes, label: "min" },
    { value: time.seconds, label: "sec" },
  ];

  return (
    <div className="flex flex-col items-center gap-6">
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
      <p className="text-xs uppercase tracking-[0.2em] text-white/40">
        March 1st &rarr; March 7th
      </p>
    </div>
  );
}
