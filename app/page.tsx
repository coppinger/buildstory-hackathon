import { Header } from "@/components/header";
import { CountdownTimer } from "@/components/countdown-timer";
import { Globe } from "@/components/globe";
import { Button } from "@/components/ui/button";
import { ActivityFeed } from "@/components/activity-feed";
import { FAQ } from "@/components/faq";
import { Badge } from "@/components/ui/badge";
import { BlurFade } from "@/components/blur-fade";
import Link from "next/link";
import {
  getFeaturedEvent,
  getEventBySlug,
  getPublicStats,
  getPublicActivityFeed,
  getParticipantCountries,
} from "@/lib/queries";
import { getCoordinatesForCountries } from "@/lib/country-coordinates";
import { VOLUNTEER_URL, SPONSOR_URL } from "@/lib/constants";
import {
  getSponsors,
  getVolunteerRoles,
  getFeaturedProjects,
  type FeaturedProject,
} from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/image";

// TODO: lift to a Sanity siteSettings singleton once we have a third event
const RECAP_EVENT_SLUG = "hackathon-00";

const EMPTY_STATS = {
  signups: 0,
  teamCount: 0,
  soloCount: 0,
  countryCount: 0,
  projectCount: 0,
  submissionCount: 0,
};

const recapDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export default async function Home() {
  let event: Awaited<ReturnType<typeof getFeaturedEvent>> = undefined;
  let recapEvent: Awaited<ReturnType<typeof getEventBySlug>> = undefined;
  let recapStats = EMPTY_STATS;
  let featuredProjects: FeaturedProject[] = [];
  let sponsors: Awaited<ReturnType<typeof getSponsors>> = [];
  let volunteerRoles: Awaited<ReturnType<typeof getVolunteerRoles>> = [];
  let activityFeed: Awaited<ReturnType<typeof getPublicActivityFeed>> = [];
  let participantCountryCodes: string[] = [];

  try {
    // Step 1: resolve both events in parallel — independent lookups.
    [event, recapEvent] = await Promise.all([
      getFeaturedEvent(),
      getEventBySlug(RECAP_EVENT_SLUG),
    ]);

    // Step 2: fan out everything else in a single Promise.all using the IDs.
    const [
      sponsorsResult,
      volunteerRolesResult,
      activityFeedResult,
      participantCountriesResult,
      recapStatsResult,
      featuredProjectsResult,
    ] = await Promise.all([
      getSponsors(),
      getVolunteerRoles(),
      getPublicActivityFeed(),
      event ? getParticipantCountries(event.id) : Promise.resolve([]),
      recapEvent ? getPublicStats(recapEvent.id) : Promise.resolve(EMPTY_STATS),
      getFeaturedProjects(RECAP_EVENT_SLUG),
    ]);

    sponsors = sponsorsResult;
    volunteerRoles = volunteerRolesResult;
    activityFeed = activityFeedResult;
    participantCountryCodes = participantCountriesResult;
    recapStats = recapStatsResult;
    featuredProjects = featuredProjectsResult;
  } catch {
    // DB or Sanity unavailable at build time — render with defaults, revalidate on first request
  }

  const globeLocations = getCoordinatesForCountries(participantCountryCodes);

  const serializedActivities = activityFeed.map((a) => ({
    ...a,
    timestamp: a.timestamp.toISOString(),
  }));

  // Show the recap section only when we have real H00 data to back it up.
  const showRecap = !!recapEvent && recapStats.signups > 0;

  // Surface the registration close date only when it's actually set.
  const registrationCloses = event?.registrationClosesAt
    ? recapDateFormatter.format(event.registrationClosesAt)
    : null;

  return (
    <div className="relative min-h-dvh">
      <Header />

      {/* ─────────────────────────────────────────────────────────────
          HERO
          TODO: replace placeholder headline + subline with final copy
          from product. Layout is locked; only the words change.
          ───────────────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center px-6 pt-32 md:pt-48 pb-48 md:pb-96 gap-10 text-center border-b border-border overflow-hidden max-h-screen">
        <BlurFade delay={0.1}>
          <span className="text-xs uppercase tracking-[0.2em] text-white/40">
            an open source AI hackathon
          </span>
        </BlurFade>

        {/* TODO: final hero headline (placeholder) */}
        <BlurFade delay={0.25} blur="16px">
          <h1 className="font-heading font-normal text-4xl sm:text-5xl md:text-7xl max-w-4xl text-white leading-tight">
            Signal over noise.
            <br className="hidden sm:block" /> Builders over talkers.
          </h1>
        </BlurFade>

        {/* TODO: final hero subline (placeholder) */}
        <BlurFade delay={0.4}>
          <p className="max-w-2xl text-lg text-white/50">
            One week. Real projects. Real code. Reviewed by other builders —
            not pitch decks, not panels of judges who&apos;ve never shipped.
          </p>
        </BlurFade>

        {event && (
          <BlurFade delay={0.55}>
            <CountdownTimer
              startsAt={event.startsAt.toISOString()}
              endsAt={event.endsAt.toISOString()}
            />
          </BlurFade>
        )}

        <BlurFade delay={0.7}>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="lg"
              asChild
              className="border-white/20 text-white bg-transparent hover:bg-white/5 hover:text-white px-8 h-12 text-sm font-medium"
            >
              <a href="#recap">tell me more ↓</a>
            </Button>
            <Link href="/sign-up">
              <Button
                size="lg"
                className="bg-buildstory-500 text-black hover:bg-white/90 px-8 h-12 text-sm font-medium ease-in duration-200"
              >
                {event ? "I'm in, register now" : "Get notified"}
              </Button>
            </Link>
          </div>
        </BlurFade>

        <BlurFade delay={0.85}>
          <p className="text-xs uppercase tracking-[0.25em] text-white/35">
            Supported by Anthropic
          </p>
        </BlurFade>

        <Globe locations={globeLocations} />
      </section>

      {/* ─────────────────────────────────────────────────────────────
          DIFFERENTIATORS — what makes Buildstory different
          ───────────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 border-b border-border bg-neutral-950">
        <div className="mx-auto max-w-8xl border-x border-border px-6 md:px-12 lg:px-24">
          <div className="py-16 md:py-32">
            <BlurFade inView>
              <span className="text-xs uppercase tracking-[0.25em] text-buildstory-500">
                the difference
              </span>
            </BlurFade>

            <BlurFade inView delay={0.1}>
              <h2 className="mt-12 font-heading italic text-3xl md:text-5xl text-[#e8e4de] max-w-3xl">
                A hackathon for people who actually ship.
              </h2>
            </BlurFade>

            <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <BlurFade inView delay={0.15}>
                <div className="border border-white/10 px-6 py-7 h-full">
                  <p className="text-lg font-medium text-[#e8e4de]">
                    Signal over noise
                  </p>
                  <p className="text-white/50 mt-2">
                    Verifiable work, not marketing claims. Every project is
                    real, tagged with the tools that built it.
                  </p>
                </div>
              </BlurFade>
              <BlurFade inView delay={0.25}>
                <div className="border border-white/10 px-6 py-7 h-full">
                  <p className="text-lg font-medium text-[#e8e4de]">
                    Proof of work
                  </p>
                  <p className="text-white/50 mt-2">
                    Build logs auto-captured from your terminal. Receipts, not
                    promises.
                  </p>
                </div>
              </BlurFade>
              <BlurFade inView delay={0.35}>
                <div className="border border-white/10 px-6 py-7 h-full">
                  <p className="text-lg font-medium text-[#e8e4de]">
                    Peer review
                  </p>
                  <p className="text-white/50 mt-2">
                    Builders review builders. Honest feedback on the code, not
                    a pitch competition.
                  </p>
                </div>
              </BlurFade>
              <BlurFade inView delay={0.45}>
                <div className="border border-white/10 px-6 py-7 h-full">
                  <p className="text-lg font-medium text-[#e8e4de]">
                    Recognition, not prizes
                  </p>
                  <p className="text-white/50 mt-2">
                    No cash bait. Standout work gets seen by category, country,
                    region, and overall.
                  </p>
                </div>
              </BlurFade>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          H00 RECAP — gated on real H00 data
          ───────────────────────────────────────────────────────────── */}
      {showRecap && (
        <section
          id="recap"
          className="relative z-10 px-6 border-b border-border bg-neutral-950"
        >
          <div className="mx-auto max-w-8xl border-x border-border px-6 md:px-12 lg:px-24">
            <div className="py-16 md:py-32">
              <BlurFade inView>
                <span className="text-xs uppercase tracking-[0.25em] text-buildstory-500">
                  hackathon 00 recap
                </span>
              </BlurFade>

              <BlurFade inView delay={0.1}>
                <h2 className="mt-12 font-heading italic text-3xl md:text-5xl text-[#e8e4de] max-w-3xl">
                  Last time we ran this, real things shipped.
                </h2>
              </BlurFade>

              <BlurFade inView delay={0.2}>
                <p className="mt-6 max-w-2xl font-mono text-base text-neutral-500 leading-relaxed">
                  Hackathon 00 was the proof of concept. Below is what actually
                  happened — pulled live from the database, not a marketing
                  page.
                </p>
              </BlurFade>

              {/* Stats row */}
              <BlurFade inView delay={0.3}>
                <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 border border-white/10">
                  <div className="border-r border-b sm:border-b-0 border-white/10 px-6 py-8">
                    <p className="font-heading text-4xl md:text-5xl text-[#e8e4de] tabular-nums">
                      {recapStats.signups}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/40">
                      builders
                    </p>
                  </div>
                  <div className="border-b sm:border-b-0 sm:border-r border-white/10 px-6 py-8">
                    <p className="font-heading text-4xl md:text-5xl text-[#e8e4de] tabular-nums">
                      {recapStats.countryCount}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/40">
                      countries
                    </p>
                  </div>
                  <div className="border-r border-white/10 px-6 py-8">
                    <p className="font-heading text-4xl md:text-5xl text-[#e8e4de] tabular-nums">
                      {recapStats.projectCount}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/40">
                      projects
                    </p>
                  </div>
                  <div className="px-6 py-8">
                    <p className="font-heading text-4xl md:text-5xl text-[#e8e4de] tabular-nums">
                      {recapStats.submissionCount}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/40">
                      shipped
                    </p>
                  </div>
                </div>
              </BlurFade>

              {/* Featured project grid — hidden when Sanity is empty */}
              {featuredProjects.length > 0 && (
                <div className="mt-16">
                  <BlurFade inView delay={0.4}>
                    <span className="text-xs uppercase tracking-[0.25em] text-white/40">
                      standout projects
                    </span>
                  </BlurFade>
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {featuredProjects.map((project, i) => (
                      <BlurFade
                        key={project._id}
                        inView
                        delay={0.45 + i * 0.05}
                      >
                        <RecapProjectCard project={project} />
                      </BlurFade>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          HOW IT WORKS — format, peer review, ground rules
          (streaming demoted to a sub-bullet inside Format)
          ───────────────────────────────────────────────────────────── */}
      <section
        id="how"
        className="relative z-10 px-6 border-b border-border bg-neutral-950"
      >
        <div className="mx-auto grid max-w-8xl gap-16 md:grid-cols-2 md:gap-20 items-stretch border-x border-border px-6 md:px-12 lg:px-24">
          {/* Left — copy */}
          <div className="py-16 md:py-32">
            <BlurFade inView>
              <span className="text-xs uppercase tracking-[0.25em] text-buildstory-500">
                how it works
              </span>
            </BlurFade>

            <BlurFade inView delay={0.1}>
              <h2 className="mt-12 font-heading italic text-3xl md:text-5xl text-[#e8e4de]">
                Build for a week. Get reviewed. Get seen.
              </h2>
            </BlurFade>

            <BlurFade inView delay={0.2}>
              <p className="mt-8 font-mono text-base text-neutral-500 leading-relaxed">
                Seven days, solo or team. Use any language, any framework, any
                AI tool you want. Ship a working project by the end of the
                week. Then everyone reviews everyone&apos;s work.
              </p>
            </BlurFade>

            <BlurFade inView delay={0.3}>
              <p className="mt-6 font-mono text-base text-neutral-500 leading-relaxed">
                Recognition by category, by country, by region, overall. No
                prizes, no panel of celebrity judges. Just builders looking at
                what other builders made.
              </p>
            </BlurFade>
          </div>

          {/* Right — format / peer review / ground rules */}
          <div className="py-16 md:py-32 flex items-start">
            <div className="w-full flex flex-col gap-3">
              <BlurFade inView delay={0.15}>
                <div className="border border-white/10 px-6 py-5">
                  <span className="text-sm font-semibold text-white/50 uppercase tracking-wide">
                    Format
                  </span>
                  <p className="text-white/85 mt-1">
                    7 days. Solo or team. Any tools. Any language.
                  </p>
                  <p className="text-white/50 mt-2 text-sm">
                    Streaming on Twitch or X is{" "}
                    <Badge variant="secondary" className="align-middle mx-1">
                      Optional
                    </Badge>{" "}
                    — guide at{" "}
                    <a
                      href="https://doitlive.club"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-buildstory-400 underline underline-offset-2"
                    >
                      doitlive.club
                    </a>
                    .
                  </p>
                </div>
              </BlurFade>

              <BlurFade inView delay={0.2}>
                <div className="border border-white/10 px-6 py-5">
                  <span className="text-sm font-semibold text-white/50 uppercase tracking-wide">
                    Peer review
                  </span>
                  <p className="text-white/85 mt-1">
                    Builders review builders.
                  </p>
                  <p className="text-white/50 mt-2 text-sm">
                    After the week ends, everyone gets a handful of other
                    projects to review. Honest, structured feedback on the
                    code, the build, and the story.
                  </p>
                </div>
              </BlurFade>

              <BlurFade inView delay={0.25}>
                <div className="border border-white/10 px-6 py-5">
                  <span className="text-sm font-semibold text-white/50 uppercase tracking-wide">
                    Build logs
                  </span>
                  <p className="text-white/85 mt-1">
                    Auto-captured from your terminal.
                  </p>
                  <div className="mt-3 border border-buildstory-500/30 border-dashed px-4 py-2">
                    <p className="font-mono text-sm text-neutral-500">
                      npm i -g buildstory
                    </p>
                  </div>
                </div>
              </BlurFade>

              <BlurFade inView delay={0.3}>
                <div className="border border-white/10 px-6 py-5">
                  <span className="text-sm font-semibold text-white/50 uppercase tracking-wide">
                    Ground rules
                  </span>
                  <ul className="text-white/50 mt-2 text-sm space-y-1.5 list-disc list-inside">
                    <li>
                      <span className="text-white/85">Ship something.</span>{" "}
                      It doesn&apos;t have to be perfect.
                    </li>
                    <li>
                      <span className="text-white/85">New or existing</span>{" "}
                      projects welcome — make meaningful progress.
                    </li>
                    <li>
                      <span className="text-white/85">AI tools encouraged.</span>{" "}
                      Use whatever helps you build.
                    </li>
                    <li>
                      <span className="text-white/85">Be honest.</span> Credit
                      collaborators. Represent your work truthfully.
                    </li>
                    <li>
                      <span className="text-white/85">Be kind.</span>{" "}
                      Constructive feedback only.
                    </li>
                  </ul>
                </div>
              </BlurFade>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          WHO'S BUILDING — activity feed + sponsors + volunteers
          ───────────────────────────────────────────────────────────── */}
      <section
        id="community"
        className="relative z-10 px-6 border-b border-border"
      >
        <div className="mx-auto grid max-w-8xl gap-16 md:grid-cols-2 md:gap-20 items-stretch border-x border-border px-6 md:px-12 lg:px-24">
          {/* Left — copy + activity feed */}
          <div className="py-16 md:py-32">
            <BlurFade inView>
              <span className="text-xs uppercase tracking-[0.25em] text-buildstory-500">
                who&apos;s building
              </span>
            </BlurFade>

            <BlurFade inView delay={0.1}>
              <h2 className="mt-12 font-heading italic text-3xl md:text-5xl text-[#e8e4de]">
                First-time builders &amp; seasoned shippers.
              </h2>
            </BlurFade>

            <BlurFade inView delay={0.2}>
              <p className="mt-8 font-mono text-base text-neutral-500 leading-relaxed max-w-xl">
                Whether you&apos;re writing your first line of code with an AI
                assistant or you&apos;ve shipped ten products this year. Solo
                or team — bring your own or find collaborators on Discord.
              </p>
            </BlurFade>
          </div>

          {/* Right — activity feed */}
          <div className="relative min-h-[400px] md:min-h-0">
            <div className="absolute inset-0 overflow-hidden">
              <ActivityFeed activities={serializedActivities} />
            </div>
          </div>
        </div>

        {/* Sponsors + volunteers row */}
        <div className="mx-auto max-w-8xl border-x border-border px-6 md:px-12 lg:px-24">
          <div className="grid gap-16 md:grid-cols-2 md:gap-20 pb-16 md:pb-32">
            {/* Help run this */}
            <div>
              <BlurFade inView>
                <span className="text-xs uppercase tracking-[0.25em] text-buildstory-500">
                  help run this
                </span>
              </BlurFade>

              <BlurFade inView delay={0.1}>
                <p className="mt-6 font-mono text-base text-neutral-500 leading-relaxed">
                  This hackathon is open-source and community-powered.
                  Here&apos;s how to get involved.
                </p>
              </BlurFade>

              {volunteerRoles.length > 0 && (
                <BlurFade inView delay={0.2}>
                  <div className="mt-8">
                    {volunteerRoles.map((role, i) => (
                      <div
                        key={role._id}
                        className={`flex flex-col sm:flex-row sm:items-baseline sm:justify-between border-t ${i === volunteerRoles.length - 1 ? "border-b" : ""} border-border py-6`}
                      >
                        <span className="text-lg font-medium text-[#e8e4de]">
                          {role.title}
                        </span>
                        <span className="text-base text-neutral-500">
                          {role.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </BlurFade>
              )}

              <BlurFade inView delay={0.3}>
                <a
                  href={VOLUNTEER_URL}
                  className="mt-8 inline-block border border-[#3d3a36] bg-transparent font-mono text-sm px-8 py-4 hover:border-neutral-500 text-neutral-500 transition-colors"
                >
                  Volunteer &rarr;
                </a>
              </BlurFade>
            </div>

            {/* Sponsors */}
            <div>
              <BlurFade inView>
                <span className="text-xs uppercase tracking-[0.25em] text-buildstory-500">
                  sponsors
                </span>
              </BlurFade>

              {sponsors.length > 0 && (
                <BlurFade inView delay={0.1}>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {sponsors.map((sponsor) => (
                      <a
                        key={sponsor._id}
                        href={sponsor.websiteUrl || "#"}
                        target={sponsor.websiteUrl ? "_blank" : undefined}
                        rel={
                          sponsor.websiteUrl ? "noopener noreferrer" : undefined
                        }
                        className="border border-border h-20 flex items-center justify-center p-4 hover:border-neutral-500 transition-colors"
                      >
                        <img
                          src={urlFor(sponsor.logo)
                            .width(160)
                            .height(60)
                            .fit("max")
                            .url()}
                          alt={sponsor.name}
                          className="max-h-12 w-auto object-contain invert opacity-70"
                        />
                      </a>
                    ))}
                  </div>
                </BlurFade>
              )}

              <BlurFade inView delay={0.2}>
                <p className="mt-6 font-mono text-base text-neutral-500 leading-relaxed">
                  Support builders with tool credits and resources.
                </p>
              </BlurFade>

              <BlurFade inView delay={0.25}>
                <a
                  href={SPONSOR_URL}
                  className="mt-4 inline-block font-mono text-base text-buildstory-400 underline underline-offset-4"
                >
                  Become a sponsor &rarr;
                </a>
              </BlurFade>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          FAQ
          ───────────────────────────────────────────────────────────── */}
      <section id="faq" className="relative z-10 px-6 border-b border-border">
        <div className="mx-auto max-w-8xl border-x border-border px-6 md:px-12 lg:px-24">
          <div className="py-16 md:py-32">
            <BlurFade inView>
              <span className="text-xs uppercase tracking-[0.25em] text-buildstory-500">
                faq
              </span>
            </BlurFade>

            <BlurFade inView delay={0.15}>
              <div className="mt-12">
                <FAQ />
              </div>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          FINAL CTA
          ───────────────────────────────────────────────────────────── */}
      <section id="cta" className="relative z-10 px-6 border-b border-border">
        <div className="mx-auto max-w-8xl border-x border-border px-6 md:px-12 lg:px-24">
          <div className="py-16 md:py-32 flex flex-col items-center text-center">
            <BlurFade inView>
              <span className="text-xs uppercase tracking-[0.25em] text-buildstory-500">
                join us
              </span>
            </BlurFade>

            <BlurFade inView delay={0.1} blur="16px">
              <h2 className="mt-8 font-heading text-5xl md:text-6xl text-[#e8e4de] max-w-3xl leading-tight">
                Stop planning. Start building.
              </h2>
            </BlurFade>

            <BlurFade inView delay={0.2}>
              <p className="mt-6 max-w-xl font-mono text-base text-neutral-500 leading-relaxed">
                One week, no gatekeeping, no prerequisites. Just you, your
                ideas, and a community that actually wants to see you ship.
              </p>
            </BlurFade>

            <BlurFade inView delay={0.3}>
              <div className="mt-10 flex items-center gap-4">
                <Button
                  size="lg"
                  className="bg-buildstory-500 text-black hover:bg-white/90 px-8 h-12 text-sm font-medium ease-in duration-200"
                  asChild
                >
                  <Link href="/sign-up">
                    {event ? "I'm in, register now" : "Get notified"}
                  </Link>
                </Button>
              </div>
            </BlurFade>

            {registrationCloses && (
              <BlurFade inView delay={0.35}>
                <p className="mt-4 font-mono text-sm text-buildstory-400/80">
                  Registration closes {registrationCloses}
                </p>
              </BlurFade>
            )}

            <BlurFade inView delay={0.4}>
              <p className="mt-6 font-mono text-sm text-white/30">
                Free to enter &middot; All skill levels &middot; Solo or team
              </p>
            </BlurFade>
          </div>
        </div>
      </section>

      <section className="border-border border-x flex justify-between max-w-8xl mx-auto px-6 py-8">
        <p className="font-mono text-neutral-600">© 2026 Buildstory</p>
        <p className="font-mono text-neutral-600">Show, don&apos;t tell.</p>
      </section>
    </div>
  );
}

function RecapProjectCard({ project }: { project: FeaturedProject }) {
  const imageUrl = urlFor(project.image)
    .width(640)
    .height(360)
    .fit("crop")
    .url();

  const inner = (
    <div className="border border-white/10 hover:border-white/20 transition-colors h-full flex flex-col">
      <div className="aspect-[16/9] overflow-hidden border-b border-white/10 bg-neutral-900">
        <img
          src={imageUrl}
          alt={project.title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="px-5 py-4 flex flex-col flex-1">
        <p className="text-base font-medium text-[#e8e4de]">{project.title}</p>
        <p className="text-xs text-white/40 mt-0.5">by {project.builderName}</p>
        <p className="text-sm text-white/55 mt-2 leading-snug">
          {project.blurb}
        </p>
      </div>
    </div>
  );

  if (project.projectSlug) {
    return (
      <Link href={`/projects/${project.projectSlug}`} className="block h-full">
        {inner}
      </Link>
    );
  }

  return inner;
}
