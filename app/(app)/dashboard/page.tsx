import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  events,
  eventProjects,
  eventRegistrations,
  profiles,
  projects,
} from "@/lib/db/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardCountdown } from "@/components/dashboard/dashboard-countdown";
import { DashboardActivityFeed } from "@/components/dashboard/dashboard-activity-feed";
import { DashboardProjectCard } from "@/components/dashboard/dashboard-project-card";
import { DashboardStreamsCard } from "@/components/dashboard/dashboard-streams-card";
import { getPublicStats, getPublicActivityFeed } from "@/lib/queries";
import {
  HACKATHON_SLUG,
  DISCORD_INVITE_URL,
} from "@/lib/constants";
import { getEventStatusLabel } from "@/lib/events";

async function getHackathonData() {
  const event = await db.query.events.findFirst({
    where: eq(events.slug, HACKATHON_SLUG),
  });

  if (!event) return null;

  const stats = await getPublicStats(event.id);
  return { event, stats };
}

async function getUserDashboardData(eventId: string) {
  const { userId } = await auth();
  if (!userId) return { isRegistered: false, project: null };

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.clerkId, userId),
  });
  if (!profile) return { isRegistered: false, project: null };

  const reg = await db.query.eventRegistrations.findFirst({
    where: and(
      eq(eventRegistrations.eventId, eventId),
      eq(eventRegistrations.profileId, profile.id)
    ),
  });
  if (!reg) return { isRegistered: false, project: null };

  // Get the user's project linked to this hackathon
  const userProject = await db.query.projects.findFirst({
    where: eq(projects.profileId, profile.id),
    with: {
      eventProjects: {
        where: eq(eventProjects.eventId, eventId),
      },
    },
  });

  const hackathonProject = userProject?.eventProjects.length
    ? userProject
    : null;

  return { isRegistered: true, project: hackathonProject };
}

export default async function DashboardPage() {
  const [data, activityFeed] = await Promise.all([
    getHackathonData(),
    getPublicActivityFeed(),
  ]);

  const serializedActivities = activityFeed.map((a) => ({
    ...a,
    timestamp: a.timestamp.toISOString(),
  }));

  const hackathon = data
    ? {
      name: data.event.name,
      description: data.event.description,
      statusLabel: getEventStatusLabel(data.event),
    }
    : {
      name: "Hackathon 00",
      description:
        "A one-week, fully remote AI building event. Build something real, share your process, and connect with builders worldwide.",
      statusLabel: "Upcoming Event",
    };

  const { isRegistered, project } = data
    ? await getUserDashboardData(data.event.id)
    : { isRegistered: false, project: null };

  return (
    <div className="p-6 md:p-8 lg:p-12 w-full space-y-6 grid lg:grid-cols-12 gap-6 md:gap-12">
      <div className="col-span-12 xl:col-span-8 flex flex-col gap-6 md:gap-12 min-w-0">
        <Card className="w-full">
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {hackathon.statusLabel}
              </p>
              <h1 className="mt-2 font-heading text-3xl md:text-5xl text-foreground">
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

            <div className="flex flex-wrap gap-4 lg:gap-8 border-t border-border pt-6 w-full justify-between px-4 md:px-8">
              <div className="flex flex-col justify-center">
                <p className="text-lg lg:text-2xl font-medium text-foreground font-mono text-center tabular-nums">{data?.stats.signups ?? 0}</p>
                <p className="text-sm text-muted-foreground text-center">people</p>
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-lg lg:text-2xl font-medium text-foreground font-mono text-center tabular-nums">{data?.stats.teamCount ?? 0}</p>
                <p className="text-sm text-muted-foreground text-center">teams</p>
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-lg lg:text-2xl font-medium text-foreground font-mono text-center tabular-nums">{data?.stats.soloCount ?? 0}</p>
                <p className="text-sm text-muted-foreground text-center">solo</p>
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-lg lg:text-2xl font-medium text-foreground font-mono text-center tabular-nums">{data?.stats.countryCount ?? 0}</p>
                <p className="text-sm text-muted-foreground text-center">countries</p>
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-lg lg:text-2xl font-medium text-foreground font-mono text-center tabular-nums">{data?.stats.projectCount ?? 0}</p>
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

        {/* Your Project — shown only if registered */}
        {isRegistered && <DashboardProjectCard project={project} />}

        {/* Live Streams */}
        <DashboardStreamsCard />
      </div>
      <aside className="col-span-12 xl:col-span-4 w-full flex flex-col gap-6">
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
            Recent Activity
          </p>
          <DashboardActivityFeed activities={serializedActivities} />
        </Card>
      </aside>
    </div>
  );
}
