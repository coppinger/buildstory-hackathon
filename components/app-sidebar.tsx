"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { XIcon, TwitchIcon, DiscordIcon } from "@/components/icons";
import { DISCORD_INVITE_URL, TWITCH_URL, X_URL } from "@/lib/constants";
import { useLiveStreamers } from "@/lib/streamers/use-live-streamers";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Hackathons", href: "/hackathons" },
  { label: "Projects", href: "/projects" },
  { label: "Members", href: "/members" },
  { label: "Live Streams", href: "/streamers" },
  { label: "Tools", href: "/tools" },
  { label: "Roadmap", href: "/roadmap" },
  { label: "Settings", href: "/settings" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { streamers } = useLiveStreamers();
  const liveCount = streamers.length;

  return (
    <aside className="hidden md:block px-12 w-58 lg:w-64 shrink-0 border-r border-border min-h-full">
      <div className="sticky top-0 flex flex-col min-h-screen py-8">
        <nav className="flex flex-col gap-4 lg:gap-8">
          {navItems.map(({ label, href }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + "/");
            const isLiveStreams = label === "Live Streams";

            return (
              <Link key={href} href={href}>
                <div>
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
                  {isLiveStreams && liveCount > 0 && (
                    <p className="text-xs text-[#6441a5] mt-0.5">
                      {liveCount} {liveCount === 1 ? "stream" : "streams"} live right now
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-6 mt-8">
          <a
            href={X_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="X (Twitter)"
          >
            <XIcon className="w-4 h-4" />
          </a>
          <a
            href={TWITCH_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Twitch"
          >
            <TwitchIcon className="w-4 h-4" />
          </a>
          <a
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Discord"
          >
            <DiscordIcon className="w-4 h-4" />
          </a>
        </div>
      </div>
    </aside>
  );
}
