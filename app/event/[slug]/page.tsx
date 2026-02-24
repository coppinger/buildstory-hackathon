import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { ensureProfile } from "@/lib/db/ensure-profile";
import {
  events,
  eventRegistrations,
  eventProjects,
  projects,
} from "@/lib/db/schema";
import { Header } from "@/components/header";
import { BlurFade } from "@/components/blur-fade";
import { EventDashboard } from "./event-dashboard";

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const event = await db.query.events.findFirst({
    where: eq(events.slug, slug),
  });
  if (!event) notFound();

  const { userId } = await auth();

  let registration = null;
  let enteredProjects: Awaited<ReturnType<typeof getEnteredProjects>> = [];
  let availableProjects: Awaited<ReturnType<typeof getAvailableProjects>> = [];

  if (userId) {
    const profile = await ensureProfile(userId);

    if (profile) {
      registration =
        (await db.query.eventRegistrations.findFirst({
          where: and(
            eq(eventRegistrations.eventId, event.id),
            eq(eventRegistrations.profileId, profile.id)
          ),
        })) ?? null;

      if (registration) {
        enteredProjects = await getEnteredProjects(event.id, profile.id);
        availableProjects = await getAvailableProjects(event.id, profile.id);
      }
    }
  }

  const dateOpts: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  };
  const startsFormatted = event.startsAt.toLocaleDateString("en-US", dateOpts);
  const endsFormatted = event.endsAt.toLocaleDateString("en-US", dateOpts);

  return (
    <div className="relative min-h-screen">
      <Header />

      {/* Event header */}
      <section className="px-6 pt-32 md:pt-40 pb-16 md:pb-20 border-b border-border">
        <div className="mx-auto max-w-8xl border-x border-border px-6 md:px-12 lg:px-24">
          <BlurFade delay={0.1}>
            <span className="text-xs uppercase tracking-[0.25em] text-buildstory-500">
              {event.status === "open"
                ? "Registration open"
                : event.status === "active"
                  ? "Live now"
                  : event.status}
            </span>
          </BlurFade>

          <BlurFade delay={0.2} blur="16px">
            <h1 className="mt-6 font-heading text-4xl md:text-6xl text-[#e8e4de]">
              {event.name}
            </h1>
          </BlurFade>

          <BlurFade delay={0.3}>
            <p className="mt-4 font-mono text-base text-neutral-500 max-w-2xl">
              {event.description}
            </p>
          </BlurFade>

          <BlurFade delay={0.4}>
            <div className="mt-6 flex items-center gap-6 text-sm text-neutral-500 font-mono">
              <span>
                {startsFormatted} &rarr; {endsFormatted}
              </span>
              {registration && (
                <span className="text-buildstory-500">Registered</span>
              )}
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Dashboard */}
      <section className="px-6 border-b border-border">
        <div className="mx-auto max-w-8xl border-x border-border px-6 md:px-12 lg:px-24 py-12 md:py-20">
          {userId ? (
            <BlurFade inView delay={0.1}>
              <EventDashboard
                event={event}
                registration={registration}
                enteredProjects={enteredProjects}
                availableProjects={availableProjects}
              />
            </BlurFade>
          ) : (
            <BlurFade inView delay={0.1}>
              <div className="border border-border p-6 md:p-8 text-center">
                <p className="font-heading text-2xl text-[#e8e4de]">
                  Sign in to participate
                </p>
                <p className="mt-2 text-neutral-500">
                  Create an account or sign in to register for this hackathon.
                </p>
                <div className="mt-6 flex items-center justify-center gap-4">
                  <Link
                    href="/sign-in"
                    className="inline-block border border-border bg-transparent font-mono text-sm text-[#e8e4de] px-8 py-3 hover:border-white/30 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/sign-up"
                    className="inline-block bg-buildstory-500 text-black font-mono text-sm px-8 py-3 hover:bg-white/90 transition-colors"
                  >
                    Sign up
                  </Link>
                </div>
              </div>
            </BlurFade>
          )}
        </div>
      </section>

      {/* Footer */}
      <section className="border-border border-x flex justify-between max-w-8xl mx-auto px-6 py-8">
        <p className="font-mono text-neutral-600">&copy; 2026 Buildstory</p>
        <p className="font-mono text-neutral-600">Show, don&apos;t tell.</p>
      </section>
    </div>
  );
}

async function getEnteredProjects(eventId: string, profileId: string) {
  // Query from the user's projects, then filter to those entered in this event
  const userProjects = await db.query.projects.findMany({
    where: eq(projects.profileId, profileId),
    with: {
      eventProjects: {
        where: eq(eventProjects.eventId, eventId),
      },
    },
  });

  return userProjects
    .filter((p) => p.eventProjects.length > 0)
    .map((p) => ({ ...p.eventProjects[0], project: p }));
}

async function getAvailableProjects(eventId: string, profileId: string) {
  // Get all user's projects with their event entries for this event
  const userProjects = await db.query.projects.findMany({
    where: eq(projects.profileId, profileId),
    with: {
      eventProjects: {
        where: eq(eventProjects.eventId, eventId),
      },
    },
  });

  // Return projects not yet entered in this event
  return userProjects.filter((p) => p.eventProjects.length === 0);
}
