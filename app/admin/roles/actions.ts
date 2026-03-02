"use server";

import { auth } from "@clerk/nextjs/server";
import { eq, or, ilike } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import { profiles, adminAuditLog } from "@/lib/db/schema";
import { isAdmin, isSuperAdmin } from "@/lib/admin";
import { searchQuerySchema, parseInput } from "@/lib/db/validations";

type ActionResult = { success: true } | { success: false; error: string };

export async function setUserRole(data: {
  profileId: string;
  role: "user" | "moderator" | "admin";
}): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId || !(await isAdmin(userId))) {
      return { success: false, error: "Only admins can manage roles" };
    }

    const target = await db.query.profiles.findFirst({
      where: eq(profiles.id, data.profileId),
      columns: { id: true, clerkId: true, role: true },
    });
    if (!target) return { success: false, error: "User not found" };

    // Cannot change super-admin roles
    if (isSuperAdmin(target.clerkId)) {
      return { success: false, error: "Cannot change a super-admin's role" };
    }

    // Cannot change own role
    const actor = await db.query.profiles.findFirst({
      where: eq(profiles.clerkId, userId),
      columns: { id: true },
    });
    if (!actor) return { success: false, error: "Actor profile not found" };
    if (actor.id === data.profileId) {
      return { success: false, error: "Cannot change your own role" };
    }

    // No-op if same role
    if (target.role === data.role) {
      return { success: true };
    }

    const oldRole = target.role;

    await db
      .update(profiles)
      .set({ role: data.role })
      .where(eq(profiles.id, data.profileId));

    await db.insert(adminAuditLog).values({
      actorProfileId: actor.id,
      action: "set_role",
      targetProfileId: data.profileId,
      metadata: JSON.stringify({ oldRole, newRole: data.role }),
    });

    revalidatePath("/admin/roles");
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "setUserRole" },
      extra: { profileId: data.profileId, role: data.role },
    });
    return { success: false, error: "Failed to update role" };
  }
}

export async function searchProfilesByName(query: string) {
  try {
    const parsed = parseInput(searchQuerySchema, { query });
    if (!parsed.success) return [];
    if (parsed.data.query.length < 2) return [];

    const pattern = `%${parsed.data.query}%`;

    const results = await db
      .select({
        id: profiles.id,
        displayName: profiles.displayName,
        username: profiles.username,
        avatarUrl: profiles.avatarUrl,
        role: profiles.role,
        clerkId: profiles.clerkId,
      })
      .from(profiles)
      .where(
        or(
          ilike(profiles.displayName, pattern),
          ilike(profiles.username, pattern)
        )
      )
      .limit(10);

    return results;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "searchProfilesByName" },
      extra: { query },
    });
    return [];
  }
}
