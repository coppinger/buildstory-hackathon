"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

const CONFETTI_COLORS = ["#fbbf24", "#f59e0b", "#ffffff"];

export function fireConfetti() {
  const end = Date.now() + 1500;
  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: CONFETTI_COLORS,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: CONFETTI_COLORS,
    });
    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
}

export function Confetti() {
  useEffect(() => {
    fireConfetti();
  }, []);

  return null;
}
