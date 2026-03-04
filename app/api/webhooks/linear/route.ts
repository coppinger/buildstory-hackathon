import { type NextRequest } from "next/server";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import { featureBoardItems } from "@/lib/db/schema";
import { mapLinearStateToStatus } from "@/lib/linear";

function verifySignature(body: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
}

export async function POST(request: NextRequest) {
  const secret = process.env.LINEAR_WEBHOOK_SECRET;
  if (!secret) {
    Sentry.captureMessage("LINEAR_WEBHOOK_SECRET is not configured", {
      level: "warning",
      tags: { component: "webhook", event: "linear" },
    });
    return new Response("Webhook not configured", { status: 500 });
  }

  const rawBody = await request.text();

  const signature = request.headers.get("linear-signature");
  if (!signature) {
    return new Response("Missing signature", { status: 401 });
  }

  try {
    if (!verifySignature(rawBody, signature, secret)) {
      return new Response("Invalid signature", { status: 401 });
    }
  } catch {
    return new Response("Signature verification failed", { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  try {
    const action = payload.action as string | undefined;
    const type = payload.type as string | undefined;

    // Only handle Issue update events
    if (type !== "Issue" || action !== "update") {
      return new Response("OK", { status: 200 });
    }

    const updatedFrom = payload.updatedFrom as Record<string, unknown> | undefined;
    if (!updatedFrom || !("stateId" in updatedFrom)) {
      // Not a status change — ignore
      return new Response("OK", { status: 200 });
    }

    const issueData = payload.data as Record<string, unknown> | undefined;
    if (!issueData) {
      return new Response("OK", { status: 200 });
    }

    const linearIssueId = issueData.id as string | undefined;
    if (!linearIssueId) {
      return new Response("OK", { status: 200 });
    }

    // Get the state name from the issue data
    const state = issueData.state as Record<string, unknown> | undefined;
    const stateName = state?.name as string | undefined;

    if (!stateName) {
      return new Response("OK", { status: 200 });
    }

    const mappedStatus = mapLinearStateToStatus(stateName);
    if (!mappedStatus) {
      // Unknown Linear state — log a warning but don't error
      Sentry.captureMessage(`Unknown Linear state: "${stateName}"`, {
        level: "warning",
        tags: { component: "webhook", event: "linear-status-sync" },
        extra: { linearIssueId, stateName },
      });
      return new Response("OK", { status: 200 });
    }

    // Look up the feature board item by Linear issue ID
    const item = await db.query.featureBoardItems.findFirst({
      where: eq(featureBoardItems.linearIssueId, linearIssueId),
      columns: { id: true, status: true, slug: true },
    });

    if (!item) {
      // No matching item — not an error, just not a tracked issue
      return new Response("OK", { status: 200 });
    }

    // Skip if the status hasn't actually changed
    if (item.status === mappedStatus) {
      return new Response("OK", { status: 200 });
    }

    const updates: Record<string, unknown> = {
      status: mappedStatus,
    };

    // Handle shippedAt transitions
    if (mappedStatus === "shipped" && item.status !== "shipped") {
      updates.shippedAt = new Date();
    } else if (mappedStatus !== "shipped" && item.status === "shipped") {
      updates.shippedAt = null;
    }

    await db
      .update(featureBoardItems)
      .set(updates)
      .where(eq(featureBoardItems.id, item.id));

    revalidatePath("/roadmap");
    if (item.slug) revalidatePath(`/roadmap/${item.slug}`);

    return new Response("OK", { status: 200 });
  } catch (error) {
    const issueId = (payload?.data as Record<string, unknown>)?.id;
    Sentry.captureException(error, {
      tags: { component: "webhook", event: "linear-status-sync" },
      extra: { linearIssueId: issueId ?? "unknown" },
    });
    // Return 200 even on internal errors — Linear doesn't need to retry for our issues
    return new Response("OK", { status: 200 });
  }
}
