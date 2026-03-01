import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import {
  profiles,
  eventRegistrations,
  events,
  twitchCategories,
} from "@/lib/db/schema";
import { eq, and, isNotNull, isNull } from "drizzle-orm";
import { HACKATHON_SLUG } from "@/lib/constants";
import {
  extractTwitchUsername,
  getLiveStreams,
  isTwitchConfigured,
} from "@/lib/twitch";

export interface LiveStreamer {
  profileId: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  twitchUsername: string;
  streamTitle: string;
  gameName: string;
  viewerCount: number;
  thumbnailUrl: string;
  startedAt: string;
}

// In-memory cache -- effective only within a single serverless instance lifetime.
// On Vercel, cold starts reset this. Acceptable since the Twitch API call is
// the fallback and responses are identical for all authenticated users.
let cachedResponse: { data: LiveStreamer[]; expiresAt: number } | null = null;
const CACHE_TTL_MS = 60_000; // 60 seconds

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Gracefully degrade when Twitch credentials are not configured
  if (!isTwitchConfigured()) {
    return NextResponse.json({ streamers: [] });
  }

  // Return cached data if fresh
  if (cachedResponse && Date.now() < cachedResponse.expiresAt) {
    return NextResponse.json({ streamers: cachedResponse.data });
  }

  try {
    // 1. Get hackathon event ID
    const event = await db.query.events.findFirst({
      where: eq(events.slug, HACKATHON_SLUG),
      columns: { id: true },
    });
    if (!event) {
      return NextResponse.json({ streamers: [] });
    }

    // 2. Get configured category IDs
    const categories = await db
      .select({ twitchId: twitchCategories.twitchId })
      .from(twitchCategories);

    if (categories.length === 0) {
      return NextResponse.json({ streamers: [] });
    }

    const allowedGameIds = new Set(categories.map((c) => c.twitchId));

    // 3. Get profiles with twitchUrl who are registered and visible
    const registeredProfiles = await db
      .select({
        id: profiles.id,
        displayName: profiles.displayName,
        username: profiles.username,
        avatarUrl: profiles.avatarUrl,
        twitchUrl: profiles.twitchUrl,
      })
      .from(profiles)
      .innerJoin(
        eventRegistrations,
        eq(profiles.id, eventRegistrations.profileId)
      )
      .where(
        and(
          eq(eventRegistrations.eventId, event.id),
          isNotNull(profiles.twitchUrl),
          isNull(profiles.bannedAt),
          isNull(profiles.hiddenAt)
        )
      );

    // 4. Extract Twitch usernames
    const profilesByLogin = new Map<
      string,
      (typeof registeredProfiles)[number]
    >();
    for (const profile of registeredProfiles) {
      const login = extractTwitchUsername(profile.twitchUrl!);
      if (login) {
        profilesByLogin.set(login, profile);
      }
    }

    if (profilesByLogin.size === 0) {
      cachedResponse = { data: [], expiresAt: Date.now() + CACHE_TTL_MS };
      return NextResponse.json({ streamers: [] });
    }

    // 5. Fetch live streams
    const streams = await getLiveStreams([...profilesByLogin.keys()]);

    // 6. Filter by configured categories and build response
    const streamers: LiveStreamer[] = [];
    for (const stream of streams) {
      if (!allowedGameIds.has(stream.game_id)) continue;

      const profile = profilesByLogin.get(stream.user_login.toLowerCase());
      if (!profile) continue;

      streamers.push({
        profileId: profile.id,
        displayName: profile.displayName,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
        twitchUsername: stream.user_login,
        streamTitle: stream.title,
        gameName: stream.game_name,
        viewerCount: stream.viewer_count,
        thumbnailUrl: stream.thumbnail_url
          .replace("{width}", "440")
          .replace("{height}", "248"),
        startedAt: stream.started_at,
      });
    }

    // Sort by viewer count descending
    streamers.sort((a, b) => b.viewerCount - a.viewerCount);

    // Cache
    cachedResponse = {
      data: streamers,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };

    return NextResponse.json({ streamers });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "api-route", action: "streamers" },
    });
    return NextResponse.json(
      { error: "Failed to fetch streamers" },
      { status: 500 }
    );
  }
}
