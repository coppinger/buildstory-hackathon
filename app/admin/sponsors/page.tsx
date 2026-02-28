import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/get-admin-session";
import {
  getSponsorInquiries,
  getSponsorInquiryStats,
} from "@/lib/admin/queries";
import { AdminSponsorsClient } from "./admin-sponsors-client";

export default async function AdminSponsorsPage() {
  const session = await getAdminSession();
  if (!session || session.role !== "admin") redirect("/");

  const [inquiries, stats] = await Promise.all([
    getSponsorInquiries(),
    getSponsorInquiryStats(),
  ]);

  const serialized = inquiries.map((i) => ({
    ...i,
    reviewedAt: i.reviewedAt?.toISOString() ?? null,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  }));

  return <AdminSponsorsClient inquiries={serialized} stats={stats} />;
}
