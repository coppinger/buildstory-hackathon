import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

const superAdminIds = (process.env.ADMIN_USER_IDS ?? "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

export function isSuperAdmin(clerkUserId: string): boolean {
  return superAdminIds.includes(clerkUserId);
}

export async function getRole(
  clerkUserId: string
): Promise<"user" | "moderator" | "admin"> {
  if (isSuperAdmin(clerkUserId)) return "admin";

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.clerkId, clerkUserId),
    columns: { role: true },
  });

  return profile?.role ?? "user";
}

export async function isAdmin(clerkUserId: string): Promise<boolean> {
  const role = await getRole(clerkUserId);
  return role === "admin";
}

export async function isModerator(clerkUserId: string): Promise<boolean> {
  const role = await getRole(clerkUserId);
  return role === "admin" || role === "moderator";
}

export async function canAccessAdmin(clerkUserId: string): Promise<boolean> {
  return isModerator(clerkUserId);
}
