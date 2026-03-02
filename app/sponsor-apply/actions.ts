"use server";

import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import { sponsorshipInquiries } from "@/lib/db/schema";
import { notifySponsorInquiry } from "@/lib/discord";
import { isUniqueViolation } from "@/lib/db/errors";
import { submitSponsorInquirySchema, parseInput } from "@/lib/db/validations";

type ActionResult = { success: true } | { success: false; error: string };

export async function submitSponsorInquiry(data: {
  companyName: string;
  contactName: string;
  email: string;
  websiteUrl: string;
  offerDescription: string;
  additionalNotes: string;
}): Promise<ActionResult> {
  try {
    const parsed = parseInput(submitSponsorInquirySchema, {
      companyName: data.companyName,
      contactName: data.contactName,
      email: data.email,
      websiteUrl: data.websiteUrl || null,
      offerDescription: data.offerDescription,
      additionalNotes: data.additionalNotes || null,
    });
    if (!parsed.success) return parsed;
    const v = parsed.data;

    await db.insert(sponsorshipInquiries).values({
      companyName: v.companyName,
      contactName: v.contactName,
      email: v.email,
      websiteUrl: v.websiteUrl || null,
      offerDescription: v.offerDescription,
      additionalNotes: v.additionalNotes || null,
    });

    notifySponsorInquiry(v.companyName, v.contactName);

    return { success: true };
  } catch (error) {
    if (
      isUniqueViolation(error, "sponsorship_inquiries_email_unique")
    ) {
      return {
        success: false,
        error: "An inquiry with this email already exists.",
      };
    }
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "submitSponsorInquiry" },
      extra: { email: data.email },
    });
    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}
