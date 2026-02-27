import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/get-admin-session";
import { getAdminUserList, getAdminUserStats } from "@/lib/admin/queries";
import { AdminUsersClient } from "./admin-users-client";

export default async function AdminUsersPage() {
  const session = await getAdminSession();
  if (!session) redirect("/");

  const [users, stats] = await Promise.all([
    getAdminUserList(),
    getAdminUserStats(),
  ]);

  const serializedUsers = users.map((u) => ({
    ...u,
    bannedAt: u.bannedAt?.toISOString() ?? null,
    hiddenAt: u.hiddenAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <AdminUsersClient
      users={serializedUsers}
      stats={stats}
      currentRole={session.role}
    />
  );
}
