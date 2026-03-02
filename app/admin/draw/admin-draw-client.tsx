"use client";

import { useState, useTransition, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import {
  drawWinners,
  type DrawResult,
  type DrawWinner,
  type DrawHistoryEntry,
} from "./actions";
import { BlurFade } from "@/components/blur-fade";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { getInitials } from "@/lib/utils";

type Phase = "idle" | "drawing" | "revealing" | "revealed";

function fireConfetti() {
  const end = Date.now() + 1500;
  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ["#fbbf24", "#f59e0b", "#ffffff"],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ["#fbbf24", "#f59e0b", "#ffffff"],
    });
    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
}

function WinnerCard({ winner }: { winner: DrawWinner }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: [1, 1.08, 1] }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-card/50">
        <CardContent className="flex items-center gap-3 py-3 px-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-semibold text-sm">
            {getInitials(winner.displayName)}
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{winner.displayName}</p>
            <p className="text-sm text-muted-foreground truncate">
              @{winner.username}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SlotMachineText({
  allUsernames,
  winner,
  onDone,
}: {
  allUsernames: string[];
  winner: DrawWinner;
  onDone: () => void;
}) {
  const [displayName, setDisplayName] = useState(() => allUsernames[0]);
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    let interval = 50;
    let elapsed = 0;
    const totalDuration = 1800;
    let timeoutId: ReturnType<typeof setTimeout>;
    let doneTimeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      elapsed += interval;
      if (elapsed >= totalDuration) {
        setDisplayName(winner.username);
        setLanded(true);
        doneTimeoutId = setTimeout(onDone, 400);
        return;
      }
      setDisplayName(
        allUsernames[Math.floor(Math.random() * allUsernames.length)]
      );
      // Exponentially decelerate
      interval = Math.min(400, interval * 1.12);
      timeoutId = setTimeout(tick, interval);
    };

    timeoutId = setTimeout(tick, interval);
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(doneTimeoutId);
    };
  }, [allUsernames, winner.username, onDone]);

  return (
    <motion.div
      animate={landed ? { scale: [1, 1.08, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      <Card className={landed ? "bg-card/50 border-amber-500/30" : "bg-card/30"}>
        <CardContent className="flex items-center gap-3 py-3 px-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-semibold text-sm font-mono">
            {landed ? getInitials(winner.displayName) : "?"}
          </div>
          <div className="min-w-0">
            <p
              className={`font-mono truncate ${landed ? "font-medium text-foreground" : "text-muted-foreground"}`}
            >
              @{displayName}
            </p>
            {landed && (
              <p className="text-sm text-muted-foreground truncate">
                {winner.displayName}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function TransparencyPanel({
  result,
  collapsed: initialCollapsed,
}: {
  result: DrawResult;
  collapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed ?? false);
  const [copied, setCopied] = useState(false);

  const copySeed = () => {
    navigator.clipboard.writeText(result.seed);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-card/30 border-dashed">
      <CardHeader
        className="cursor-pointer py-3"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="verified" size="4" className="text-amber-400" />
            <CardTitle className="text-sm">Verification Details</CardTitle>
          </div>
          <Icon
            name={collapsed ? "expand_more" : "expand_less"}
            size="4"
            className="text-muted-foreground"
          />
        </div>
      </CardHeader>
      {!collapsed && (
        <CardContent className="space-y-3 pt-0">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Seed</span>
              <div className="flex items-center gap-1.5">
                <code className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                  {result.seed}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={copySeed}
                >
                  <Icon
                    name={copied ? "check" : "content_copy"}
                    size="3.5"
                  />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Drawn at</span>
              <span className="font-mono text-xs">
                {new Date(result.drawnAt).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Pool size</span>
              <span className="font-mono text-xs">
                {result.totalEligible}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Algorithm</span>
              <span className="font-mono text-xs">{result.algorithm}</span>
            </div>
          </div>
          <div className="border-t border-border pt-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>To verify:</strong> Sort all eligible usernames
              alphabetically. Initialize mulberry32 with{" "}
              <code className="bg-muted px-1 rounded">
                parseInt(seed.replace(/-/g, &apos;&apos;).slice(0, 8), 16)
              </code>
              . Run Fisher-Yates shuffle. First {result.winners.length} entries
              are the winners.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export function AdminDrawClient({
  initialHistory,
}: {
  initialHistory: DrawHistoryEntry[];
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [count, setCount] = useState(1);
  const [result, setResult] = useState<DrawResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealedCount, setRevealedCount] = useState(0);
  const [isPending, startTransition] = useTransition();
  const revealedRef = useRef(0);
  const [history, setHistory] = useState<DrawHistoryEntry[]>(initialHistory);

  const handleDraw = () => {
    setError(null);
    setPhase("drawing");

    startTransition(async () => {
      const res = await drawWinners(count);
      if (!res.success) {
        setError(res.error);
        setPhase("idle");
        return;
      }

      setResult(res.data);

      // Prepend to local history
      setHistory((prev) => [
        {
          id: res.data.seed,
          seed: res.data.seed,
          winners: res.data.winners,
          winnerCount: res.data.winners.length,
          totalEligible: res.data.totalEligible,
          algorithm: res.data.algorithm,
          drawnAt: res.data.drawnAt,
          drawnByName: "You",
        },
        ...prev,
      ]);

      // Brief delay for transparency panel to animate in
      await new Promise((r) => setTimeout(r, 1500));

      // If many winners, skip per-winner animation
      if (res.data.winners.length > 10) {
        setRevealedCount(res.data.winners.length);
        setPhase("revealed");
        fireConfetti();
        return;
      }

      revealedRef.current = 0;
      setRevealedCount(0);
      setPhase("revealing");
    });
  };

  const handleWinnerRevealed = useCallback(() => {
    revealedRef.current += 1;
    setRevealedCount(revealedRef.current);
    if (result && revealedRef.current >= result.winners.length) {
      setTimeout(() => {
        setPhase("revealed");
        fireConfetti();
      }, 400);
    }
  }, [result]);

  const handleReset = () => {
    setPhase("idle");
    setResult(null);
    setError(null);
    setRevealedCount(0);
    revealedRef.current = 0;
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-heading font-semibold tracking-tight">
          Prize Drawing
        </h1>
        <p className="text-muted-foreground mt-1">
          Randomly select winners from registered hackathon participants.
          Provably fair using a seeded PRNG.
        </p>
      </div>

      {/* Draw Controls */}
      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-end gap-3">
                  <div className="space-y-1.5 flex-1">
                    <label
                      htmlFor="winner-count"
                      className="text-sm font-medium"
                    >
                      Number of winners
                    </label>
                    <Input
                      id="winner-count"
                      type="number"
                      min={1}
                      value={count}
                      onChange={(e) =>
                        setCount(Math.max(1, parseInt(e.target.value) || 1))
                      }
                    />
                  </div>
                  <Button onClick={handleDraw} disabled={isPending}>
                    <Icon name="casino" size="4" />
                    Draw Winners
                  </Button>
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawing Phase — Transparency Panel */}
      {(phase === "drawing" || phase === "revealing" || phase === "revealed") &&
        result && (
          <BlurFade delay={0.1}>
            <div className="space-y-2 text-sm">
              <BlurFade delay={0.2}>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    Seed: {result.seed}
                  </Badge>
                </div>
              </BlurFade>
              <BlurFade delay={0.4}>
                <div className="flex gap-3">
                  <Badge variant="secondary" className="text-xs">
                    Pool: {result.totalEligible}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {result.algorithm}
                  </Badge>
                </div>
              </BlurFade>
            </div>
          </BlurFade>
        )}

      {/* Drawing spinner */}
      {phase === "drawing" && (
        <BlurFade delay={0.6}>
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
            <Icon name="progress_activity" size="5" className="animate-spin" />
            <span className="text-sm">Drawing winners...</span>
          </div>
        </BlurFade>
      )}

      {/* Revealing Phase — Slot Machine */}
      {phase === "revealing" && result && (
        <div className="space-y-3">
          {result.winners.map((winner, i) => (
            <div key={winner.username} className="relative">
              {i < revealedCount + 1 ? (
                i < revealedCount ? (
                  <WinnerCard winner={winner} />
                ) : (
                  <SlotMachineText
                    allUsernames={result.allUsernames}
                    winner={winner}
                    onDone={handleWinnerRevealed}
                  />
                )
              ) : (
                <Card className="bg-card/10 border-dashed">
                  <CardContent className="flex items-center gap-3 py-3 px-4">
                    <div className="h-10 w-10 rounded-full bg-muted/30" />
                    <div className="h-4 w-32 rounded bg-muted/30" />
                  </CardContent>
                </Card>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Revealed Phase — Final Results */}
      {phase === "revealed" && result && (
        <BlurFade delay={0.1}>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {result.winners.map((winner) => (
                <WinnerCard key={winner.username} winner={winner} />
              ))}
            </div>

            <TransparencyPanel result={result} collapsed />

            <div className="flex justify-center">
              <Button variant="outline" onClick={handleReset}>
                <Icon name="refresh" size="4" />
                Draw Again
              </Button>
            </div>
          </div>
        </BlurFade>
      )}

      {/* Previous Draws Log */}
      {history.length > 0 && (
        <div className="space-y-4 border-t border-border pt-6">
          <div>
            <h2 className="text-lg font-heading font-semibold tracking-tight">
              Previous Draws
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {history.length} draw{history.length !== 1 ? "s" : ""} on record
            </p>
          </div>
          <div className="space-y-3">
            {history.map((entry) => (
              <DrawHistoryCard key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DrawHistoryCard({ entry }: { entry: DrawHistoryEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="bg-card/30">
      <CardHeader
        className="cursor-pointer py-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
              <Icon name="casino" size="4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {entry.winnerCount} winner{entry.winnerCount !== 1 ? "s" : ""}{" "}
                <span className="text-muted-foreground font-normal">
                  drawn from {entry.totalEligible}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(entry.drawnAt).toLocaleString()} &middot;{" "}
                {entry.drawnByName}
              </p>
            </div>
          </div>
          <Icon
            name={expanded ? "expand_less" : "expand_more"}
            size="4"
            className="text-muted-foreground shrink-0"
          />
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-3 pt-0">
          <div className="grid gap-2 sm:grid-cols-2">
            {entry.winners.map((winner) => (
              <div
                key={winner.username}
                className="flex items-center gap-2 text-sm"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-semibold text-xs">
                  {getInitials(winner.displayName)}
                </div>
                <div className="min-w-0">
                  <span className="font-medium truncate block">
                    {winner.displayName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    @{winner.username}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border pt-3">
            <div className="flex justify-between">
              <span>Seed</span>
              <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">
                {entry.seed}
              </code>
            </div>
            <div className="flex justify-between">
              <span>Algorithm</span>
              <span className="font-mono">{entry.algorithm}</span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
