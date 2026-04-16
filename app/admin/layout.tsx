import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { getAdminSession } from "@/lib/admin/get-admin-session";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | Admin | Buildstory",
  },
  robots: { index: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/");

  return (
    <div className="dark min-h-dvh bg-background text-foreground flex flex-col">
      <AdminTopbar role={session.role} />
      <div className="mx-auto w-full max-w-8xl flex flex-1">
        <AdminSidebar role={session.role} />
        <main className="flex-1 min-w-0 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
