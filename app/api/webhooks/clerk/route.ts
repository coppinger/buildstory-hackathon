import { type NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { eq } from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { deleteProfileCascade } from "@/lib/db/delete-profile";

export async function POST(request: NextRequest) {
  try {
    const evt = await verifyWebhook(request);

    if (evt.type === "user.deleted") {
      const clerkId = evt.data.id;
      if (!clerkId) {
        return new Response("No user ID in event", { status: 200 });
      }

      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.clerkId, clerkId),
        columns: { id: true },
      });

      if (!profile) {
        // No profile to clean up — user may never have completed onboarding
        return new Response("No profile found", { status: 200 });
      }

      await deleteProfileCascade(profile.id);

      Sentry.captureMessage("Clerk user.deleted webhook: profile cascade-deleted", {
        level: "info",
        tags: { component: "webhook", event: "user.deleted" },
        extra: { clerkId, profileId: profile.id },
      });
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "webhook", event: "clerk" },
    });
    return new Response("Webhook error", { status: 400 });
  }
}
