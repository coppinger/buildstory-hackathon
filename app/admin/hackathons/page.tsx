import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/get-admin-session";
import { getAdminEventList } from "@/lib/admin/queries";
import { AdminHackathonsClient } from "./admin-hackathons-client";

export const metadata: Metadata = {
  title: "Hackathons | Admin",
};

export default async function AdminHackathonsPage() {
  const session = await getAdminSession();
  if (!session || session.role !== "admin") redirect("/admin/dashboard");

  const events = await getAdminEventList();

  // Serialize dates for client component
  const serialized = events.map((e) => ({
    ...e,
    startsAt: e.startsAt.toISOString(),
    endsAt: e.endsAt.toISOString(),
    registrationOpensAt: e.registrationOpensAt?.toISOString() ?? null,
    registrationClosesAt: e.registrationClosesAt?.toISOString() ?? null,
    reviewOpensAt: e.reviewOpensAt?.toISOString() ?? null,
    reviewClosesAt: e.reviewClosesAt?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }));

  return <AdminHackathonsClient events={serialized} />;
}
