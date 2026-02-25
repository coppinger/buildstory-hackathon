import * as Sentry from "@sentry/nextjs";

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  timestamp?: string;
}

interface DiscordPayload {
  content?: string;
  embeds?: DiscordEmbed[];
}

export function sendDiscordWebhook(
  webhookUrl: string | undefined,
  payload: DiscordPayload
): void {
  if (!webhookUrl) return;

  void fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch((error) => {
    Sentry.captureException(error, {
      tags: { component: "discord", action: "webhook" },
    });
  });
}

export function notifySignup(displayName: string) {
  sendDiscordWebhook(process.env.DISCORD_WEBHOOK_SIGNUPS, {
    embeds: [
      {
        title: "New Signup",
        description: `**${displayName}** registered for Hackathon 00`,
        color: 0xc4a35a,
        timestamp: new Date().toISOString(),
      },
    ],
  });
}

export function notifyProject(displayName: string, projectName: string) {
  sendDiscordWebhook(process.env.DISCORD_WEBHOOK_SIGNUPS, {
    embeds: [
      {
        title: "New Project",
        description: `**${displayName}** submitted **${projectName}**`,
        color: 0x5a8f7a,
        timestamp: new Date().toISOString(),
      },
    ],
  });
}
