import { eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

export async function ensureProfile() {
  const user = await currentUser();
  if (!user) return null;

  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.clerkId, user.id),
  });
  if (existing) return existing;

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    "User";

  const [created] = await db
    .insert(profiles)
    .values({ clerkId: user.id, displayName })
    .onConflictDoNothing({ target: profiles.clerkId })
    .returning();

  return created ?? (await db.query.profiles.findFirst({
    where: eq(profiles.clerkId, user.id),
  }));
}
