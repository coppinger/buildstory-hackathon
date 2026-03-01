"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Projects", href: "/projects" },
  { label: "Members", href: "/members" },
  { label: "Streamers", href: "/streamers" },
  { label: "Settings", href: "/settings" },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:block px-16 w-58 lg:w-63 shrink-0 border-r border-border min-h-full">
      <nav className="sticky top-0 flex flex-col gap-4 lg:gap-6 py-8">
        {navItems.map(({ label, href }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/");

          return (
            <Link key={href} href={href}>
              <p
                className={cn(
                  "text-lg lg:text-xl font-medium transition-colors",
                  isActive
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </p>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
