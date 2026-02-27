import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/get-admin-session";
import {
  getMentorApplications,
  getMentorApplicationStats,
} from "@/lib/admin/queries";
import { AdminMentorsClient } from "./admin-mentors-client";

export default async function AdminMentorsPage() {
  const session = await getAdminSession();
  if (!session || session.role !== "admin") redirect("/");

  const [applications, stats] = await Promise.all([
    getMentorApplications(),
    getMentorApplicationStats(),
  ]);

  const serialized = applications.map((a) => ({
    ...a,
    reviewedAt: a.reviewedAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  return <AdminMentorsClient applications={serialized} stats={stats} />;
}
