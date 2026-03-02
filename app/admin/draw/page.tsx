import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/get-admin-session";
import { getDrawHistory } from "./actions";
import { AdminDrawClient } from "./admin-draw-client";

export default async function AdminDrawPage() {
  const session = await getAdminSession();
  if (!session || session.role !== "admin") redirect("/admin/dashboard");

  const history = await getDrawHistory();

  return <AdminDrawClient initialHistory={history} />;
}
