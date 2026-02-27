import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import { getRole, canAccessAdmin } from "@/lib/admin";

export const getAdminSession = cache(async () => {
  const { userId } = await auth();
  if (!userId) return null;

  const hasAccess = await canAccessAdmin(userId);
  if (!hasAccess) return null;

  const role = await getRole(userId);
  // canAccessAdmin guarantees role is "admin" or "moderator"
  return { userId, role: role as "admin" | "moderator" };
});
