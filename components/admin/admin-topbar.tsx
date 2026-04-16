import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/ui/icon";
import type { AdminRole } from "@/lib/admin/get-admin-session";
import { AdminMobileSidebar } from "./admin-mobile-sidebar";

export function AdminTopbar({ role }: { role: AdminRole }) {
  return (
    <header className="border-b border-border">
      <div className="max-w-8xl mx-auto h-18 flex items-center">
        <div className="px-4 md:px-8 lg:px-12 md:max-w-58 lg:max-w-64 md:w-full md:border-r border-border h-full flex items-center gap-3">
          <AdminMobileSidebar role={role} />
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3 min-w-0"
          >
            <Image
              className="w-28 min-w-24"
              src="/buildstory-logo.svg"
              alt="BuildStory"
              width={120}
              height={24}
            />
            <span className="hidden sm:inline text-xs font-mono uppercase tracking-widest text-muted-foreground bg-muted px-2 py-0.5">
              Admin
            </span>
          </Link>
        </div>

        <div className="flex justify-end w-full items-center px-4 md:px-6">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Icon name="arrow_back" size="4" />
            Back to app
          </Link>
        </div>
      </div>
    </header>
  );
}
