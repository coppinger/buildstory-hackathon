import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/get-admin-session";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { sql, desc } from "drizzle-orm";
import { isSuperAdmin } from "@/lib/admin";
import { AdminRolesClient } from "./admin-roles-client";

export default async function AdminRolesPage() {
  const session = await getAdminSession();
  if (!session || session.role !== "admin") redirect("/admin/dashboard");

  const elevated = await db
    .select({
      id: profiles.id,
      clerkId: profiles.clerkId,
      displayName: profiles.displayName,
      username: profiles.username,
      avatarUrl: profiles.avatarUrl,
      role: profiles.role,
    })
    .from(profiles)
    .where(sql`${profiles.role} IN ('admin', 'moderator')`)
    .orderBy(desc(profiles.role));

  const serialized = elevated.map((p) => ({
    ...p,
    isSuperAdmin: isSuperAdmin(p.clerkId),
  }));

  return <AdminRolesClient elevatedUsers={serialized} />;
}
