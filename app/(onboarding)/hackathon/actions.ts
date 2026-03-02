"use server";

import { auth } from "@clerk/nextjs/server";
import { eq, and, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
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
import { isUniqueViolation } from "@/lib/db/errors";
import { SLUG_REGEX } from "@/lib/constants";
import {
  completeRegistrationSchema,
  createProjectSchema,
  usernameSchema,
  searchQuerySchema,
  parseInput,
} from "@/lib/db/validations";

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

// NOTE: Intentionally unauthenticated — called from the public sign-up page.
// Username availability is non-sensitive (usernames are public on profile pages).
export async function checkUsernameAvailability(
  username: string
): Promise<ActionResult<{ available: boolean }>> {
  try {
    const parsed = parseInput(usernameSchema, {
      username,
    });
    if (!parsed.success) {
      return { success: true, data: { available: false } };
    }

    const existing = await db.query.profiles.findFirst({
      where: eq(profiles.username, parsed.data.username!),
      columns: { id: true },
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

    const parsed = parseInput(completeRegistrationSchema, {
      displayName: data.displayName,
      username: data.username,
      country: data.country || null,
      region: data.region || null,
    });
    if (!parsed.success) return parsed;
    const v = parsed.data;

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
        displayName: v.displayName,
        username: v.username,
        country: v.country?.toUpperCase() || null,
        region: v.region || null,
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

    notifySignup(v.displayName);
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

    const parsed = parseInput(createProjectSchema, {
      name: data.name,
      slug: data.slug || null,
      description: data.description,
      startingPoint: data.startingPoint,
      goalText: data.goalText || null,
      githubUrl: data.repoUrl || null,
      liveUrl: null,
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
    notifyProject(profile?.displayName ?? "Someone", v.name);
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

    const parsed = parseInput(searchQuerySchema, { query });
    if (!parsed.success) return { success: true, data: [] };
    const trimmed = parsed.data.query;
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

    const parsed = parseInput(searchQuerySchema, { query });
    if (!parsed.success) return { success: true, data: [] };
    const trimmed = parsed.data.query;
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
    if (!trimmed || trimmed.length < 2 || !SLUG_REGEX.test(trimmed)) {
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
