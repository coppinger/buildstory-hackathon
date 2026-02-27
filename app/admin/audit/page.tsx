import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/get-admin-session";
import { getAuditLog } from "@/lib/admin/queries";
import { AdminAuditClient } from "./admin-audit-client";

export default async function AdminAuditPage() {
  const session = await getAdminSession();
  if (!session || session.role !== "admin") redirect("/admin/dashboard");

  const entries = await getAuditLog(100);

  const serialized = entries.map((e) => ({
    ...e,
    createdAt: e.createdAt.toISOString(),
  }));

  return <AdminAuditClient entries={serialized} />;
}
