import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  events,
  eventRegistrations,
  profiles,
} from "@/lib/db/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardCountdown } from "@/components/dashboard/dashboard-countdown";
import { DashboardActivityFeed } from "@/components/dashboard/dashboard-activity-feed";
import { getPublicStats } from "@/lib/queries";
import {
  HACKATHON_SLUG,
  DISCORD_INVITE_URL,
  SPONSOR_CREDITS_URL,
  DOCS_URL,
} from "@/lib/constants";

async function getHackathonData() {
  const event = await db.query.events.findFirst({
    where: eq(events.slug, HACKATHON_SLUG),
  });

  if (!event) return null;

  const stats = await getPublicStats(event.id);
  return { event, stats };
}

async function isUserRegistered(eventId: string) {
  const { userId } = await auth();
  if (!userId) return false;

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.clerkId, userId),
  });
  if (!profile) return false;

  const reg = await db.query.eventRegistrations.findFirst({
    where: and(
      eq(eventRegistrations.eventId, eventId),
      eq(eventRegistrations.profileId, profile.id)
    ),
  });

  return !!reg;
}

export default async function DashboardPage() {
  const data = await getHackathonData();

  const hackathon = data
    ? {
        name: data.event.name,
        description: data.event.description,
      }
    : {
        name: "Hackathon 00",
        description:
          "A one-week, fully remote AI building event. Build something real, share your process, and connect with builders worldwide.",
      };

  const isRegistered = data ? await isUserRegistered(data.event.id) : false;

  return (
    <div className="dark p-8 lg:p-12 w-full space-y-6 flex gap-12">
      <div className="w-full flex flex-col gap-12">
        {/* Hackathon Summary */}
      <Card className="w-full">
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              upcoming event
            </p>
            <h1 className="mt-2 font-heading text-5xl text-foreground">
              {hackathon.name}
            </h1>
            <p className="mt-1 text-muted-foreground font-mono">
              March 1–8, 2026 · Fully remote
            </p>
          </div>

          <p className="text-base text-muted-foreground max-w-2xl">
            {hackathon.description}
          </p>

          <DashboardCountdown />

          <div className="flex gap-8 border-t border-border pt-6 w-full justify-between px-8">
            <div className="flex flex-col justify-center">
              <p className="text-2xl font-medium text-foreground font-mono text-center tabular-nums">{data?.stats.signups ?? 0}</p>
              <p className="text-sm text-muted-foreground text-center">people</p>
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-2xl font-medium text-foreground font-mono text-center tabular-nums">{data?.stats.teamCount ?? 0}</p>
              <p className="text-sm text-muted-foreground text-center">teams</p>
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-2xl font-medium text-foreground font-mono text-center tabular-nums">{data?.stats.soloCount ?? 0}</p>
              <p className="text-sm text-muted-foreground text-center">solo</p>
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-2xl font-medium text-foreground font-mono text-center tabular-nums">{data?.stats.countryCount ?? 0}</p>
              <p className="text-sm text-muted-foreground text-center">countries</p>
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-2xl font-medium text-foreground font-mono text-center tabular-nums">{data?.stats.projectCount ?? 0}</p>
              <p className="text-sm text-muted-foreground text-center">projects</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Register CTA — hidden if registered */}
      {!isRegistered && (
        <Card className="w-full border-buildstory-500/30 bg-buildstory-900/20">
          <div className="flex flex-col justify-between gap-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Join the hackathon
              </h2>
              <p className="mt-1 text-muted-foreground">
                Register now to participate in Hackathon 00. Solo or team — all
                skill levels welcome.
              </p>
            </div>
            <Button
              asChild
              className="shrink-0 w-fit bg-buildstory-500 text-background text-sm"
              size={"lg"}
            >
              <Link href="/hackathon">Register now</Link>
            </Button>
          </div>
        </Card>
      )}

      {/* Bottom section: remaining cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Streams */}
        <Card className="w-full">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Live Streams
          </p>
          <div className="flex items-center gap-3 border border-border p-3">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                Sarah Chen
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Building an AI Recipe Remixer
              </p>
            </div>
          </div>
        </Card>

        {/* Resources */}
        <Card className="w-full">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Resources
          </p>
          <div className="flex flex-col gap-2">
            <a
              href={SPONSOR_CREDITS_URL}
              className="text-sm text-foreground hover:text-buildstory-600 transition-colors flex items-center justify-between group"
            >
              <span>Sponsor credits</span>
              <span className="text-muted-foreground group-hover:text-buildstory-600 transition-colors">
                →
              </span>
            </a>
            <a
              href={DOCS_URL}
              className="text-sm text-foreground hover:text-buildstory-600 transition-colors flex items-center justify-between group"
            >
              <span>Documentation</span>
              <span className="text-muted-foreground group-hover:text-buildstory-600 transition-colors">
                →
              </span>
            </a>
            <a
              href="https://doitlive.club"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-foreground hover:text-buildstory-600 transition-colors flex items-center justify-between group"
            >
              <span>Streaming guide</span>
              <span className="text-muted-foreground group-hover:text-buildstory-600 transition-colors">
                →
              </span>
            </a>
          </div>
        </Card>
      </div>
      </div>
      <aside className="max-w-xs w-full flex flex-col gap-6">
        {/* Discord */}
        <Card className="w-full">
          <div className="flex items-start gap-4">
            <img
              src="/discord.svg"
              alt=""
              className="w-5 h-5 mt-0.5 brightness-0 invert"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">
                Buildstory Discord
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Find teammates, get help, and share your progress.
              </p>
              <Button variant="outline" size="sm" className="mt-3 bg-[#5F66EB] text-white" asChild>
                <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer">
                  Join the Discord
                </a>
              </Button>
            </div>
          </div>
        </Card>

        {/* Activity Feed */}
        <Card className="w-full relative overflow-hidden flex flex-col flex-1 max-h-96">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
            Activity
          </p>
          <DashboardActivityFeed />
        </Card>
      </aside>
    </div>
  );
}
