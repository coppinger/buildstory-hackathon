import { Header } from "@/components/header";
import { CountdownTimer } from "@/components/countdown-timer";
import { Globe } from "@/components/globe";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ActivityFeed } from "@/components/activity-feed";
import { FAQ } from "@/components/faq";
import { BlurFade } from "@/components/blur-fade";
import Link from "next/link";
import { getHackathonEvent } from "@/lib/admin/queries";
import {
  getPublicStats,
  getPublicActivityFeed,
  getParticipantCountries,
  getParticipantNames,
} from "@/lib/queries";
import { getCoordinatesForCountries } from "@/lib/country-coordinates";
import { DISCORD_INVITE_URL } from "@/lib/constants";

// Statically rendered (no dynamic functions); without ISR the featured-event
// snapshot freezes at build time. Admin event actions also revalidate "/" for
// instant updates — this is the backstop.
export const revalidate = 60;

export default async function Home() {
  let publicStats = {
    signups: 0,
    teamCount: 0,
    soloCount: 0,
    countryCount: 0,
    projectCount: 0,
    submissionCount: 0,
  };
  let activityFeed: Awaited<ReturnType<typeof getPublicActivityFeed>> = [];
  let participantCountryCodes: string[] = [];
  let event: Awaited<ReturnType<typeof getHackathonEvent>> = undefined;
  let participantNames: Awaited<ReturnType<typeof getParticipantNames>> = [];

  try {
    event = await getHackathonEvent();
    const results = await Promise.all([
      event
        ? getPublicStats(event.id)
        : Promise.resolve({
            signups: 0,
            teamCount: 0,
            soloCount: 0,
            countryCount: 0,
            projectCount: 0,
            submissionCount: 0,
          }),
      getPublicActivityFeed(),
      event ? getParticipantCountries(event.id) : Promise.resolve([]),
      getParticipantNames(),
    ]);
    publicStats = results[0];
    activityFeed = results[1];
    participantCountryCodes = results[2];
    participantNames = results[3];
  } catch {
    // DB unavailable at build time — render with defaults, revalidate on first request
  }

  const globeLocations = getCoordinatesForCountries(participantCountryCodes);

  const serializedActivities = activityFeed.map((a) => ({
    ...a,
    timestamp: a.timestamp.toISOString(),
  }));

  return (
    <div className="relative min-h-dvh">
      <Header />

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center px-6 pt-32 md:pt-48 pb-48 md:pb-96 gap-8 text-center border-b border-border overflow-hidden max-h-screen">
        <BlurFade delay={0.1}>
          <span className="text-xs uppercase tracking-[0.2em] text-white/40 font-mono">
            community &amp; hackathons for builders
          </span>
        </BlurFade>

        <BlurFade delay={0.25} blur="16px">
          <h1 className="font-heading font-normal text-4xl sm:text-5xl md:text-7xl max-w-3xl text-white leading-tight">
            Build something real.
            <br className="hidden sm:block" />{" "}
            <span className="text-buildstory-500">Show the world.</span>
          </h1>
        </BlurFade>

        <BlurFade delay={0.4}>
          <p className="max-w-xl text-lg text-white/50">
            We&apos;re a friendly community of builders that hosts hackathons to
            help everyone grow.
          </p>
        </BlurFade>

        {/* Stats */}
        <BlurFade delay={0.55}>
          <p className="text-sm text-white/30 tracking-wide font-mono">
            {publicStats.signups} builders &middot;{" "}
            {publicStats.countryCount} countries &middot;{" "}
            {publicStats.projectCount} projects
          </p>
        </BlurFade>

        {/* Countdown — only if there's an active/upcoming event */}
        {event && (
          <BlurFade delay={0.65}>
            <CountdownTimer
              startsAt={event.startsAt.toISOString()}
              endsAt={event.endsAt.toISOString()}
            />
          </BlurFade>
        )}

        {/* CTA */}
        <BlurFade delay={0.75}>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="lg"
              asChild
              className="border-white/20 text-white bg-transparent hover:bg-white/5 hover:text-white px-8 h-12 text-sm font-medium"
            >
              <a href="#community">learn more &#8595;</a>
            </Button>
            <Link href="/sign-up">
              <Button
                size="lg"
                className="bg-buildstory-500 text-black hover:bg-white/90 px-8 h-12 text-sm font-medium ease-in duration-200"
              >
                join us
              </Button>
            </Link>
          </div>
        </BlurFade>

        {/* Globe */}
        <Globe locations={globeLocations} />
      </section>

      {/* ── Participants wall ── */}
      {participantNames.length > 0 && (
        <section className="relative z-10 px-6 border-b border-border bg-neutral-950">
          <div className="mx-auto max-w-5xl py-16 md:py-24">
            <BlurFade inView>
              <p className="text-center text-sm uppercase tracking-[0.2em] text-buildstory-500 font-mono mb-8">
                {publicStats.signups}+ builders and counting
              </p>
            </BlurFade>

            <BlurFade inView delay={0.1}>
              <p className="text-center text-base md:text-lg leading-relaxed text-white/40">
                {participantNames.map((p, i) => (
                  <span key={i} className="inline-flex items-center">
                    {i > 0 && (
                      <span className="text-white/20">, </span>
                    )}
                    {p.avatarUrl && (
                      <UserAvatar
                        avatarUrl={p.avatarUrl}
                        displayName={p.displayName}
                        size="2xs"
                        className="mr-1"
                      />
                    )}
                    {p.username ? (
                      <Link
                        href={`/profiles/${p.username}`}
                        className="text-white/60 hover:text-buildstory-400 transition-colors"
                      >
                        {p.displayName}
                      </Link>
                    ) : (
                      <span className="text-white/60">{p.displayName}</span>
                    )}
                  </span>
                ))}
              </p>
            </BlurFade>

            <BlurFade inView delay={0.2}>
              <div className="mt-10 flex justify-center">
                <Link href="/sign-up">
                  <Button
                    variant="outline"
                    className="border-white/15 text-white/60 bg-transparent hover:bg-white/5 hover:text-white px-6 h-10 text-sm font-mono"
                  >
                    add your name &#8594;
                  </Button>
                </Link>
              </div>
            </BlurFade>
          </div>
        </section>
      )}

      {/* ── Community + event teaser ── */}
      <section
        id="community"
        className="relative z-10 px-6 border-b border-border bg-neutral-950"
      >
        <div className="mx-auto grid max-w-8xl gap-16 md:grid-cols-2 md:gap-20 items-stretch border-x border-border px-6 md:px-12 lg:px-24">
          {/* Left — copy */}
          <div className="py-16 md:py-32">
            <BlurFade inView>
              <span className="text-xs uppercase tracking-[0.25em] text-buildstory-500 font-mono">
                how it works
              </span>
            </BlurFade>

            <BlurFade inView delay={0.1}>
              <h2 className="mt-10 font-heading text-3xl md:text-4xl text-[#e8e4de] leading-snug">
                Sign up. Pick a project. Ship it.
              </h2>
            </BlurFade>

            <div className="mt-8 flex flex-col gap-6">
              <BlurFade inView delay={0.15}>
                <div className="flex gap-4 items-start">
                  <span className="shrink-0 w-7 h-7 rounded-full border border-buildstory-500/40 flex items-center justify-center text-xs text-buildstory-400 font-mono">
                    1
                  </span>
                  <div>
                    <p className="text-white/80 font-medium">
                      Join the community
                    </p>
                    <p className="text-white/40 text-sm mt-1">
                      Create a profile. Tell us what you&apos;re building (or
                      want to build).
                    </p>
                  </div>
                </div>
              </BlurFade>

              <BlurFade inView delay={0.2}>
                <div className="flex gap-4 items-start">
                  <span className="shrink-0 w-7 h-7 rounded-full border border-buildstory-500/40 flex items-center justify-center text-xs text-buildstory-400 font-mono">
                    2
                  </span>
                  <div>
                    <p className="text-white/80 font-medium">
                      Build during hackathons
                    </p>
                    <p className="text-white/40 text-sm mt-1">
                      Regular week-long events. Solo or team. Any tools, any
                      skill level. AI encouraged.
                    </p>
                  </div>
                </div>
              </BlurFade>

              <BlurFade inView delay={0.25}>
                <div className="flex gap-4 items-start">
                  <span className="shrink-0 w-7 h-7 rounded-full border border-buildstory-500/40 flex items-center justify-center text-xs text-buildstory-400 font-mono">
                    3
                  </span>
                  <div>
                    <p className="text-white/80 font-medium">
                      Get recognized for shipping
                    </p>
                    <p className="text-white/40 text-sm mt-1">
                      Peer reviews, community highlights, and a track record
                      that speaks for itself.
                    </p>
                  </div>
                </div>
              </BlurFade>
            </div>

            {/* Event teaser */}
            {event && (
              <BlurFade inView delay={0.3}>
                <div className="mt-10 border border-buildstory-500/20 bg-buildstory-500/5 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-buildstory-400 font-mono">
                    {event.status === "active"
                      ? "happening now"
                      : event.status === "open"
                        ? "next event"
                        : event.name}
                  </p>
                  <p className="mt-2 text-lg font-heading text-[#e8e4de]">
                    {event.name}
                  </p>
                  <p className="mt-1 text-sm text-white/40">
                    {event.startsAt.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                    })}{" "}
                    &rarr;{" "}
                    {event.endsAt.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <Link
                    href="/sign-up"
                    className="mt-3 inline-block font-mono text-sm text-buildstory-400 underline underline-offset-4"
                  >
                    register &rarr;
                  </Link>
                </div>
              </BlurFade>
            )}

            {/* Discord link */}
            <BlurFade inView delay={0.35}>
              <a
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 font-mono text-sm text-white/40 hover:text-white/60 transition-colors"
              >
                <img
                  src="/discord.svg"
                  alt="Discord"
                  className="w-4 h-4 invert opacity-40"
                />
                join the Discord
              </a>
            </BlurFade>
          </div>

          {/* Right — activity feed */}
          <div className="relative min-h-[400px] md:min-h-0">
            <div className="absolute inset-0 overflow-hidden">
              <ActivityFeed activities={serializedActivities} />
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="relative z-10 px-6 border-b border-border bg-neutral-950">
        <div className="mx-auto max-w-8xl border-x border-border px-6 md:px-12 lg:px-24">
          <div className="py-16 md:py-24">
            <BlurFade inView>
              <span className="text-xs uppercase tracking-[0.25em] text-buildstory-500 font-mono">
                faq
              </span>
            </BlurFade>

            <BlurFade inView delay={0.15}>
              <div className="mt-10">
                <FAQ />
              </div>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 px-6 border-b border-border">
        <div className="mx-auto max-w-8xl border-x border-border px-6 md:px-12 lg:px-24">
          <div className="py-16 md:py-24 flex flex-col items-center text-center">
            <BlurFade inView>
              <h2 className="font-heading text-4xl md:text-5xl text-[#e8e4de] max-w-2xl leading-tight">
                Stop scrolling. Start building.
              </h2>
            </BlurFade>

            <BlurFade inView delay={0.1}>
              <p className="mt-4 max-w-md font-mono text-sm text-white/40 leading-relaxed">
                Free to join. All skill levels. Solo or team.
              </p>
            </BlurFade>

            <BlurFade inView delay={0.2}>
              <div className="mt-8">
                <Button
                  size="lg"
                  className="bg-buildstory-500 text-black hover:bg-white/90 px-8 h-12 text-sm font-medium ease-in duration-200"
                  asChild
                >
                  <Link href="/sign-up">join the community</Link>
                </Button>
              </div>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <section className="border-border border-x flex justify-between max-w-8xl mx-auto px-6 py-8">
        <p className="font-mono text-neutral-600">&copy; 2026 Buildstory</p>
        <p className="font-mono text-neutral-600">Show, don&apos;t tell.</p>
      </section>
    </div>
  );
}
