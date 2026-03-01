import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/get-admin-session";
import { getTwitchCategories } from "@/lib/admin/queries";
import { AdminStreamersClient } from "./admin-streamers-client";

export default async function AdminStreamersPage() {
  const session = await getAdminSession();
  if (!session || session.role !== "admin") redirect("/");

  const categories = await getTwitchCategories();

  const serialized = categories.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));

  return <AdminStreamersClient categories={serialized} />;
}
