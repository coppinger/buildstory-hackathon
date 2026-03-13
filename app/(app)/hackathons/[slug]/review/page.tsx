import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { eventSubmissions } from "@/lib/db/schema";
import { ensureProfile } from "@/lib/db/ensure-profile";
import {
  getEventBySlug,
  getUserReviewCount,
  getEventSubmissionCount,
  getReviewsForProject,
} from "@/lib/queries";
import { isReviewOpen } from "@/lib/events";
import { ReviewPageClient } from "@/components/reviews/review-page-client";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?redirect_url=/hackathons/${slug}/review`);

  const profile = await ensureProfile(userId);
  if (!profile) redirect(`/hackathons/${slug}`);

  // Check user has a submission for this event
  const userSubmission = await db.query.eventSubmissions.findFirst({
    where: and(
      eq(eventSubmissions.eventId, event.id),
      eq(eventSubmissions.profileId, profile.id)
    ),
    columns: { id: true, projectId: true },
  });

  if (!userSubmission) redirect(`/hackathons/${slug}`);

  const reviewOpen = isReviewOpen(event);

  // Fetch initial data in parallel
  const [reviewCount, totalSubmissions, receivedReviews] = await Promise.all([
    getUserReviewCount(profile.id, event.id),
    getEventSubmissionCount(event.id),
    getReviewsForProject(userSubmission.projectId, event.id),
  ]);

  return (
    <div className="p-6 md:p-8 lg:p-12 w-full max-w-4xl">
      <ReviewPageClient
        eventId={event.id}
        eventSlug={slug}
        reviewOpen={reviewOpen}
        initialReviewCount={reviewCount}
        totalSubmissions={totalSubmissions}
        receivedReviews={receivedReviews.map((r) => ({
          id: r.id,
          feedback: r.feedback,
          createdAt: r.createdAt.toISOString(),
          reviewer: {
            displayName: r.reviewer.displayName,
            username: r.reviewer.username,
            avatarUrl: r.reviewer.avatarUrl,
          },
          highlights: r.highlights.map((h) => ({
            category: h.category,
            text: h.text,
          })),
        }))}
      />
    </div>
  );
}
