export const HACKATHON_SLUG = "hackathon-00";
export const USERNAME_REGEX = /^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$/;
export const SLUG_REGEX = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;
export const DISCORD_INVITE_URL = "https://discord.gg/buildstory";
export const X_URL = "https://x.com/buildstorycom";
export const TWITCH_URL = "https://twitch.tv/thecoppinger";
export const VOLUNTEER_URL = "#"; // TODO: replace with real URL
export const SPONSOR_URL = "/support-us";
export const SPONSOR_CREDITS_URL = "#"; // TODO: replace with real URL
export const DOCS_URL = "#"; // TODO: replace with real URL

export const POST_BODY_MAX_LENGTH = 280;

export const REACTION_EMOJIS = [
  { key: "fire", label: "Fire", emoji: "\u{1F525}" },
  { key: "rocket", label: "Shipped", emoji: "\u{1F680}" },
  { key: "lightbulb", label: "Insightful", emoji: "\u{1F4A1}" },
  { key: "clap", label: "Props", emoji: "\u{1F44F}" },
  { key: "wrench", label: "Building", emoji: "\u{1F6E0}\uFE0F" },
] as const;
