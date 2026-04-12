import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { ensureProfile } from "@/lib/db/ensure-profile";
import { eventRegistrations } from "@/lib/db/schema";
import { HackathonOnboarding } from "./hackathon-onboarding";
import { getLatestOpenEvent } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Register for Hackathon",
};

export default async function HackathonOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ dev?: string }>;
}) {
  const params = await searchParams;
  const devMode =
    process.env.NODE_ENV === "development" && params.dev === "true";
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const profile = await ensureProfile(userId);
  if (!profile) redirect("/sign-in");

  // Find the latest event with open registration
  const event = await getLatestOpenEvent();

  if (!event) {
    return (
      <div className="w-full max-w-lg mx-auto text-center py-12">
        <p className="text-neutral-400">
          No active hackathons right now. Check back soon!
        </p>
      </div>
    );
  }

  // Check if already registered — pass to client for redirect handling
  // (Server-side redirect here would fire on RSC re-render after
  // completeRegistration, hijacking the flow before it reaches step 1)
  const existingRegistration = await db.query.eventRegistrations.findFirst({
    where: and(
      eq(eventRegistrations.eventId, event.id),
      eq(eventRegistrations.profileId, profile.id)
    ),
  });

  return (
    <HackathonOnboarding
      eventId={event.id}
      eventStartsAt={event.startsAt?.getTime() ?? null}
      eventEndsAt={event.endsAt?.getTime() ?? null}
      initialDisplayName={profile.displayName}
      initialUsername={profile.username ?? ""}
      initialCountryCode={profile.country ?? ""}
      initialRegion={profile.region ?? ""}
      initialExperienceLevel={profile.experienceLevel}
      isAlreadyRegistered={devMode ? false : !!existingRegistration}
      devMode={devMode}
    />
  );
}
