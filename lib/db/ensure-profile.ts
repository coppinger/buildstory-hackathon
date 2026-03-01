import { cache } from "react";
import { eq } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

export const ensureProfile = cache(async (clerkId: string) => {
  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.clerkId, clerkId),
  });
  if (existing) return existing;

  // Environment guard: block test Clerk keys from creating profiles in production
  if (
    process.env.NODE_ENV !== "test" &&
    process.env.VERCEL_ENV === "production" &&
    process.env.CLERK_SECRET_KEY?.startsWith("sk_test_")
  ) {
    const err = new Error(
      "Refusing to create profile: test Clerk key detected in production environment"
    );
    Sentry.captureException(err, {
      tags: { component: "ensure-profile", guard: "env-mismatch" },
      extra: { clerkId },
    });
    throw err;
  }

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(clerkId);
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    "User";

  const [created] = await db
    .insert(profiles)
    .values({ clerkId, displayName, avatarUrl: user.hasImage ? user.imageUrl : null })
    .onConflictDoNothing({ target: profiles.clerkId })
    .returning();

  return created ?? (await db.query.profiles.findFirst({
    where: eq(profiles.clerkId, clerkId),
  }));
});
