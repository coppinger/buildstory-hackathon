"use server";

import { auth } from "@clerk/nextjs/server";
import { eq, and, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { NeonDbError } from "@neondatabase/serverless";
import { db } from "@/lib/db";
import { ensureProfile } from "@/lib/db/ensure-profile";
import {
  profiles,
  events,
  eventRegistrations,
  projects,
  eventProjects,
} from "@/lib/db/schema";
import { notifySignup, notifyProject } from "@/lib/discord";
import { checkSignupMilestone, checkProjectMilestone } from "@/lib/milestones";

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
  // Drizzle ORM wraps DB errors in DrizzleQueryError with the original on .cause
  const cause =
    error instanceof Error && error.cause instanceof NeonDbError
      ? error.cause
      : error instanceof NeonDbError
        ? error
        : null;
  return cause?.code === "23505" && cause?.constraint === constraintName;
}

const USERNAME_REGEX = /^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$/;

export async function checkUsernameAvailability(
  username: string
): Promise<ActionResult<{ available: boolean }>> {
  try {
    const trimmed = username.trim().toLowerCase();
    if (!USERNAME_REGEX.test(trimmed)) {
      return {
        success: true,
        data: { available: false },
      };
    }

    const existing = await db.query.profiles.findFirst({
      where: eq(profiles.username, trimmed),
    });

    return {
      success: true,
      data: { available: !existing },
    };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "checkUsernameAvailability" },
      extra: { username },
    });
    return { success: false, error: "Failed to check username" };
  }
}

export async function completeRegistration(data: {
  displayName: string;
  username: string;
  country: string | null;
  region: string | null;
  experienceLevel: "getting_started" | "built_a_few" | "ships_constantly";
  commitmentLevel: "all_in" | "daily" | "nights_weekends" | "not_sure" | null;
  teamPreference: "solo" | "has_team" | "has_team_open" | "looking_for_team";
  eventId: string;
}): Promise<ActionResult> {
  try {
    const profileId = await getProfileId();

    const trimmedUsername = data.username.trim().toLowerCase();
    if (!USERNAME_REGEX.test(trimmedUsername)) {
      return { success: false, error: "Invalid username format" };
    }
    if (!data.displayName.trim()) {
      return { success: false, error: "Display name is required" };
    }

    const event = await db.query.events.findFirst({
      where: eq(events.id, data.eventId),
    });
    if (!event) return { success: false, error: "Event not found" };
    if (event.status !== "open" && event.status !== "active") {
      return { success: false, error: "Event is not accepting registrations" };
    }

    // Update profile
    await db
      .update(profiles)
      .set({
        displayName: data.displayName.trim(),
        username: trimmedUsername,
        country: data.country?.toUpperCase() || null,
        region: data.region?.trim() || null,
        experienceLevel: data.experienceLevel,
      })
      .where(eq(profiles.id, profileId));

    // Create event registration
    await db
      .insert(eventRegistrations)
      .values({
        eventId: data.eventId,
        profileId,
        teamPreference: data.teamPreference,
        commitmentLevel: data.commitmentLevel,
      })
      .onConflictDoNothing();

    notifySignup(data.displayName.trim());
    checkSignupMilestone(data.eventId);

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    // Handle unique constraint violation on username
    if (isUniqueViolation(error, "profiles_username_unique")) {
      return { success: false, error: "Username is already taken" };
    }
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "completeRegistration" },
      extra: { displayName: data.displayName, username: data.username },
    });
    return { success: false, error: "Registration failed" };
  }
}

export async function createOnboardingProject(data: {
  name: string;
  slug: string;
  description: string;
  startingPoint: "new" | "existing";
  goalText: string;
  repoUrl: string;
  eventId: string;
}): Promise<ActionResult> {
  try {
    const profileId = await getProfileId();

    if (!data.name.trim()) {
      return { success: false, error: "Project name is required" };
    }
    if (!data.description.trim()) {
      return { success: false, error: "Description is required" };
    }

    const trimmedSlug = data.slug.trim().toLowerCase();

    const githubUrl = validateUrl(data.repoUrl);

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
      })
      .returning();

    // Link to event
    await db
      .insert(eventProjects)
      .values({ eventId: data.eventId, projectId: project.id })
      .onConflictDoNothing();

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, profileId),
      columns: { displayName: true },
    });
    notifyProject(profile?.displayName ?? "Someone", data.name.trim());
    checkProjectMilestone(data.eventId);

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    if (isUniqueViolation(error, "projects_slug_unique")) {
      return { success: false, error: "Project URL is already taken" };
    }
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "createOnboardingProject" },
      extra: { projectName: data.name },
    });
    return { success: false, error: "Failed to create project" };
  }
}

export async function searchUsers(
  query: string
): Promise<ActionResult<{ id: string; displayName: string; username: string | null }[]>> {
  try {
    await getProfileId(); // auth check

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return { success: true, data: [] };
    }

    const results = await db
      .select({
        id: profiles.id,
        displayName: profiles.displayName,
        username: profiles.username,
      })
      .from(profiles)
      .where(
        or(
          ilike(profiles.username, `%${trimmed}%`),
          ilike(profiles.displayName, `%${trimmed}%`)
        )
      )
      .limit(5);

    return { success: true, data: results };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "searchUsers" },
    });
    return { success: false, error: "Search failed" };
  }
}

export async function searchProjects(
  query: string,
  profileId?: string
): Promise<ActionResult<{ id: string; name: string; description: string | null }[]>> {
  try {
    await getProfileId(); // auth check

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return { success: true, data: [] };
    }

    const conditions = [ilike(projects.name, `%${trimmed}%`)];
    if (profileId) {
      conditions.push(eq(projects.profileId, profileId));
    }

    const results = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
      })
      .from(projects)
      .where(and(...conditions))
      .limit(5);

    return { success: true, data: results };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "searchProjects" },
    });
    return { success: false, error: "Search failed" };
  }
}

export async function checkProjectSlugAvailability(
  slug: string
): Promise<ActionResult<{ available: boolean }>> {
  try {
    const trimmed = slug.trim().toLowerCase();
    if (!trimmed || trimmed.length < 2) {
      return { success: true, data: { available: false } };
    }

    const existing = await db.query.projects.findFirst({
      where: eq(projects.slug, trimmed),
    });

    return {
      success: true,
      data: { available: !existing },
    };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "checkProjectSlugAvailability" },
    });
    return { success: false, error: "Failed to check slug" };
  }
}
