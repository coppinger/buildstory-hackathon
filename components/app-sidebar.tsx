"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Hackathon", href: "/hackathon" },
  { label: "Projects", href: "/projects" },
  { label: "Profiles", href: "/profiles" },
  { label: "Teams", href: "/teams" },
  { label: "Forum", href: "/forum" },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="px-16 py-8 max-w-xs w-full border-r border-border">
      <nav className="flex flex-col gap-8">
        {navItems.map(({ label, href }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/");

          return (
            <Link key={href} href={href}>
              <p
                className={cn(
                  "text-xl font-medium transition-colors",
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
