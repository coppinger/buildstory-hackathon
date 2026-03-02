"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { NeonDbError } from "@neondatabase/serverless";
import { db } from "@/lib/db";
import { ensureProfile } from "@/lib/db/ensure-profile";
import { projects, events, eventProjects, projectMembers, teamInvites } from "@/lib/db/schema";
import {
  tooLong,
  MAX_PROJECT_NAME,
  MAX_PROJECT_SLUG,
  MAX_PROJECT_DESCRIPTION,
  MAX_GOAL_TEXT,
  MAX_URL,
} from "@/lib/validation";

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

async function getProfileId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const profile = await ensureProfile(userId);
  if (!profile) throw new Error("Profile creation failed");

  return profile.id;
}

function validateUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

function isUniqueViolation(error: unknown, constraintName: string): boolean {
  const cause =
    error instanceof Error && error.cause instanceof NeonDbError
      ? error.cause
      : error instanceof NeonDbError
        ? error
        : null;
  return cause?.code === "23505" && cause?.constraint === constraintName;
}

export async function createProject(data: {
  name: string;
  slug: string;
  description: string;
  startingPoint: "new" | "existing";
  goalText: string;
  repoUrl: string;
  liveUrl: string;
  eventId?: string;
}): Promise<ActionResult<{ slug: string | null }>> {
  try {
    const profileId = await getProfileId();

    if (!data.name.trim()) {
      return { success: false, error: "Project name is required" };
    }
    if (tooLong(data.name, MAX_PROJECT_NAME)) {
      return { success: false, error: `Project name must be ${MAX_PROJECT_NAME} characters or less` };
    }
    if (!data.description.trim()) {
      return { success: false, error: "Description is required" };
    }
    if (tooLong(data.description, MAX_PROJECT_DESCRIPTION)) {
      return { success: false, error: `Description must be ${MAX_PROJECT_DESCRIPTION} characters or less` };
    }
    if (tooLong(data.slug, MAX_PROJECT_SLUG)) {
      return { success: false, error: `Project URL slug must be ${MAX_PROJECT_SLUG} characters or less` };
    }
    if (tooLong(data.goalText, MAX_GOAL_TEXT)) {
      return { success: false, error: `Goal must be ${MAX_GOAL_TEXT} characters or less` };
    }
    if (tooLong(data.repoUrl, MAX_URL)) {
      return { success: false, error: `Repository URL is too long` };
    }
    if (tooLong(data.liveUrl, MAX_URL)) {
      return { success: false, error: `Live URL is too long` };
    }

    const trimmedSlug = data.slug.trim().toLowerCase();
    const githubUrl = validateUrl(data.repoUrl);
    const liveUrl = validateUrl(data.liveUrl);

    const [project] = await db
      .insert(projects)
      .values({
        profileId,
        name: data.name.trim(),
        slug: trimmedSlug || null,
        description: data.description.trim(),
        startingPoint: data.startingPoint,
        goalText: data.goalText.trim() || null,
        githubUrl,
        liveUrl,
      })
      .returning();

    // Optionally link to event — validate server-side that event exists and is open
    if (data.eventId) {
      const event = await db.query.events.findFirst({
        where: eq(events.id, data.eventId),
        columns: { id: true, status: true },
      });
      if (event && (event.status === "open" || event.status === "active")) {
        await db
          .insert(eventProjects)
          .values({ eventId: event.id, projectId: project.id })
          .onConflictDoNothing();
      }
    }

    revalidatePath("/projects");
    return { success: true, data: { slug: project.slug } };
  } catch (error) {
    if (isUniqueViolation(error, "projects_slug_unique")) {
      return { success: false, error: "Project URL is already taken" };
    }
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "createProject" },
      extra: { projectName: data.name },
    });
    return { success: false, error: "Failed to create project" };
  }
}

export async function updateProject(data: {
  projectId: string;
  name: string;
  slug: string;
  description: string;
  startingPoint: "new" | "existing";
  goalText: string;
  repoUrl: string;
  liveUrl: string;
}): Promise<ActionResult<{ slug: string | null }>> {
  try {
    const profileId = await getProfileId();

    // Verify ownership
    const existing = await db.query.projects.findFirst({
      where: eq(projects.id, data.projectId),
    });
    if (!existing) {
      return { success: false, error: "Project not found" };
    }
    if (existing.profileId !== profileId) {
      return { success: false, error: "You do not own this project" };
    }

    if (!data.name.trim()) {
      return { success: false, error: "Project name is required" };
    }
    if (tooLong(data.name, MAX_PROJECT_NAME)) {
      return { success: false, error: `Project name must be ${MAX_PROJECT_NAME} characters or less` };
    }
    if (!data.description.trim()) {
      return { success: false, error: "Description is required" };
    }
    if (tooLong(data.description, MAX_PROJECT_DESCRIPTION)) {
      return { success: false, error: `Description must be ${MAX_PROJECT_DESCRIPTION} characters or less` };
    }
    if (tooLong(data.slug, MAX_PROJECT_SLUG)) {
      return { success: false, error: `Project URL slug must be ${MAX_PROJECT_SLUG} characters or less` };
    }
    if (tooLong(data.goalText, MAX_GOAL_TEXT)) {
      return { success: false, error: `Goal must be ${MAX_GOAL_TEXT} characters or less` };
    }
    if (tooLong(data.repoUrl, MAX_URL)) {
      return { success: false, error: `Repository URL is too long` };
    }
    if (tooLong(data.liveUrl, MAX_URL)) {
      return { success: false, error: `Live URL is too long` };
    }

    const trimmedSlug = data.slug.trim().toLowerCase();
    const githubUrl = validateUrl(data.repoUrl);
    const liveUrl = validateUrl(data.liveUrl);

    const [updated] = await db
      .update(projects)
      .set({
        name: data.name.trim(),
        slug: trimmedSlug || null,
        description: data.description.trim(),
        startingPoint: data.startingPoint,
        goalText: data.goalText.trim() || null,
        githubUrl,
        liveUrl,
      })
      .where(eq(projects.id, data.projectId))
      .returning();

    revalidatePath("/projects");
    if (existing.slug) {
      revalidatePath(`/projects/${existing.slug}`);
    }
    if (updated.slug && updated.slug !== existing.slug) {
      revalidatePath(`/projects/${updated.slug}`);
    }

    return { success: true, data: { slug: updated.slug } };
  } catch (error) {
    if (isUniqueViolation(error, "projects_slug_unique")) {
      return { success: false, error: "Project URL is already taken" };
    }
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "updateProject" },
      extra: { projectId: data.projectId, projectName: data.name },
    });
    return { success: false, error: "Failed to update project" };
  }
}

export async function deleteProject(data: {
  projectId: string;
}): Promise<ActionResult> {
  try {
    const profileId = await getProfileId();

    // Verify ownership
    const existing = await db.query.projects.findFirst({
      where: eq(projects.id, data.projectId),
    });
    if (!existing) {
      return { success: false, error: "Project not found" };
    }
    if (existing.profileId !== profileId) {
      return { success: false, error: "You do not own this project" };
    }

    // Delete related rows in FK order within a transaction
    await db.transaction(async (tx) => {
      await tx
        .delete(projectMembers)
        .where(eq(projectMembers.projectId, data.projectId));
      await tx
        .delete(teamInvites)
        .where(eq(teamInvites.projectId, data.projectId));
      await tx
        .delete(eventProjects)
        .where(eq(eventProjects.projectId, data.projectId));
      await tx.delete(projects).where(eq(projects.id, data.projectId));
    });

    revalidatePath("/projects");
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "deleteProject" },
      extra: { projectId: data.projectId },
    });
    return { success: false, error: "Failed to delete project" };
  }
}
