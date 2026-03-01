import * as Sentry from "@sentry/nextjs";

// --- Types ---

export interface TwitchStream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  title: string;
  viewer_count: number;
  started_at: string;
  thumbnail_url: string;
  type: "live" | "";
}

export interface TwitchCategorySearchResult {
  id: string;
  name: string;
  box_art_url: string;
}

// --- Token cache ---

let cachedToken: { token: string; expiresAt: number } | null = null;

export function isTwitchConfigured(): boolean {
  return !!(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET);
}

export async function getAppAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET must be set");
  }

  const res = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Twitch OAuth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    // Expire 5 minutes early to avoid edge cases
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  };

  return cachedToken.token;
}

// --- Helpers ---

export function extractTwitchUsername(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("twitch.tv")) return null;
    // Handle paths like /username or /username/
    const parts = parsed.pathname.split("/").filter(Boolean);
    return parts[0]?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

// --- Helix API ---

async function helixFetch<T>(
  path: string,
  params: URLSearchParams
): Promise<T> {
  const token = await getAppAccessToken();
  const clientId = process.env.TWITCH_CLIENT_ID!;

  const url = `https://api.twitch.tv/helix${path}?${params.toString()}`;
  let res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Client-Id": clientId,
    },
  });

  // Token may have been revoked -- clear cache and retry once
  if (res.status === 401) {
    cachedToken = null;
    const freshToken = await getAppAccessToken();
    res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${freshToken}`,
        "Client-Id": clientId,
      },
    });
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Twitch Helix ${path} failed (${res.status}): ${text}`);
  }

  return res.json();
}

export async function getLiveStreams(
  userLogins: string[]
): Promise<TwitchStream[]> {
  if (userLogins.length === 0) return [];

  const allStreams: TwitchStream[] = [];

  // Twitch allows max 100 user_login params per request
  for (let i = 0; i < userLogins.length; i += 100) {
    const batch = userLogins.slice(i, i + 100);
    const params = new URLSearchParams();
    batch.forEach((login) => params.append("user_login", login));
    params.set("first", "100");

    try {
      const data = await helixFetch<{ data: TwitchStream[] }>(
        "/streams",
        params
      );
      allStreams.push(...data.data);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: "twitch", action: "getLiveStreams" },
        extra: { batchIndex: i, batchSize: batch.length },
      });
    }
  }

  return allStreams;
}

export async function searchCategories(
  query: string
): Promise<TwitchCategorySearchResult[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({ query, first: "20" });
  const data = await helixFetch<{ data: TwitchCategorySearchResult[] }>(
    "/search/categories",
    params
  );

  return data.data;
}
