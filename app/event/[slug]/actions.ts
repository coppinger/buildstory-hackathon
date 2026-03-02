"use server";

import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import { ensureProfile } from "@/lib/db/ensure-profile";
import {
  events,
  eventRegistrations,
  projects,
  eventProjects,
  profiles,
} from "@/lib/db/schema";
import { notifySignup, notifyProject } from "@/lib/discord";
import { checkSignupMilestone, checkProjectMilestone } from "@/lib/milestones";
import { createProjectSchema, parseInput } from "@/lib/db/validations";

type ActionResult = { success: true } | { success: false; error: string };

async function getProfileId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const profile = await ensureProfile(userId);
  if (!profile) throw new Error("Profile creation failed");

  return profile.id;
}

async function requireRegistration(eventId: string, profileId: string) {
  const reg = await db.query.eventRegistrations.findFirst({
    where: and(
      eq(eventRegistrations.eventId, eventId),
      eq(eventRegistrations.profileId, profileId)
    ),
  });
  if (!reg) throw new Error("You must register for this event first");
  return reg;
}

export async function registerForEvent(
  eventId: string,
  teamPreference: "solo" | "has_team" | "has_team_open" | "looking_for_team"
): Promise<ActionResult> {
  try {
    const profileId = await getProfileId();

    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    });
    if (!event) return { success: false, error: "Event not found" };
    if (event.status !== "open" && event.status !== "active") {
      return { success: false, error: "Event is not accepting registrations" };
    }

    const now = new Date();
    if (event.registrationClosesAt && now > event.registrationClosesAt) {
      return { success: false, error: "Registration has closed" };
    }
    if (event.registrationOpensAt && now < event.registrationOpensAt) {
      return { success: false, error: "Registration has not opened yet" };
    }

    await db
      .insert(eventRegistrations)
      .values({ eventId, profileId, teamPreference })
      .onConflictDoNothing();

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, profileId),
      columns: { displayName: true },
    });
    notifySignup(profile?.displayName ?? "Someone");
    checkSignupMilestone(eventId);

    revalidatePath(`/event/${event.slug}`);
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "registerForEvent" },
      extra: { eventId, teamPreference },
    });
    return { success: false, error: "Registration failed" };
  }
}

export async function createProject(
  formData: FormData,
  eventId: string
): Promise<ActionResult> {
  try {
    const profileId = await getProfileId();
    await requireRegistration(eventId, profileId);

    const eventProjectSchema = createProjectSchema.pick({
    const parsed = parseInput(eventProjectSchema, {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      githubUrl: (formData.get("githubUrl") as string) || null,
    });
    if (!parsed.success) return parsed;
    const v = parsed.data;

    const [project] = await db
      .insert(projects)
      .values({
        profileId,
        name: v.name,
        description: v.description,
        githubUrl: v.githubUrl || null,
      })
      .returning();

    await db
      .insert(eventProjects)
      .values({ eventId, projectId: project.id })
      .onConflictDoNothing();

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, profileId),
      columns: { displayName: true },
    });
    notifyProject(profile?.displayName ?? "Someone", v.name);
    checkProjectMilestone(eventId);

    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    });
    if (event) revalidatePath(`/event/${event.slug}`);
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "createProject" },
      extra: { eventId, projectName: formData.get("name") },
    });
    return { success: false, error: "Failed to create project" };
  }
}

export async function enterProjectInEvent(
  eventId: string,
  projectId: string
): Promise<ActionResult> {
  try {
    const profileId = await getProfileId();
    await requireRegistration(eventId, profileId);

    // Verify the user owns this project
    const project = await db.query.projects.findFirst({
      where: and(eq(projects.id, projectId), eq(projects.profileId, profileId)),
    });
    if (!project) {
      return { success: false, error: "Project not found" };
    }

    await db
      .insert(eventProjects)
      .values({ eventId, projectId })
      .onConflictDoNothing();

    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    });
    if (event) revalidatePath(`/event/${event.slug}`);
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "enterProjectInEvent" },
      extra: { eventId, projectId },
    });
    return { success: false, error: "Failed to enter project" };
  }
}

export async function removeProjectFromEvent(
  eventId: string,
  projectId: string
): Promise<ActionResult> {
  try {
    const profileId = await getProfileId();

    // Verify the user owns this project
    const project = await db.query.projects.findFirst({
      where: and(eq(projects.id, projectId), eq(projects.profileId, profileId)),
    });
    if (!project) {
      return { success: false, error: "Project not found" };
    }

    await db
      .delete(eventProjects)
      .where(
        and(
          eq(eventProjects.eventId, eventId),
          eq(eventProjects.projectId, projectId)
        )
      );

    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    });
    if (event) revalidatePath(`/event/${event.slug}`);
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "removeProjectFromEvent" },
      extra: { eventId, projectId },
    });
    return { success: false, error: "Failed to remove project" };
  }
}
