"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { eq, and, notInArray, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  events,
  eventSubmissions,
  hackathonReviews,
  hackathonReviewHighlights,
  profiles,
  projects,
  projectMembers,
} from "@/lib/db/schema";
import type { HighlightCategoryValue } from "@/lib/review-categories";
import { ensureProfile } from "@/lib/db/ensure-profile";
import { isReviewOpen } from "@/lib/events";
import { parseInput, submitReviewSchema } from "@/lib/db/validations";
import { isUniqueViolation } from "@/lib/db/errors";

export async function submitReview(
  eventId: string,
  projectId: string,
  input: { feedback: string; highlights: { category: string; text: string }[] }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Not authenticated" };

    const profile = await ensureProfile(userId);
    if (!profile) return { success: false, error: "Profile not found" };

    // Validate input
    const parsed = parseInput(submitReviewSchema, input);
    if (!parsed.success) return { success: false, error: parsed.error };
    const { feedback, highlights } = parsed.data;

    // Verify event exists and review is open
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    });
    if (!event) return { success: false, error: "Event not found" };
    if (!isReviewOpen(event)) {
      return { success: false, error: "Reviews are not currently open" };
    }

    // Run independent authorization checks in parallel
    const [reviewerSubmission, targetSubmission, project, membership] =
      await Promise.all([
        db.query.eventSubmissions.findFirst({
          where: and(
            eq(eventSubmissions.eventId, eventId),
            eq(eventSubmissions.profileId, profile.id)
          ),
          columns: { id: true },
        }),
        db.query.eventSubmissions.findFirst({
          where: and(
            eq(eventSubmissions.eventId, eventId),
            eq(eventSubmissions.projectId, projectId)
          ),
          columns: { id: true },
        }),
        db.query.projects.findFirst({
          where: eq(projects.id, projectId),
          columns: { profileId: true },
        }),
        db.query.projectMembers.findFirst({
          where: and(
            eq(projectMembers.projectId, projectId),
            eq(projectMembers.profileId, profile.id)
          ),
          columns: { id: true },
        }),
      ]);

    if (!reviewerSubmission) {
      return { success: false, error: "You must have a submission to review others" };
    }
    if (!targetSubmission) {
      return { success: false, error: "This project has no submission for this event" };
    }
    if (project?.profileId === profile.id) {
      return { success: false, error: "You cannot review your own project" };
    }
    if (membership) {
      return { success: false, error: "You cannot review a project you are a member of" };
    }

    // Insert review + highlights in a transaction
    await db.transaction(async (tx) => {
      const [review] = await tx
        .insert(hackathonReviews)
        .values({
          eventId,
          reviewerProfileId: profile.id,
          projectId,
          feedback,
        })
        .returning({ id: hackathonReviews.id });

      if (highlights.length > 0) {
        await tx.insert(hackathonReviewHighlights).values(
          highlights.map((h) => ({
            reviewId: review.id,
            category: h.category as HighlightCategoryValue,
            text: h.text,
          }))
        );
      }
    });

    revalidatePath(`/hackathons/${event.slug}`);
    revalidatePath(`/hackathons/${event.slug}/review`);

    return { success: true };
  } catch (error) {
    if (
      isUniqueViolation(
        error,
        "hackathon_reviews_reviewer_profile_id_project_id_event_id_unique"
      )
    ) {
      return { success: false, error: "You have already reviewed this project" };
    }
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "submitReview" },
      extra: { eventId, projectId },
    });
    return { success: false, error: "Something went wrong" };
  }
}

export async function getNextReviewableSubmission(
  eventId: string,
  skipProjectIds: string[]
): Promise<{
  submission: {
    id: string;
    whatBuilt: string;
    demoUrl: string | null;
    demoMediaUrl: string | null;
    demoMediaType: string | null;
    lessonLearned: string | null;
  };
  profile: {
    displayName: string;
    username: string | null;
    avatarUrl: string | null;
    country: string | null;
  };
  project: {
    id: string;
    name: string;
    slug: string | null;
    description: string | null;
    githubUrl: string | null;
    liveUrl: string | null;
  };
  tools: { id: string; name: string }[];
} | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const profile = await ensureProfile(userId);
    if (!profile) return null;

    // Run independent exclusion queries in parallel
    const [reviewedRows, ownedRows, memberRows] = await Promise.all([
      db
        .select({ projectId: hackathonReviews.projectId })
        .from(hackathonReviews)
        .where(
          and(
            eq(hackathonReviews.reviewerProfileId, profile.id),
            eq(hackathonReviews.eventId, eventId)
          )
        ),
      db
        .select({ projectId: eventSubmissions.projectId })
        .from(eventSubmissions)
        .innerJoin(projects, eq(eventSubmissions.projectId, projects.id))
        .where(
          and(
            eq(eventSubmissions.eventId, eventId),
            eq(projects.profileId, profile.id)
          )
        ),
      db
        .select({ projectId: projectMembers.projectId })
        .from(projectMembers)
        .innerJoin(
          eventSubmissions,
          and(
            eq(projectMembers.projectId, eventSubmissions.projectId),
            eq(eventSubmissions.eventId, eventId)
          )
        )
        .where(eq(projectMembers.profileId, profile.id)),
    ]);

    const excludeIds = [
      ...new Set([
        ...reviewedRows.map((r) => r.projectId),
        ...ownedRows.map((r) => r.projectId),
        ...memberRows.map((r) => r.projectId),
        ...skipProjectIds,
      ]),
    ];

    // Find a random eligible submission
    const notBannedOrHidden = and(
      isNull(profiles.bannedAt),
      isNull(profiles.hiddenAt)
    );

    let whereClause = and(
      eq(eventSubmissions.eventId, eventId),
      notBannedOrHidden
    );

    if (excludeIds.length > 0) {
      whereClause = and(
        whereClause,
        notInArray(eventSubmissions.projectId, excludeIds)
      );
    }

    const [candidate] = await db
      .select({ submissionId: eventSubmissions.id })
      .from(eventSubmissions)
      .innerJoin(profiles, eq(eventSubmissions.profileId, profiles.id))
      .where(whereClause)
      .orderBy(sql`RANDOM()`)
      .limit(1);

    if (!candidate) return null;

    // Hydrate the submission
    const submission = await db.query.eventSubmissions.findFirst({
      where: eq(eventSubmissions.id, candidate.submissionId),
      with: {
        profile: {
          columns: {
            displayName: true,
            username: true,
            avatarUrl: true,
            country: true,
          },
        },
        project: {
          columns: {
            id: true,
            name: true,
            slug: true,
            description: true,
            githubUrl: true,
            liveUrl: true,
          },
        },
        tools: {
          with: { tool: { columns: { id: true, name: true } } },
        },
      },
    });

    if (!submission) return null;

    return {
      submission: {
        id: submission.id,
        whatBuilt: submission.whatBuilt,
        demoUrl: submission.demoUrl,
        demoMediaUrl: submission.demoMediaUrl,
        demoMediaType: submission.demoMediaType,
        lessonLearned: submission.lessonLearned,
      },
      profile: submission.profile,
      project: submission.project,
      tools: submission.tools.map((t) => ({ id: t.tool.id, name: t.tool.name })),
    };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "getNextReviewableSubmission" },
      extra: { eventId },
    });
    return null;
  }
}
