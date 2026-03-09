"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import { eventRegistrations, events } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { ensureProfile } from "@/lib/db/ensure-profile";
import { isRegistrationOpen } from "@/lib/events";

export async function registerForHackathon(
  eventId: string,
  commitmentLevel: "all_in" | "daily" | "nights_weekends" | "not_sure",
  teamPreference: "solo" | "has_team" | "has_team_open" | "looking_for_team"
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Not authenticated" };

    const profile = await ensureProfile(userId);
    if (!profile) return { success: false, error: "Profile not found" };

    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    });
    if (!event) return { success: false, error: "Event not found" };

    if (!isRegistrationOpen(event)) {
      return { success: false, error: "Registration is closed for this event" };
    }

    // Check if already registered
    const existing = await db.query.eventRegistrations.findFirst({
      where: and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.profileId, profile.id)
      ),
    });
    if (existing) {
      return { success: false, error: "Already registered" };
    }

    await db.insert(eventRegistrations).values({
      eventId,
      profileId: profile.id,
      commitmentLevel,
      teamPreference,
    });

    revalidatePath("/dashboard");
    revalidatePath("/hackathons");
    revalidatePath(`/hackathons/${event.slug}`);

    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "registerForHackathon" },
      extra: { eventId },
    });
    return { success: false, error: "Something went wrong" };
  }
}
