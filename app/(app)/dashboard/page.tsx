import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  eventProjects,
  eventRegistrations,
  eventSubmissions,
  profiles,
  projects,
} from "@/lib/db/schema";
import { Card } from "@/components/ui/card";
import { DashboardCountdown } from "@/components/dashboard/dashboard-countdown";
import { DashboardActivityFeed } from "@/components/dashboard/dashboard-activity-feed";
import { DashboardProjectCard } from "@/components/dashboard/dashboard-project-card";
import { DashboardStreamsCard } from "@/components/dashboard/dashboard-streams-card";
import { DashboardSubmissionsFeed } from "@/components/dashboard/dashboard-submissions-feed";
import { DiscordCard } from "@/components/dashboard/discord-card";
import { HighlightCtaCard } from "@/components/dashboard/highlight-cta-card";
import { SectionLabel } from "@/components/ui/section-label";
import { getPublicStats, getPublicActivityFeed, getSubmissionsFeed, getFeaturedEvent } from "@/lib/queries";
import { getEventStateLabel, isSubmissionOpen } from "@/lib/events";

export const metadata: Metadata = {
  title: "Dashboard",
};

async function getHackathonData() {
  const event = await getFeaturedEvent();

  if (!event) return null;

  const [stats, submissionsFeed] = await Promise.all([
    getPublicStats(event.id),
    getSubmissionsFeed(event.id, 8),
  ]);
  return { event, stats, submissionsFeed };
}

async function getUserDashboardData(eventId: string) {
  const { userId } = await auth();
  if (!userId)
    return { isRegistered: false, project: null, hasSubmission: false, discordCardDismissed: false };

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.clerkId, userId),
  });
  if (!profile)
    return { isRegistered: false, project: null, hasSubmission: false, discordCardDismissed: false };

  const discordCardDismissed = profile.discordCardDismissed;

  const reg = await db.query.eventRegistrations.findFirst({
    where: and(
      eq(eventRegistrations.eventId, eventId),
      eq(eventRegistrations.profileId, profile.id)
    ),
  });
  if (!reg)
    return { isRegistered: false, project: null, hasSubmission: false, discordCardDismissed };

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

  // Check if user has submitted
  let hasSubmission = false;
  if (hackathonProject) {
    const submission = await db.query.eventSubmissions.findFirst({
      where: and(
        eq(eventSubmissions.projectId, hackathonProject.id),
        eq(eventSubmissions.eventId, eventId)
      ),
      columns: { id: true },
    });
    hasSubmission = !!submission;
  }

  return { isRegistered: true, project: hackathonProject, hasSubmission, discordCardDismissed };
}

export default async function DashboardPage() {
  const [data, activityFeed] = await Promise.all([
    getHackathonData(),
    getPublicActivityFeed(24),
  ]);

  const serializedActivities = activityFeed.map((activity) => ({
    type: activity.type,
    displayName: activity.displayName,
    username: activity.username,
    avatarUrl: activity.avatarUrl,
    detail: activity.detail,
  }));

  const hackathon = data
    ? {
      name: data.event.name,
      description: data.event.description,
      statusLabel: getEventStateLabel(data.event.status),
      startsAt: data.event.startsAt,
      endsAt: data.event.endsAt,
    }
    : {
      name: "Hackathon #01",
      description:
        "The second Buildstory hackathon. One week, fully remote. Build something real with AI tools, share your process, and connect with builders worldwide.",
      statusLabel: "Upcoming Event",
      startsAt: null,
      endsAt: null,
    };

  const { isRegistered, project, hasSubmission, discordCardDismissed } = data
    ? await getUserDashboardData(data.event.id)
    : { isRegistered: false, project: null, hasSubmission: false, discordCardDismissed: false };

  return (
    <div className="p-6 md:p-8 lg:p-12 w-full space-y-6 grid lg:grid-cols-12 gap-6 md:gap-12">
      <div className="col-span-12 xl:col-span-8 flex flex-col gap-6 md:gap-12 min-w-0">
        <div className="w-full">
          <div className="flex flex-col gap-6">
            <div>
              <SectionLabel>{hackathon.statusLabel}</SectionLabel>
              <h1 className="mt-5 font-heading text-3xl md:text-5xl text-foreground">
                {hackathon.name}
              </h1>
              <p className="mt-4 text-muted-foreground font-mono">
                {hackathon.startsAt && hackathon.endsAt
                  ? `${hackathon.startsAt.toLocaleDateString("en-US", { month: "long", day: "numeric" })} – ${hackathon.endsAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · Fully remote`
                  : "Fully remote"}
              </p>
            </div>

            <p className="text-base text-muted-foreground max-w-2xl">
              {hackathon.description}
            </p>

            {hackathon.startsAt && hackathon.endsAt && (
              <DashboardCountdown startsAt={hackathon.startsAt.getTime()} endsAt={hackathon.endsAt.getTime()} />
            )}

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
              <div className="flex flex-col justify-center">
                <p className="text-lg lg:text-2xl font-medium text-foreground font-mono text-center tabular-nums">{data?.stats.submissionCount ?? 0}</p>
                <p className="text-sm text-muted-foreground text-center">submitted</p>
              </div>
            </div>
          </div>
        </div>

        {!isRegistered && (
          <HighlightCtaCard
            title="Join the hackathon"
            description="Register now to participate in Hackathon #01. Solo or team — all skill levels welcome."
            ctaHref="/hackathon"
            ctaLabel="Register now"
          />
        )}

        {isRegistered && <DashboardProjectCard project={project} hasSubmission={hasSubmission} submissionOpen={data ? isSubmissionOpen(data.event) : false} />}

        {data?.submissionsFeed && data.submissionsFeed.length > 0 && (
          <DashboardSubmissionsFeed items={data.submissionsFeed} />
        )}

        <DashboardStreamsCard />
      </div>
      <aside className="col-span-12 xl:col-span-4 w-full flex flex-col gap-6">
        {!discordCardDismissed && <DiscordCard />}

        <Card className="w-full relative overflow-hidden flex flex-col flex-1 max-h-96">
          <SectionLabel className="mb-2">Recent Activity</SectionLabel>
          <DashboardActivityFeed activities={serializedActivities} />
        </Card>
      </aside>
    </div>
  );
}
