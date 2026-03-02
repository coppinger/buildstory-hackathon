"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { XIcon, TwitchIcon, DiscordIcon } from "@/components/icons";
import { DISCORD_INVITE_URL } from "@/lib/constants";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Projects", href: "/projects" },
  { label: "Members", href: "/members" },
  { label: "Live Streams", href: "/streamers" },
  { label: "Settings", href: "/settings" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchLiveCount() {
      try {
        const res = await fetch("/api/streamers");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setLiveCount(data.streamers?.length ?? 0);
        }
      } catch {
        // Silently ignore -- badge just won't show
      }
    }

    fetchLiveCount();

    // Refresh every 60 seconds to match the API cache TTL
    const interval = setInterval(fetchLiveCount, 60_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <aside className="hidden md:block px-16 w-58 lg:w-63 shrink-0 border-r border-border min-h-full">
      <div className="sticky top-0 flex flex-col justify-between min-h-screen py-8">
        <nav className="flex flex-col gap-4 lg:gap-6">
          {navItems.map(({ label, href }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + "/");
            const isLiveStreams = label === "Live Streams";

            return (
              <Link key={href} href={href}>
                <p
                  className={cn(
                    "text-lg lg:text-xl font-medium transition-colors flex items-center gap-2",
                    isActive
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                  {isLiveStreams && liveCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-semibold text-white rounded-full bg-[#9146FF]">
                      {liveCount}
                    </span>
                  )}
                </p>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4 pb-4">
          <a
            href="https://x.com/buildstory"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="X (Twitter)"
          >
            <XIcon className="w-5 h-5" />
          </a>
          <a
            href="https://twitch.tv/buildstory"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Twitch"
          >
            <TwitchIcon className="w-5 h-5" />
          </a>
          <a
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Discord"
          >
            <DiscordIcon className="w-5 h-5" />
          </a>
        </div>
      </div>
    </aside>
  );
}
