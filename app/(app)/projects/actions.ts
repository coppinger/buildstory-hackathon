"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import { ensureProfile } from "@/lib/db/ensure-profile";
import { projects, events, eventProjects, projectMembers, teamInvites } from "@/lib/db/schema";
import { isUniqueViolation } from "@/lib/db/errors";
import { createProjectSchema, parseInput } from "@/lib/db/validations";

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

    const parsed = parseInput(createProjectSchema, {
      name: data.name,
      slug: data.slug || null,
      description: data.description,
      startingPoint: data.startingPoint,
      goalText: data.goalText || null,
      githubUrl: data.repoUrl || null,
      liveUrl: data.liveUrl || null,
    });
    if (!parsed.success) return parsed;
    const v = parsed.data;

    const [project] = await db
      .insert(projects)
      .values({
        profileId,
        name: v.name,
        slug: v.slug || null,
        description: v.description,
        startingPoint: v.startingPoint,
        goalText: v.goalText || null,
        githubUrl: v.githubUrl || null,
        liveUrl: v.liveUrl || null,
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

    const parsed = parseInput(createProjectSchema, {
      name: data.name,
      slug: data.slug || null,
      description: data.description,
      startingPoint: data.startingPoint,
      goalText: data.goalText || null,
      githubUrl: data.repoUrl || null,
      liveUrl: data.liveUrl || null,
    });
    if (!parsed.success) return parsed;
    const v = parsed.data;

    const [updated] = await db
      .update(projects)
      .set({
        name: v.name,
        slug: v.slug || null,
        description: v.description,
        startingPoint: v.startingPoint,
        goalText: v.goalText || null,
        githubUrl: v.githubUrl || null,
        liveUrl: v.liveUrl || null,
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
