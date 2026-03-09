import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { eventRegistrations, profiles } from "@/lib/db/schema";
import { getEventBySlug, getPublicStats, getEventSubmissions } from "@/lib/queries";
import {
  getComputedEventState,
  isRegistrationOpen,
} from "@/lib/events";
import { ensureProfile } from "@/lib/db/ensure-profile";
import { HackathonDetailHeader } from "@/components/hackathons/hackathon-detail-header";
import { HackathonRegister } from "@/components/hackathons/hackathon-register";
import { SubmissionsGallery } from "@/components/hackathons/submissions-gallery";
import { ogMeta, notFoundMeta } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return notFoundMeta;
  return ogMeta(event.name, event.description);
}

export default async function HackathonDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const state = getComputedEventState(event);
  const showSubmissions = state === "active" || state === "judging" || state === "complete";

  const [stats, { userId }, submissions] = await Promise.all([
    getPublicStats(event.id),
    auth(),
    showSubmissions ? getEventSubmissions(event.id, page) : Promise.resolve(null),
  ]);

  // Auth state for registration
  let isLoggedIn = false;
  let hasProfile = false;
  let isRegistered = false;

  if (userId) {
    isLoggedIn = true;
    const profile = await ensureProfile(userId);
    if (profile) {
      hasProfile = true;
      const reg = await db.query.eventRegistrations.findFirst({
        where: and(
          eq(eventRegistrations.eventId, event.id),
          eq(eventRegistrations.profileId, profile.id)
        ),
      });
      isRegistered = !!reg;
    }
  }

  return (
    <div className="p-6 md:p-8 lg:p-12 w-full max-w-5xl">
      <Link
        href="/hackathons"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors font-mono"
      >
        &larr; All hackathons
      </Link>

      <div className="mt-6">
        <HackathonDetailHeader
          name={event.name}
          description={event.description}
          startsAt={event.startsAt}
          endsAt={event.endsAt}
          state={state}
          participantCount={stats.signups}
          projectCount={stats.projectCount}
          submissionCount={stats.submissionCount}
        />
      </div>

      {/* Registration CTA */}
      {isRegistrationOpen(event) && (
        <div className="mt-8">
          <HackathonRegister
            eventId={event.id}
            isLoggedIn={isLoggedIn}
            hasProfile={hasProfile}
            isRegistered={isRegistered}
          />
        </div>
      )}

      {/* Judging banner */}
      {state === "judging" && (
        <div className="mt-8 border border-border p-4">
          <p className="text-sm font-medium text-foreground">
            Judging in progress
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Submissions are being reviewed. Results coming soon.
          </p>
        </div>
      )}

      {/* Submissions gallery */}
      {submissions && (
        <div className="mt-8">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono mb-4">
            Submissions
          </p>
          <SubmissionsGallery
            items={submissions.items}
            totalCount={submissions.totalCount}
            page={submissions.page}
            totalPages={submissions.totalPages}
            basePath={`/hackathons/${slug}`}
          />
        </div>
      )}
    </div>
  );
}
