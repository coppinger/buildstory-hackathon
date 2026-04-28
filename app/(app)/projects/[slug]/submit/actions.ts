"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import {
  events,
  eventSubmissions,
  eventSubmissionTools,
  aiTools,
  profiles,
  projects,
  eventProjects,
  projectMembers,
} from "@/lib/db/schema";
import type { AiTool } from "@/lib/db/schema";
import { eq, and, or } from "drizzle-orm";
import { ensureProfile } from "@/lib/db/ensure-profile";
import { submitProjectSchema, parseInput } from "@/lib/db/validations";
import { isSubmissionOpen } from "@/lib/events";
import { notifySubmission } from "@/lib/discord";
import { checkSubmissionMilestone } from "@/lib/milestones";

interface SubmitInput {
  projectId: string;
  eventId: string;
  whatBuilt: string;
  demoUrl: string | null;
  demoMediaUrl: string | null;
  demoMediaType: "image" | "video" | null;
  repoUrl: string | null;
  lessonLearned: string | null;
  toolIds: string[];
  country?: string | null;
  region?: string | null;
}

export async function submitProject(
  input: SubmitInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Not authenticated" };

    const profile = await ensureProfile(userId);
    if (!profile) return { success: false, error: "Profile not found" };

    // Validate input
    const { projectId, eventId, ...validationInput } = input;
    const parsed = parseInput(submitProjectSchema, validationInput);
    if (!parsed.success) return parsed;

    // Fetch project, event, and event link in parallel
    const [project, event, eventProject] = await Promise.all([
      db.query.projects.findFirst({
        where: eq(projects.id, projectId),
      }),
      db.query.events.findFirst({
        where: eq(events.id, eventId),
      }),
      db.query.eventProjects.findFirst({
        where: and(
          eq(eventProjects.projectId, projectId),
          eq(eventProjects.eventId, eventId)
        ),
      }),
    ]);
    if (!project) return { success: false, error: "Project not found" };
    if (!event) return { success: false, error: "Event not found" };

    // Deadline check
    if (!isSubmissionOpen(event)) {
      return { success: false, error: "Submission deadline has passed" };
    }

    // Ownership or membership check
    const isOwner = project.profileId === profile.id;
    if (!isOwner) {
      const membership = await db.query.projectMembers.findFirst({
        where: and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.profileId, profile.id)
        ),
      });
      if (!membership) {
        return { success: false, error: "You don't have access to this project" };
      }
    }

    const data = parsed.data;

    // Upsert submission and replace tools in a transaction. Also lazily
    // create the event<->project link if it doesn't exist yet — some projects
    // were created without being linked to the event, and gating submission
    // on a pre-existing link blocked those owners from submitting.
    const submission = await db.transaction(async (tx) => {
      if (!eventProject) {
        await tx
          .insert(eventProjects)
          .values({ eventId, projectId })
          .onConflictDoNothing();
      }

      const [sub] = await tx
        .insert(eventSubmissions)
        .values({
          eventId,
          projectId,
          profileId: profile.id,
          whatBuilt: data.whatBuilt,
          demoUrl: data.demoUrl,
          demoMediaUrl: data.demoMediaUrl,
          demoMediaType: data.demoMediaType,
          repoUrl: data.repoUrl,
          lessonLearned: data.lessonLearned,
        })
        .onConflictDoUpdate({
          target: [eventSubmissions.eventId, eventSubmissions.projectId],
          set: {
            profileId: profile.id,
            whatBuilt: data.whatBuilt,
            demoUrl: data.demoUrl,
            demoMediaUrl: data.demoMediaUrl,
            demoMediaType: data.demoMediaType,
            repoUrl: data.repoUrl,
            lessonLearned: data.lessonLearned,
            updatedAt: new Date(),
          },
        })
        .returning({ id: eventSubmissions.id });

      // Replace tools: delete existing, re-insert
      await tx
        .delete(eventSubmissionTools)
        .where(eq(eventSubmissionTools.submissionId, sub.id));

      if (data.toolIds.length > 0) {
        await tx.insert(eventSubmissionTools).values(
          data.toolIds.map((toolId) => ({
            submissionId: sub.id,
            toolId,
          }))
        );
      }

      return sub;
    });

    // Update profile location if provided and profile has none
    if (data.country && !profile.country) {
      await db
        .update(profiles)
        .set({
          country: data.country,
          region: data.region ?? null,
        })
        .where(eq(profiles.id, profile.id));
    }

    // Fire-and-forget notifications
    notifySubmission(profile.displayName, project.name);
    checkSubmissionMilestone(eventId);

    revalidatePath("/dashboard");
    revalidatePath(`/projects/${project.slug}`);
    revalidatePath("/hackathons");

    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "submitProject" },
    });
    return { success: false, error: "Something went wrong" };
  }
}

export async function addCustomTool(
  name: string
): Promise<{
  success: boolean;
  data?: AiTool;
  error?: string;
}> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Not authenticated" };

    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 100) {
      return { success: false, error: "Invalid tool name" };
    }

    const slug = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Try to insert, if conflict fetch existing
    const [inserted] = await db
      .insert(aiTools)
      .values({ name: trimmed, slug, category: "Other" })
      .onConflictDoNothing({ target: aiTools.slug })
      .returning();

    if (inserted) {
      return { success: true, data: inserted };
    }

    // Conflict — fetch existing by slug
    const existing = await db.query.aiTools.findFirst({
      where: or(eq(aiTools.slug, slug), eq(aiTools.name, trimmed)),
    });

    if (existing) {
      return { success: true, data: existing };
    }

    return { success: false, error: "Failed to add tool" };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "addCustomTool" },
    });
    return { success: false, error: "Something went wrong" };
  }
}
