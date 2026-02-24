import { eq } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

export async function ensureProfile(clerkId: string) {
  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.clerkId, clerkId),
  });
  if (existing) return existing;

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(clerkId);
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    "User";

  const [created] = await db
    .insert(profiles)
    .values({ clerkId, displayName })
    .onConflictDoNothing({ target: profiles.clerkId })
    .returning();

  return created ?? (await db.query.profiles.findFirst({
    where: eq(profiles.clerkId, clerkId),
  }));
}
