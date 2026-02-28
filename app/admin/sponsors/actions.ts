"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import {
  sponsorshipInquiries,
  profiles,
  adminAuditLog,
} from "@/lib/db/schema";
import { isAdmin } from "@/lib/admin";

type ActionResult = { success: true } | { success: false; error: string };

async function getActorProfile(clerkUserId: string) {
  return db.query.profiles.findFirst({
    where: eq(profiles.clerkId, clerkUserId),
    columns: { id: true },
  });
}

export async function contactSponsorInquiry(data: {
  inquiryId: string;
}): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId || !(await isAdmin(userId))) {
      return { success: false, error: "Unauthorized" };
    }

    const inquiry = await db.query.sponsorshipInquiries.findFirst({
      where: eq(sponsorshipInquiries.id, data.inquiryId),
    });
    if (!inquiry) return { success: false, error: "Inquiry not found" };
    if (inquiry.status !== "pending") {
      return { success: false, error: "Inquiry is not pending" };
    }

    const actor = await getActorProfile(userId);
    if (!actor) return { success: false, error: "Actor profile not found" };

    await db
      .update(sponsorshipInquiries)
      .set({
        status: "contacted",
        reviewedBy: actor.id,
        reviewedAt: new Date(),
      })
      .where(eq(sponsorshipInquiries.id, data.inquiryId));

    await db.insert(adminAuditLog).values({
      actorProfileId: actor.id,
      action: "contact_sponsor",
      targetProfileId: null,
      metadata: JSON.stringify({
        inquiryId: data.inquiryId,
        companyName: inquiry.companyName,
        contactEmail: inquiry.email,
      }),
    });

    revalidatePath("/admin/sponsors");
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "contactSponsorInquiry" },
      extra: { inquiryId: data.inquiryId },
    });
    return { success: false, error: "Failed to update inquiry" };
  }
}

export async function acceptSponsorInquiry(data: {
  inquiryId: string;
}): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId || !(await isAdmin(userId))) {
      return { success: false, error: "Unauthorized" };
    }

    const inquiry = await db.query.sponsorshipInquiries.findFirst({
      where: eq(sponsorshipInquiries.id, data.inquiryId),
    });
    if (!inquiry) return { success: false, error: "Inquiry not found" };
    if (inquiry.status !== "pending" && inquiry.status !== "contacted") {
      return {
        success: false,
        error: "Inquiry must be pending or contacted to accept",
      };
    }

    const actor = await getActorProfile(userId);
    if (!actor) return { success: false, error: "Actor profile not found" };

    await db
      .update(sponsorshipInquiries)
      .set({
        status: "accepted",
        reviewedBy: actor.id,
        reviewedAt: new Date(),
      })
      .where(eq(sponsorshipInquiries.id, data.inquiryId));

    await db.insert(adminAuditLog).values({
      actorProfileId: actor.id,
      action: "accept_sponsor",
      targetProfileId: null,
      metadata: JSON.stringify({
        inquiryId: data.inquiryId,
        companyName: inquiry.companyName,
        contactEmail: inquiry.email,
      }),
    });

    revalidatePath("/admin/sponsors");
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "acceptSponsorInquiry" },
      extra: { inquiryId: data.inquiryId },
    });
    return { success: false, error: "Failed to accept inquiry" };
  }
}

export async function declineSponsorInquiry(data: {
  inquiryId: string;
}): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId || !(await isAdmin(userId))) {
      return { success: false, error: "Unauthorized" };
    }

    const inquiry = await db.query.sponsorshipInquiries.findFirst({
      where: eq(sponsorshipInquiries.id, data.inquiryId),
    });
    if (!inquiry) return { success: false, error: "Inquiry not found" };
    if (inquiry.status === "declined") {
      return { success: false, error: "Inquiry is already declined" };
    }

    const actor = await getActorProfile(userId);
    if (!actor) return { success: false, error: "Actor profile not found" };

    await db
      .update(sponsorshipInquiries)
      .set({
        status: "declined",
        reviewedBy: actor.id,
        reviewedAt: new Date(),
      })
      .where(eq(sponsorshipInquiries.id, data.inquiryId));

    await db.insert(adminAuditLog).values({
      actorProfileId: actor.id,
      action: "decline_sponsor",
      targetProfileId: null,
      metadata: JSON.stringify({
        inquiryId: data.inquiryId,
        companyName: inquiry.companyName,
        contactEmail: inquiry.email,
      }),
    });

    revalidatePath("/admin/sponsors");
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "declineSponsorInquiry" },
      extra: { inquiryId: data.inquiryId },
    });
    return { success: false, error: "Failed to decline inquiry" };
  }
}
