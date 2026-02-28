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

function sanitizeForDiscord(text: string): string {
  return text.replace(/[@*_~`|>]/g, "");
}

export function notifyMentorApplication(name: string, types: string[]) {
  const safeName = sanitizeForDiscord(name);
  sendDiscordWebhook(process.env.DISCORD_WEBHOOK_SIGNUPS, {
    embeds: [
      {
        title: "New Mentor Application",
        description: `**${safeName}** applied to mentor`,
        color: 0x7c3aed,
        fields: [
          {
            name: "Types",
            value: types.join(", "),
            inline: true,
          },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  });
}

export function notifySponsorInquiry(
  companyName: string,
  contactName: string
) {
  const safeCompany = sanitizeForDiscord(companyName);
  const safeContact = sanitizeForDiscord(contactName);
  sendDiscordWebhook(process.env.DISCORD_WEBHOOK_TEAM_CHAT, {
    embeds: [
      {
        title: "New Sponsorship Inquiry",
        description: `**${safeCompany}** submitted a sponsorship inquiry`,
        color: 0xc4a35a,
        fields: [
          {
            name: "Contact",
            value: safeContact,
            inline: true,
          },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  });
}
