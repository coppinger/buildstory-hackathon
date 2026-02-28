"use server";

import * as Sentry from "@sentry/nextjs";
import { NeonDbError } from "@neondatabase/serverless";
import { db } from "@/lib/db";
import { sponsorshipInquiries } from "@/lib/db/schema";
import { notifySponsorInquiry } from "@/lib/discord";

type ActionResult = { success: true } | { success: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function isUniqueViolation(error: unknown, constraintName: string): boolean {
  const cause =
    error instanceof Error && error.cause instanceof NeonDbError
      ? error.cause
      : error instanceof NeonDbError
        ? error
        : null;
  return cause?.code === "23505" && cause?.constraint === constraintName;
}

export async function submitSponsorInquiry(data: {
  companyName: string;
  contactName: string;
  email: string;
  websiteUrl: string;
  offerDescription: string;
  additionalNotes: string;
}): Promise<ActionResult> {
  try {
    const companyName = data.companyName.trim();
    const contactName = data.contactName.trim();
    const email = data.email.trim().toLowerCase();
    const websiteUrl = data.websiteUrl.trim() || null;
    const offerDescription = data.offerDescription.trim();
    const additionalNotes = data.additionalNotes.trim() || null;

    // Required field checks
    if (!companyName)
      return { success: false, error: "Company name is required" };
    if (!contactName)
      return { success: false, error: "Contact name is required" };
    if (!email || !EMAIL_RE.test(email))
      return { success: false, error: "Valid email is required" };
    if (!offerDescription)
      return { success: false, error: "Offer description is required" };

    // Length limits
    if (companyName.length > 200)
      return { success: false, error: "Company name is too long" };
    if (contactName.length > 200)
      return { success: false, error: "Contact name is too long" };
    if (email.length > 320)
      return { success: false, error: "Email is too long" };
    if (offerDescription.length > 5000)
      return {
        success: false,
        error: "Offer description is too long (max 5000 characters)",
      };
    if (additionalNotes && additionalNotes.length > 2000)
      return {
        success: false,
        error: "Additional notes are too long (max 2000 characters)",
      };

    // URL validation
    if (websiteUrl && websiteUrl.length > 500)
      return { success: false, error: "Website URL is too long" };
    if (websiteUrl && !/^https?:\/\//i.test(websiteUrl))
      return {
        success: false,
        error: "Website URL must start with http:// or https://",
      };

    await db.insert(sponsorshipInquiries).values({
      companyName,
      contactName,
      email,
      websiteUrl,
      offerDescription,
      additionalNotes,
    });

    notifySponsorInquiry(companyName, contactName);

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
