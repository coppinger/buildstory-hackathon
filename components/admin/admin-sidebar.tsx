"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import type { AdminRole } from "@/lib/admin/get-admin-session";
import { adminNavItems } from "./admin-nav-items";

export function AdminSidebar({ role }: { role: AdminRole }) {
  const pathname = usePathname();
  const items = adminNavItems.filter((item) =>
    item.adminOnly ? role === "admin" : true
  );

  return (
    <aside className="hidden md:block px-8 lg:px-12 w-58 lg:w-64 shrink-0 border-r border-border min-h-full">
      <div className="sticky top-0 flex flex-col min-h-dvh py-8">
        <nav className="flex flex-col gap-3 lg:gap-4">
          {items.map(({ label, href, icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + "/");

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 text-base lg:text-lg font-medium transition-colors",
                  isActive
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon name={icon} size="5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
