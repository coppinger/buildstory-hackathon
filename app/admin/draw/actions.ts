"use server";

import { auth } from "@clerk/nextjs/server";
import { eq, and, isNull, isNotNull, desc } from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import {
  events,
  eventRegistrations,
  profiles,
  prizeDraws,
} from "@/lib/db/schema";
import { isAdmin } from "@/lib/admin";
import { ensureProfile } from "@/lib/db/ensure-profile";
import { HACKATHON_SLUG } from "@/lib/constants";

export interface DrawWinner {
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface DrawResult {
  seed: string;
  totalEligible: number;
  winners: DrawWinner[];
  allUsernames: string[];
  drawnAt: string;
  algorithm: string;
}

type ActionResult =
  | { success: true; data: DrawResult }
  | { success: false; error: string };

/**
 * mulberry32: a simple, deterministic 32-bit PRNG.
 * Returns a function that produces numbers in [0, 1) on each call.
 */
function mulberry32(seed: number) {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fisher-Yates shuffle using a seeded PRNG for reproducibility.
 */
function seededShuffle<T>(array: T[], rng: () => number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function drawWinners(count: number): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId || !(await isAdmin(userId))) {
      return { success: false, error: "Unauthorized" };
    }

    if (!Number.isInteger(count) || count < 1) {
      return { success: false, error: "Count must be a positive integer" };
    }

    // Get hackathon event ID
    const event = await db.query.events.findFirst({
      where: eq(events.slug, HACKATHON_SLUG),
      columns: { id: true },
    });
    if (!event) {
      return { success: false, error: "Hackathon event not found" };
    }

    // Query eligible profiles: registered, not banned/hidden, has username
    const eligible = await db
      .select({
        username: profiles.username,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
      })
      .from(eventRegistrations)
      .innerJoin(profiles, eq(eventRegistrations.profileId, profiles.id))
      .where(
        and(
          eq(eventRegistrations.eventId, event.id),
          isNull(profiles.bannedAt),
          isNull(profiles.hiddenAt),
          isNotNull(profiles.username)
        )
      );

    if (count > eligible.length) {
      return {
        success: false,
        error: `Requested ${count} winners but only ${eligible.length} eligible participants`,
      };
    }

    // Sort eligible list in JavaScript to ensure consistent ordering for verification.
    // Uses UTF-16 code point comparison for cross-environment reproducibility.
    eligible.sort((a, b) => (a.username! < b.username! ? -1 : a.username! > b.username! ? 1 : 0));

    // Generate cryptographic seed
    const seed = crypto.randomUUID();

    // Convert UUID to numeric seed: first 8 hex chars → integer
    const numericSeed = parseInt(seed.replace(/-/g, "").slice(0, 8), 16);
    const rng = mulberry32(numericSeed);

    // Seeded Fisher-Yates shuffle, take first N
    const shuffled = seededShuffle(eligible, rng);
    const winners = shuffled.slice(0, count).map((w) => ({
      username: w.username!,
      displayName: w.displayName,
      avatarUrl: w.avatarUrl,
    }));

    const allUsernames = eligible.map((e) => e.username!);
    const drawnAt = new Date();
    const algorithmName = "mulberry32 + Fisher-Yates shuffle";

    // Persist the draw result — ensureProfile guarantees row exists
    // (handles super-admins who may not have a profile yet)
    const profile = await ensureProfile(userId);
    if (!profile) {
      return { success: false, error: "Could not resolve admin profile" };
    }

    await db.insert(prizeDraws).values({
      seed,
      winners: winners,
      winnerCount: count,
      totalEligible: eligible.length,
      algorithm: algorithmName,
      drawnBy: profile.id,
      drawnAt,
    });

    return {
      success: true,
      data: {
        seed,
        totalEligible: eligible.length,
        winners,
        allUsernames,
        drawnAt: drawnAt.toISOString(),
        algorithm: algorithmName,
      },
    };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "drawWinners" },
      extra: { count },
    });
    return { success: false, error: "Failed to draw winners" };
  }
}

export interface DrawHistoryEntry {
  id: string;
  seed: string;
  winners: DrawWinner[];
  winnerCount: number;
  totalEligible: number;
  algorithm: string;
  drawnAt: string;
  drawnByName: string;
}

export async function getDrawHistory(): Promise<DrawHistoryEntry[]> {
  try {
    const { userId } = await auth();
    if (!userId || !(await isAdmin(userId))) {
      return [];
    }

    const rows = await db
      .select({
        id: prizeDraws.id,
        seed: prizeDraws.seed,
        winners: prizeDraws.winners,
        winnerCount: prizeDraws.winnerCount,
        totalEligible: prizeDraws.totalEligible,
        algorithm: prizeDraws.algorithm,
        drawnAt: prizeDraws.drawnAt,
        drawnByName: profiles.displayName,
      })
      .from(prizeDraws)
      .innerJoin(profiles, eq(prizeDraws.drawnBy, profiles.id))
      .orderBy(desc(prizeDraws.drawnAt))
      .limit(50);

    return rows.map((row) => ({
      ...row,
      winners: row.winners as DrawWinner[],
      drawnAt: row.drawnAt.toISOString(),
    }));
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "getDrawHistory" },
    });
    return [];
  }
}
