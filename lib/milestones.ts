import * as Sentry from "@sentry/nextjs";
import { getTotalSignups, getTotalProjects } from "@/lib/admin/queries";
import { sendDiscordWebhook } from "@/lib/discord";

const THRESHOLDS = [10, 25, 50, 75, 100, 150, 200, 250, 500, 1000];

export function checkSignupMilestone(eventId: string): void {
  void (async () => {
    try {
      const total = await getTotalSignups(eventId);
      if (THRESHOLDS.includes(total)) {
        sendDiscordWebhook(process.env.DISCORD_WEBHOOK_MILESTONES, {
          embeds: [
            {
              title: `Milestone: ${total} Signups!`,
              description: `Hackathon 00 has reached **${total}** registrations!`,
              color: 0xe8e4de,
              timestamp: new Date().toISOString(),
            },
          ],
        });
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: "milestones", action: "checkSignupMilestone" },
        extra: { eventId },
      });
    }
  })();
}

export function checkProjectMilestone(eventId: string): void {
  void (async () => {
    try {
      const total = await getTotalProjects(eventId);
      if (THRESHOLDS.includes(total)) {
        sendDiscordWebhook(process.env.DISCORD_WEBHOOK_MILESTONES, {
          embeds: [
            {
              title: `Milestone: ${total} Projects!`,
              description: `Hackathon 00 has reached **${total}** project submissions!`,
              color: 0xe8e4de,
              timestamp: new Date().toISOString(),
            },
          ],
        });
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: "milestones", action: "checkProjectMilestone" },
        extra: { eventId },
      });
    }
  })();
}
