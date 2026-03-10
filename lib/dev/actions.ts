"use server";

import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { eq, or, ilike } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

const CONFIG_PATH = join(process.cwd(), ".dev-identity.json");
const PROFILE_COOKIE = "bs_profile";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SwapState {
  originalClerkId: string;
  parkedProfiles: Array<{
    profileId: string;
    originalClerkId: string;
  }>;
  activeTargetProfileId: string;
}

interface DevConfig {
  defaultProfileUsername?: string;
  swapState?: SwapState;
}

export interface DevIdentityState {
  currentProfile: {
    id: string;
    username: string | null;
    displayName: string;
    avatarUrl: string | null;
  } | null;
  isSwapped: boolean;
  defaultProfileUsername: string | null;
  clerkUserId: string;
}

// ---------------------------------------------------------------------------
// Guard — triple check
// ---------------------------------------------------------------------------

function isDev(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.VERCEL_ENV !== "production" &&
    (process.env.CLERK_SECRET_KEY?.startsWith("sk_test_") ?? false)
  );
}

// ---------------------------------------------------------------------------
// Config file I/O
// ---------------------------------------------------------------------------

async function readConfig(): Promise<DevConfig> {
  try {
    const raw = await readFile(CONFIG_PATH, "utf-8");
    return JSON.parse(raw) as DevConfig;
  } catch {
    return {};
  }
}

async function writeConfig(config: DevConfig): Promise<void> {
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function getDevIdentityState(): Promise<DevIdentityState | null> {
  if (!isDev()) return null;

  const { userId } = await auth();
  if (!userId) return null;

  const config = await readConfig();

  // Find the profile currently holding this clerk_id
  const currentProfile = await db.query.profiles.findFirst({
    where: eq(profiles.clerkId, userId),
    columns: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
    },
  });

  // Detect stale swap state: if swapState exists but the current profile
  // doesn't match the activeTargetProfileId, the DB was likely refreshed
  if (config.swapState && currentProfile) {
    if (config.swapState.activeTargetProfileId !== currentProfile.id) {
      // Stale state — clear it
      delete config.swapState;
      await writeConfig(config);
    }
  }

  return {
    currentProfile: currentProfile ?? null,
    isSwapped: !!config.swapState,
    defaultProfileUsername: config.defaultProfileUsername ?? null,
    clerkUserId: userId,
  };
}

export async function swapDevIdentity(
  targetProfileId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isDev()) return { success: false, error: "Not in dev mode" };

  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  // 1. Find source profile (holds current clerk_id)
  const sourceProfile = await db.query.profiles.findFirst({
    where: eq(profiles.clerkId, userId),
    columns: { id: true, clerkId: true },
  });

  // 2. Find target profile
  const targetProfile = await db.query.profiles.findFirst({
    where: eq(profiles.id, targetProfileId),
    columns: { id: true, clerkId: true },
  });

  if (!targetProfile) return { success: false, error: "Target profile not found" };

  // No-op if already on target
  if (sourceProfile?.id === targetProfileId) {
    return { success: true };
  }

  // 3. First, reset any existing swap so we start clean
  const config = await readConfig();
  if (config.swapState) {
    await restoreSwapState(config.swapState);
    delete config.swapState;
    // Re-read source after reset
    const refreshedSource = await db.query.profiles.findFirst({
      where: eq(profiles.clerkId, userId),
      columns: { id: true, clerkId: true },
    });
    if (!refreshedSource) return { success: false, error: "Source profile lost after reset" };

    // Re-read target after reset
    const refreshedTarget = await db.query.profiles.findFirst({
      where: eq(profiles.id, targetProfileId),
      columns: { id: true, clerkId: true },
    });
    if (!refreshedTarget) return { success: false, error: "Target profile not found after reset" };

    // If source IS the target after reset, we're done
    if (refreshedSource.id === targetProfileId) {
      await writeConfig(config);
      return { success: true };
    }

    return await performSwap(userId, refreshedSource, refreshedTarget, config);
  }

  if (!sourceProfile) return { success: false, error: "Source profile not found" };

  return await performSwap(userId, sourceProfile, targetProfile, config);
}

async function performSwap(
  clerkId: string,
  source: { id: string; clerkId: string },
  target: { id: string; clerkId: string },
  config: DevConfig
): Promise<{ success: boolean; error?: string }> {
  return db.transaction(async (tx) => {
    const parkedProfiles: SwapState["parkedProfiles"] = [];
    const parkedClerkId = `parked_${Date.now()}`;

    // Phase 1: Park source's clerk_id to free the unique slot
    await tx
      .update(profiles)
      .set({ clerkId: parkedClerkId })
      .where(eq(profiles.id, source.id));
    parkedProfiles.push({ profileId: source.id, originalClerkId: source.clerkId });

    // If target has a different clerk_id, park it too
    if (target.clerkId !== clerkId) {
      const targetParkedClerkId = `parked_${Date.now()}_target`;
      await tx
        .update(profiles)
        .set({ clerkId: targetParkedClerkId })
        .where(eq(profiles.id, target.id));
      parkedProfiles.push({ profileId: target.id, originalClerkId: target.clerkId });
    }

    // Phase 2: Assign our clerk_id to target
    await tx
      .update(profiles)
      .set({ clerkId })
      .where(eq(profiles.id, target.id));

    // Save swap state for recovery
    config.swapState = {
      originalClerkId: clerkId,
      parkedProfiles,
      activeTargetProfileId: target.id,
    };
    await writeConfig(config);

    // Delete bs_profile cookie so middleware re-resolves
    const cookieStore = await cookies();
    cookieStore.delete(PROFILE_COOKIE);

    return { success: true };
  });
}

async function restoreSwapState(swapState: SwapState): Promise<void> {
  await db.transaction(async (tx) => {
    // First, clear the clerk_id from the active target (free the unique slot)
    await tx
      .update(profiles)
      .set({ clerkId: `restoring_${Date.now()}` })
      .where(eq(profiles.id, swapState.activeTargetProfileId));

    // Restore all parked profiles to their original clerk_ids
    for (const parked of swapState.parkedProfiles) {
      await tx
        .update(profiles)
        .set({ clerkId: parked.originalClerkId })
        .where(eq(profiles.id, parked.profileId));
    }
  });
}

export async function resetDevIdentity(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!isDev()) return { success: false, error: "Not in dev mode" };

  const config = await readConfig();
  if (!config.swapState) return { success: true };

  await restoreSwapState(config.swapState);
  delete config.swapState;
  await writeConfig(config);

  // Delete bs_profile cookie so middleware re-resolves
  const cookieStore = await cookies();
  cookieStore.delete(PROFILE_COOKIE);

  return { success: true };
}

export async function setDevDefaultProfile(
  username: string
): Promise<{ success: boolean; error?: string }> {
  if (!isDev()) return { success: false, error: "Not in dev mode" };

  const config = await readConfig();
  config.defaultProfileUsername = username;
  await writeConfig(config);

  return { success: true };
}

export async function searchDevProfiles(query: string) {
  if (!isDev()) return [];
  if (query.length < 2) return [];

  const escaped = query.replace(/%/g, "\\%").replace(/_/g, "\\_");
  const pattern = `%${escaped}%`;

  const results = await db
    .select({
      id: profiles.id,
      displayName: profiles.displayName,
      username: profiles.username,
      avatarUrl: profiles.avatarUrl,
    })
    .from(profiles)
    .where(
      or(
        ilike(profiles.displayName, pattern),
        ilike(profiles.username, pattern)
      )
    )
    .limit(10);

  return results;
}
