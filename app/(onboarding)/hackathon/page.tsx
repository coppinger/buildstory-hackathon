import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { ensureProfile } from "@/lib/db/ensure-profile";
import { events, eventRegistrations } from "@/lib/db/schema";
import { HackathonOnboarding } from "./hackathon-onboarding";

const HACKATHON_SLUG = "hackathon-00";

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

  // Find the hackathon event
  const event = await db.query.events.findFirst({
    where: eq(events.slug, HACKATHON_SLUG),
  });

  if (!event) {
    return (
      <div className="w-full max-w-lg mx-auto text-center py-12">
        <p className="text-neutral-400">
          Hackathon 00 is not available yet. Check back soon!
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
