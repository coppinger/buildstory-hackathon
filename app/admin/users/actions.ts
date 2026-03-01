"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq, inArray, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import {
  profiles,
  adminAuditLog,
  projects,
  projectMembers,
  teamInvites,
  eventProjects,
  eventRegistrations,
  mentorApplications,
  sponsorshipInquiries,
} from "@/lib/db/schema";
import { isModerator, isAdmin, isSuperAdmin } from "@/lib/admin";

type ActionResult = { success: true } | { success: false; error: string };

async function getActorProfile(clerkUserId: string) {
  return db.query.profiles.findFirst({
    where: eq(profiles.clerkId, clerkUserId),
    columns: { id: true },
  });
}

async function logAudit(
  actorProfileId: string,
  action: string,
  targetProfileId: string | null,
  metadata?: Record<string, unknown>
) {
  await db.insert(adminAuditLog).values({
    actorProfileId,
    action,
    targetProfileId,
    metadata: metadata ? JSON.stringify(metadata) : null,
  });
}

export async function hideUser(data: {
  profileId: string;
}): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId || !(await isModerator(userId))) {
      return { success: false, error: "Unauthorized" };
    }

    const target = await db.query.profiles.findFirst({
      where: eq(profiles.id, data.profileId),
      columns: { id: true, clerkId: true, role: true, hiddenAt: true },
    });
    if (!target) return { success: false, error: "User not found" };
    if (target.hiddenAt) return { success: false, error: "User is already hidden" };
    if (isSuperAdmin(target.clerkId)) {
      return { success: false, error: "Cannot hide a super-admin" };
    }

    const actor = await getActorProfile(userId);
    if (!actor) return { success: false, error: "Actor profile not found" };

    await db
      .update(profiles)
      .set({ hiddenAt: new Date(), hiddenBy: actor.id })
      .where(eq(profiles.id, data.profileId));

    await logAudit(actor.id, "hide_user", data.profileId);

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "hideUser" },
      extra: { profileId: data.profileId },
    });
    return { success: false, error: "Failed to hide user" };
  }
}

export async function unhideUser(data: {
  profileId: string;
}): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId || !(await isModerator(userId))) {
      return { success: false, error: "Unauthorized" };
    }

    const target = await db.query.profiles.findFirst({
      where: eq(profiles.id, data.profileId),
      columns: { id: true, hiddenAt: true },
    });
    if (!target) return { success: false, error: "User not found" };
    if (!target.hiddenAt) return { success: false, error: "User is not hidden" };

    const actor = await getActorProfile(userId);
    if (!actor) return { success: false, error: "Actor profile not found" };

    await db
      .update(profiles)
      .set({ hiddenAt: null, hiddenBy: null })
      .where(eq(profiles.id, data.profileId));

    await logAudit(actor.id, "unhide_user", data.profileId);

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "unhideUser" },
      extra: { profileId: data.profileId },
    });
    return { success: false, error: "Failed to unhide user" };
  }
}

export async function banUser(data: {
  profileId: string;
  reason?: string;
}): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId || !(await isModerator(userId))) {
      return { success: false, error: "Unauthorized" };
    }

    const target = await db.query.profiles.findFirst({
      where: eq(profiles.id, data.profileId),
      columns: { id: true, clerkId: true, role: true, bannedAt: true },
    });
    if (!target) return { success: false, error: "User not found" };
    if (target.bannedAt) return { success: false, error: "User is already banned" };
    if (isSuperAdmin(target.clerkId)) {
      return { success: false, error: "Cannot ban a super-admin" };
    }
    // Moderators cannot ban admins
    if (!(await isAdmin(userId)) && target.role === "admin") {
      return { success: false, error: "Moderators cannot ban admins" };
    }

    const actor = await getActorProfile(userId);
    if (!actor) return { success: false, error: "Actor profile not found" };

    // Prevent self-ban
    if (actor.id === data.profileId) {
      return { success: false, error: "Cannot ban yourself" };
    }

    await db
      .update(profiles)
      .set({
        bannedAt: new Date(),
        bannedBy: actor.id,
        banReason: data.reason?.trim() || null,
      })
      .where(eq(profiles.id, data.profileId));

    // Disable login in Clerk (non-blocking — DB ban is the source of truth)
    try {
      const clerk = await clerkClient();
      await clerk.users.banUser(target.clerkId);
    } catch (clerkError) {
      Sentry.captureException(clerkError, {
        tags: { component: "server-action", action: "banUser-clerk" },
        extra: { clerkId: target.clerkId },
      });
      // DB ban still took effect — Clerk sync can be retried
    }

    await logAudit(actor.id, "ban_user", data.profileId, {
      reason: data.reason?.trim() || null,
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "banUser" },
      extra: { profileId: data.profileId },
    });
    return { success: false, error: "Failed to ban user" };
  }
}

export async function unbanUser(data: {
  profileId: string;
}): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId || !(await isAdmin(userId))) {
      return { success: false, error: "Only admins can unban users" };
    }

    const target = await db.query.profiles.findFirst({
      where: eq(profiles.id, data.profileId),
      columns: { id: true, clerkId: true, bannedAt: true },
    });
    if (!target) return { success: false, error: "User not found" };
    if (!target.bannedAt) return { success: false, error: "User is not banned" };

    const actor = await getActorProfile(userId);
    if (!actor) return { success: false, error: "Actor profile not found" };

    // Clear ban and hidden status
    await db
      .update(profiles)
      .set({
        bannedAt: null,
        bannedBy: null,
        banReason: null,
        hiddenAt: null,
        hiddenBy: null,
      })
      .where(eq(profiles.id, data.profileId));

    // Re-enable login in Clerk (non-blocking — DB unban is the source of truth)
    try {
      const clerk = await clerkClient();
      await clerk.users.unbanUser(target.clerkId);
    } catch (clerkError) {
      Sentry.captureException(clerkError, {
        tags: { component: "server-action", action: "unbanUser-clerk" },
        extra: { clerkId: target.clerkId },
      });
    }

    await logAudit(actor.id, "unban_user", data.profileId);

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "unbanUser" },
      extra: { profileId: data.profileId },
    });
    return { success: false, error: "Failed to unban user" };
  }
}

export async function deleteUser(data: {
  profileId: string;
}): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId || !(await isAdmin(userId))) {
      return { success: false, error: "Unauthorized" };
    }

    const target = await db.query.profiles.findFirst({
      where: eq(profiles.id, data.profileId),
      columns: {
        id: true,
        clerkId: true,
        displayName: true,
        username: true,
      },
    });
    if (!target) return { success: false, error: "User not found" };

    if (isSuperAdmin(target.clerkId)) {
      return { success: false, error: "Cannot delete a super-admin" };
    }

    const actor = await getActorProfile(userId);
    if (!actor) return { success: false, error: "Actor profile not found" };

    if (actor.id === data.profileId) {
      return { success: false, error: "Cannot delete yourself" };
    }

    // Cascading delete in a transaction (FK-safe order)
    await db.transaction(async (tx) => {
      // 1. Delete data for projects owned by this user
      const ownedProjects = await tx
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.profileId, target.id));

      if (ownedProjects.length > 0) {
        const ownedProjectIds = ownedProjects.map((p) => p.id);

        // projectMembers referencing invites on these projects — clear invite FK first
        await tx
          .update(projectMembers)
          .set({ inviteId: null })
          .where(inArray(projectMembers.projectId, ownedProjectIds));

        await tx
          .delete(projectMembers)
          .where(inArray(projectMembers.projectId, ownedProjectIds));
        await tx
          .delete(teamInvites)
          .where(inArray(teamInvites.projectId, ownedProjectIds));
        await tx
          .delete(eventProjects)
          .where(inArray(eventProjects.projectId, ownedProjectIds));
        await tx.delete(projects).where(inArray(projects.id, ownedProjectIds));
      }

      // 2. Remove team memberships on other projects
      await tx
        .delete(projectMembers)
        .where(eq(projectMembers.profileId, target.id));

      // 3. Remove team invites where user is sender or recipient
      // First nullify inviteId on any projectMembers referencing these invites
      const userInvites = await tx
        .select({ id: teamInvites.id })
        .from(teamInvites)
        .where(
          or(
            eq(teamInvites.senderId, target.id),
            eq(teamInvites.recipientId, target.id)
          )
        );
      if (userInvites.length > 0) {
        await tx
          .update(projectMembers)
          .set({ inviteId: null })
          .where(
            inArray(
              projectMembers.inviteId,
              userInvites.map((i) => i.id)
            )
          );
      }
      await tx
        .delete(teamInvites)
        .where(
          or(
            eq(teamInvites.senderId, target.id),
            eq(teamInvites.recipientId, target.id)
          )
        );

      // 4. Event registrations
      await tx
        .delete(eventRegistrations)
        .where(eq(eventRegistrations.profileId, target.id));

      // 5. Nullify references in mentor_applications and sponsorship_inquiries
      await tx
        .update(mentorApplications)
        .set({ reviewedBy: null })
        .where(eq(mentorApplications.reviewedBy, target.id));
      await tx
        .update(sponsorshipInquiries)
        .set({ reviewedBy: null })
        .where(eq(sponsorshipInquiries.reviewedBy, target.id));

      // 6. Audit log cleanup
      await tx
        .update(adminAuditLog)
        .set({ targetProfileId: null })
        .where(eq(adminAuditLog.targetProfileId, target.id));
      await tx
        .delete(adminAuditLog)
        .where(eq(adminAuditLog.actorProfileId, target.id));

      // 7. Nullify ban/hide references from other profiles
      await tx
        .update(profiles)
        .set({ bannedBy: null })
        .where(eq(profiles.bannedBy, target.id));
      await tx
        .update(profiles)
        .set({ hiddenBy: null })
        .where(eq(profiles.hiddenBy, target.id));

      // 8. Delete the profile
      await tx.delete(profiles).where(eq(profiles.id, target.id));
    });

    // Audit log (outside transaction — target profile is gone, so targetProfileId is null)
    await logAudit(actor.id, "delete_user", null, {
      deletedProfileId: target.id,
      displayName: target.displayName,
      username: target.username,
      clerkId: target.clerkId,
    });

    // Delete from Clerk (non-blocking — DB deletion is the source of truth)
    try {
      const clerk = await clerkClient();
      await clerk.users.deleteUser(target.clerkId);
    } catch (clerkError) {
      Sentry.captureException(clerkError, {
        tags: { component: "server-action", action: "deleteUser-clerk" },
        extra: { clerkId: target.clerkId },
      });
    }

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "deleteUser" },
      extra: { profileId: data.profileId },
    });
    return { success: false, error: "Failed to delete user" };
  }
}
