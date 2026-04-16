"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { AdminRole } from "@/lib/admin/get-admin-session";
import { adminNavItems } from "./admin-nav-items";

const noopSubscribe = () => () => {};

function useHasMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

export function AdminMobileSidebar({ role }: { role: AdminRole }) {
  const mounted = useHasMounted();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const items = adminNavItems.filter((item) =>
    item.adminOnly ? role === "admin" : true
  );

  const triggerButton = (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden"
      aria-label="Open admin menu"
    >
      <Icon name="menu" size="6" />
    </Button>
  );

  // Mount guard avoids Radix Dialog's useId SSR/hydration mismatch on aria-controls.
  if (!mounted) return triggerButton;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{triggerButton}</SheetTrigger>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="w-64 px-8 pt-8"
      >
        <SheetTitle className="sr-only">Admin navigation</SheetTitle>
        <nav className="flex flex-col gap-3">
          {items.map(({ label, href, icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + "/");

            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 text-base font-medium transition-colors",
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
      </SheetContent>
    </Sheet>
  );
}
