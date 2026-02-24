import { NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

export async function POST(req: NextRequest) {
  const evt = await verifyWebhook(req);

  if (evt.type === "user.created") {
    const { id, first_name, last_name, username } = evt.data;

    const displayName =
      [first_name, last_name].filter(Boolean).join(" ") || username || "User";

    await db.insert(profiles).values({
      clerkId: id,
      displayName,
    });
  }

  return new Response("OK", { status: 200 });
}
