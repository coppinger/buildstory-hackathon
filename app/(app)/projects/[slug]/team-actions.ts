"use server";

import crypto from "crypto";
import { auth } from "@clerk/nextjs/server";
import { eq, and, or, ilike, isNull, isNotNull, notInArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { NeonDbError } from "@neondatabase/serverless";
import { db } from "@/lib/db";
import { ensureProfile } from "@/lib/db/ensure-profile";
import {
  profiles,
  projects,
  teamInvites,
  projectMembers,
} from "@/lib/db/schema";
import { getSenderPendingInviteCount } from "@/lib/queries";
import { tooLong, MAX_SEARCH_QUERY } from "@/lib/validation";

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

function isUniqueViolation(error: unknown, constraintName: string): boolean {
  const cause =
    error instanceof Error && error.cause instanceof NeonDbError
      ? error.cause
      : error instanceof NeonDbError
        ? error
        : null;
  return cause?.code === "23505" && cause?.constraint === constraintName;
}

function escapeIlike(str: string): string {
  return str.replace(/[%_\\]/g, "\\$&");
}

const MAX_PENDING_INVITES = 5;

export async function sendDirectInvite(data: {
  projectId: string;
  recipientUsername: string;
}): Promise<ActionResult> {
  try {
    const profileId = await getProfileId();

    // Verify ownership
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, data.projectId),
    });
    if (!project) return { success: false, error: "Project not found" };
    if (project.profileId !== profileId) {
      return { success: false, error: "You do not own this project" };
    }

    // Validate username length (USERNAME_REGEX caps at 30 chars)
    if (tooLong(data.recipientUsername, 30)) {
      return { success: false, error: "User not found" };
    }

    // Lookup recipient
    const recipient = await db.query.profiles.findFirst({
      where: eq(profiles.username, data.recipientUsername),
    });
    if (!recipient) return { success: false, error: "User not found" };

    // Guards
    if (!recipient.allowInvites) {
      return { success: false, error: "This user is not accepting invites" };
    }
    if (recipient.bannedAt || recipient.hiddenAt) {
      return { success: false, error: "User not found" };
    }
    if (recipient.id === profileId) {
      return { success: false, error: "You cannot invite yourself" };
    }

    // Check not already a member
    const existingMember = await db.query.projectMembers.findFirst({
      where: and(
        eq(projectMembers.projectId, data.projectId),
        eq(projectMembers.profileId, recipient.id)
      ),
    });
    if (existingMember) {
      return { success: false, error: "User is already a team member" };
    }

    // Check no existing pending direct invite
    const existingInvite = await db.query.teamInvites.findFirst({
      where: and(
        eq(teamInvites.projectId, data.projectId),
        eq(teamInvites.recipientId, recipient.id),
        eq(teamInvites.type, "direct"),
        eq(teamInvites.status, "pending")
      ),
    });
    if (existingInvite) {
      return { success: false, error: "Invite already sent to this user" };
    }

    // Rate limit
    const pendingCount = await getSenderPendingInviteCount(profileId);
    if (pendingCount >= MAX_PENDING_INVITES) {
      return {
        success: false,
        error: `You can have at most ${MAX_PENDING_INVITES} pending invites`,
      };
    }

    await db.insert(teamInvites).values({
      projectId: data.projectId,
      senderId: profileId,
      recipientId: recipient.id,
      type: "direct",
    });

    revalidatePath(`/projects/${project.slug}`);
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "sendDirectInvite" },
      extra: { projectId: data.projectId },
    });
    return { success: false, error: "Failed to send invite" };
  }
}

export async function generateInviteLink(data: {
  projectId: string;
}): Promise<ActionResult<{ token: string }>> {
  try {
    const profileId = await getProfileId();

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, data.projectId),
    });
    if (!project) return { success: false, error: "Project not found" };
    if (project.profileId !== profileId) {
      return { success: false, error: "You do not own this project" };
    }

    const pendingCount = await getSenderPendingInviteCount(profileId);
    if (pendingCount >= MAX_PENDING_INVITES) {
      return {
        success: false,
        error: `You can have at most ${MAX_PENDING_INVITES} pending invites`,
      };
    }

    const token = crypto.randomUUID();

    await db.insert(teamInvites).values({
      projectId: data.projectId,
      senderId: profileId,
      type: "link",
      token,
    });

    revalidatePath(`/projects/${project.slug}`);
    return { success: true, data: { token } };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "generateInviteLink" },
      extra: { projectId: data.projectId },
    });
    return { success: false, error: "Failed to generate invite link" };
  }
}

export async function respondToInvite(data: {
  inviteId: string;
  accept: boolean;
}): Promise<ActionResult> {
  try {
    const profileId = await getProfileId();

    // Atomically claim the invite — prevents concurrent accept race
    const newStatus = data.accept ? "accepted" : "declined";
    const [claimed] = await db
      .update(teamInvites)
      .set({ status: newStatus as "accepted" | "declined" })
      .where(
        and(
          eq(teamInvites.id, data.inviteId),
          eq(teamInvites.recipientId, profileId),
          eq(teamInvites.status, "pending")
        )
      )
      .returning();

    if (!claimed) {
      return { success: false, error: "Invite not found" };
    }

    if (data.accept) {
      await db.insert(projectMembers).values({
        projectId: claimed.projectId,
        profileId,
        inviteId: claimed.id,
      });
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, claimed.projectId),
      columns: { slug: true },
    });
    if (project?.slug) {
      revalidatePath(`/projects/${project.slug}`);
    }
    return { success: true };
  } catch (error) {
    if (isUniqueViolation(error, "project_members_project_id_profile_id_unique")) {
      return { success: false, error: "You are already a team member" };
    }
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "respondToInvite" },
      extra: { inviteId: data.inviteId },
    });
    return { success: false, error: "Failed to respond to invite" };
  }
}

export async function acceptInviteLink(data: {
  token: string;
}): Promise<ActionResult<{ projectSlug: string | null }>> {
  try {
    const profileId = await getProfileId();

    // Read the invite first to check ownership
    const invite = await db.query.teamInvites.findFirst({
      where: and(
        eq(teamInvites.token, data.token),
        eq(teamInvites.type, "link"),
        eq(teamInvites.status, "pending")
      ),
      with: { project: true },
    });
    if (!invite) {
      return { success: false, error: "This invite link is invalid or has expired" };
    }

    if (invite.project.profileId === profileId) {
      return { success: false, error: "You are the owner of this project" };
    }

    // Check not already a member
    const existingMember = await db.query.projectMembers.findFirst({
      where: and(
        eq(projectMembers.projectId, invite.projectId),
        eq(projectMembers.profileId, profileId)
      ),
    });
    if (existingMember) {
      return { success: false, error: "You are already a team member" };
    }

    // Atomically claim the invite — only one concurrent request can succeed
    const [claimed] = await db
      .update(teamInvites)
      .set({ status: "accepted", recipientId: profileId })
      .where(
        and(
          eq(teamInvites.id, invite.id),
          eq(teamInvites.status, "pending")
        )
      )
      .returning();

    if (!claimed) {
      return { success: false, error: "This invite has already been used" };
    }

    await db.insert(projectMembers).values({
      projectId: invite.projectId,
      profileId,
      inviteId: invite.id,
    });

    revalidatePath(`/projects/${invite.project.slug}`);
    return { success: true, data: { projectSlug: invite.project.slug } };
  } catch (error) {
    if (isUniqueViolation(error, "project_members_project_id_profile_id_unique")) {
      return { success: false, error: "You are already a team member" };
    }
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "acceptInviteLink" },
      extra: { tokenPrefix: data.token.slice(0, 8) },
    });
    return { success: false, error: "Failed to accept invite" };
  }
}

export async function revokeInvite(data: {
  inviteId: string;
}): Promise<ActionResult> {
  try {
    const profileId = await getProfileId();

    const invite = await db.query.teamInvites.findFirst({
      where: eq(teamInvites.id, data.inviteId),
      with: { project: true },
    });
    if (!invite || invite.senderId !== profileId) {
      return { success: false, error: "Invite not found" };
    }
    if (invite.status !== "pending") {
      return { success: false, error: "Only pending invites can be revoked" };
    }

    await db
      .update(teamInvites)
      .set({ status: "revoked" })
      .where(eq(teamInvites.id, data.inviteId));

    revalidatePath(`/projects/${invite.project.slug}`);
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "revokeInvite" },
      extra: { inviteId: data.inviteId },
    });
    return { success: false, error: "Failed to revoke invite" };
  }
}

export async function removeTeamMember(data: {
  projectId: string;
  memberId: string;
}): Promise<ActionResult> {
  try {
    const profileId = await getProfileId();

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, data.projectId),
    });
    if (!project) return { success: false, error: "Project not found" };
    if (project.profileId !== profileId) {
      return { success: false, error: "You do not own this project" };
    }

    await db
      .delete(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, data.projectId),
          eq(projectMembers.profileId, data.memberId)
        )
      );

    revalidatePath(`/projects/${project.slug}`);
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "removeTeamMember" },
      extra: { projectId: data.projectId, memberId: data.memberId },
    });
    return { success: false, error: "Failed to remove member" };
  }
}

export async function leaveProject(data: {
  projectId: string;
}): Promise<ActionResult> {
  try {
    const profileId = await getProfileId();

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, data.projectId),
    });
    if (!project) return { success: false, error: "Project not found" };
    if (project.profileId === profileId) {
      return { success: false, error: "Owners cannot leave their own project" };
    }

    await db
      .delete(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, data.projectId),
          eq(projectMembers.profileId, profileId)
        )
      );

    revalidatePath(`/projects/${project.slug}`);
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "leaveProject" },
      extra: { projectId: data.projectId },
    });
    return { success: false, error: "Failed to leave project" };
  }
}

export async function searchUsersForInvite(data: {
  projectId: string;
  query: string;
}): Promise<ActionResult<{ id: string; displayName: string; username: string | null }[]>> {
  try {
    const profileId = await getProfileId();

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, data.projectId),
    });
    if (!project) return { success: false, error: "Project not found" };
    if (project.profileId !== profileId) {
      return { success: false, error: "You do not own this project" };
    }

    const trimmed = data.query.trim();
    if (trimmed.length < 2) {
      return { success: true, data: [] };
    }
    if (tooLong(trimmed, MAX_SEARCH_QUERY)) {
      return { success: true, data: [] };
    }

    // Get existing member IDs to exclude
    const existingMembers = await db.query.projectMembers.findMany({
      where: eq(projectMembers.projectId, data.projectId),
      columns: { profileId: true },
    });
    const excludeIds = [profileId, ...existingMembers.map((m) => m.profileId)];

    const pattern = `%${escapeIlike(trimmed)}%`;
    const results = await db
      .select({
        id: profiles.id,
        displayName: profiles.displayName,
        username: profiles.username,
      })
      .from(profiles)
      .where(
        and(
          or(
            ilike(profiles.username, pattern),
            ilike(profiles.displayName, pattern)
          ),
          isNotNull(profiles.username),
          eq(profiles.allowInvites, true),
          isNull(profiles.bannedAt),
          isNull(profiles.hiddenAt),
          notInArray(profiles.id, excludeIds)
        )
      )
      .limit(5);

    return { success: true, data: results };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "searchUsersForInvite" },
      extra: { projectId: data.projectId },
    });
    return { success: false, error: "Search failed" };
  }
}
