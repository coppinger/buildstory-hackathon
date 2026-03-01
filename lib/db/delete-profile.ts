import { eq, inArray, or } from "drizzle-orm";
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

/**
 * Cascade-delete a profile and all related data in FK-safe order.
 * Runs everything in a single transaction. Does NOT handle Clerk user
 * deletion or audit logging — callers are responsible for those.
 */
export async function deleteProfileCascade(profileId: string) {
  await db.transaction(async (tx) => {
    // 1. Delete data for projects owned by this user
    const ownedProjects = await tx
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.profileId, profileId));

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
      .where(eq(projectMembers.profileId, profileId));

    // 3. Remove team invites where user is sender or recipient
    // First nullify inviteId on any projectMembers referencing these invites
    const userInvites = await tx
      .select({ id: teamInvites.id })
      .from(teamInvites)
      .where(
        or(
          eq(teamInvites.senderId, profileId),
          eq(teamInvites.recipientId, profileId)
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
          eq(teamInvites.senderId, profileId),
          eq(teamInvites.recipientId, profileId)
        )
      );

    // 4. Event registrations
    await tx
      .delete(eventRegistrations)
      .where(eq(eventRegistrations.profileId, profileId));

    // 5. Nullify references in mentor_applications and sponsorship_inquiries
    await tx
      .update(mentorApplications)
      .set({ reviewedBy: null })
      .where(eq(mentorApplications.reviewedBy, profileId));
    await tx
      .update(sponsorshipInquiries)
      .set({ reviewedBy: null })
      .where(eq(sponsorshipInquiries.reviewedBy, profileId));

    // 6. Audit log cleanup
    await tx
      .update(adminAuditLog)
      .set({ targetProfileId: null })
      .where(eq(adminAuditLog.targetProfileId, profileId));
    await tx
      .delete(adminAuditLog)
      .where(eq(adminAuditLog.actorProfileId, profileId));

    // 7. Nullify ban/hide references from other profiles
    await tx
      .update(profiles)
      .set({ bannedBy: null })
      .where(eq(profiles.bannedBy, profileId));
    await tx
      .update(profiles)
      .set({ hiddenBy: null })
      .where(eq(profiles.hiddenBy, profileId));

    // 8. Delete the profile
    await tx.delete(profiles).where(eq(profiles.id, profileId));
  });
}
