"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import { mentorApplications, profiles, adminAuditLog } from "@/lib/db/schema";
import { isAdmin } from "@/lib/admin";

type ActionResult = { success: true } | { success: false; error: string };

async function getActorProfile(clerkUserId: string) {
  return db.query.profiles.findFirst({
    where: eq(profiles.clerkId, clerkUserId),
    columns: { id: true },
  });
}

export async function approveMentorApplication(data: {
  applicationId: string;
}): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId || !(await isAdmin(userId))) {
      return { success: false, error: "Unauthorized" };
    }

    const application = await db.query.mentorApplications.findFirst({
      where: eq(mentorApplications.id, data.applicationId),
    });
    if (!application) return { success: false, error: "Application not found" };
    if (application.status !== "pending") {
      return { success: false, error: "Application is not pending" };
    }

    const actor = await getActorProfile(userId);
    if (!actor) return { success: false, error: "Actor profile not found" };

    await db
      .update(mentorApplications)
      .set({
        status: "approved",
        reviewedBy: actor.id,
        reviewedAt: new Date(),
      })
      .where(eq(mentorApplications.id, data.applicationId));

    await db.insert(adminAuditLog).values({
      actorProfileId: actor.id,
      action: "approve_mentor",
      targetProfileId: null,
      metadata: JSON.stringify({
        applicationId: data.applicationId,
        applicantName: application.name,
        applicantEmail: application.email,
      }),
    });

    revalidatePath("/admin/mentors");
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "approveMentorApplication" },
      extra: { applicationId: data.applicationId },
    });
    return { success: false, error: "Failed to approve application" };
  }
}

export async function declineMentorApplication(data: {
  applicationId: string;
}): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId || !(await isAdmin(userId))) {
      return { success: false, error: "Unauthorized" };
    }

    const application = await db.query.mentorApplications.findFirst({
      where: eq(mentorApplications.id, data.applicationId),
    });
    if (!application) return { success: false, error: "Application not found" };
    if (application.status !== "pending") {
      return { success: false, error: "Application is not pending" };
    }

    const actor = await getActorProfile(userId);
    if (!actor) return { success: false, error: "Actor profile not found" };

    await db
      .update(mentorApplications)
      .set({
        status: "declined",
        reviewedBy: actor.id,
        reviewedAt: new Date(),
      })
      .where(eq(mentorApplications.id, data.applicationId));

    await db.insert(adminAuditLog).values({
      actorProfileId: actor.id,
      action: "decline_mentor",
      targetProfileId: null,
      metadata: JSON.stringify({
        applicationId: data.applicationId,
        applicantName: application.name,
        applicantEmail: application.email,
      }),
    });

    revalidatePath("/admin/mentors");
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "declineMentorApplication" },
      extra: { applicationId: data.applicationId },
    });
    return { success: false, error: "Failed to decline application" };
  }
}
