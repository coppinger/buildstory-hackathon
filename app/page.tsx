import { Header } from "@/components/header";
import { CountdownTimer } from "@/components/countdown-timer";
import { Globe } from "@/components/globe";
import { Button } from "@/components/ui/button";
import { ActivityFeed } from "@/components/activity-feed";

const stats = [
  "134 people",
  "49 teams",
  "68 solo",
  "27 countries",
  "19 volunteers",
];

export default function Home() {
  return (
    <div className="relative min-h-screen">
      <Header />

      {/* Hero */}
      <section className="flex flex-col items-center px-6 pt-48 pb-96 gap-10 text-center border-b border-border overflow-hidden">
        {/* Label */}
        <span className="text-xs uppercase tracking-[0.2em] text-white/40">
          open source AI-first hackathon
        </span>

        {/* Headline */}
        <h1 className="font-heading font-normal text-4xl sm:text-5xl md:text-7xl max-w-4xl text-white leading-tight">
          One week. Build your thing.
          <br className="hidden sm:block" /> Share your story.
        </h1>

        {/* Subline */}
        <p className="max-w-2xl text-lg text-white/50">
          A global, fully remote hackathon focused on good vibes and good
          practices.
        </p>

        {/* Countdown */}
        <CountdownTimer />

        {/* CTAs */}
        <div className="flex items-center gap-4">
          <Button
            size="lg"
            className="bg-white text-black hover:bg-white/90 px-8 h-12 text-sm font-medium"
          >
            I&apos;m in, sign me up
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="border-white/20 text-white bg-transparent hover:bg-white/5 hover:text-white px-8 h-12 text-sm font-medium"
          >
            <a href="#what">tell me more</a>
          </Button>
        </div>

        {/* Stats bar */}
        <p className="text-base text-white/35 tracking-wide">
          {stats.join(" \u00B7 ")}
        </p>

        {/* Globe */}
        <Globe />
      </section>

      {/* Why */}
      <section className="relative z-10 px-6 border-b border-border bg-neutral-950">
        <div className="mx-auto grid max-w-8xl gap-16 md:grid-cols-2 md:gap-20 items-stretch border-x border-border px-24">
          {/* Left — copy */}
          <div className="py-40">
            <span className="text-xs uppercase tracking-[0.25em] text-white/30">
              why
            </span>

            <div className="mt-12 flex flex-col gap-10 font-heading">
              <p className="text-white/85 text-4xl">
                Timelines are filling up with people who have things to sell
                you.
              </p>
              <p className="text-white/85 text-4xl">
                The builders with insights to share? Lost in the noise.
              </p>
              <p className="text-white/85 text-4xl">
                We want to see that change, so we&apos;re going to do something
                about it.
              </p>
              <p className=" font-medium leading-snug text-buildstory-500 text-4xl">
                Let&apos;s put builders back in the spotlight.
              </p>
            </div>
          </div>

          {/* Right — activity feed */}
          <div className="relative">
            <div className="absolute inset-0 overflow-hidden">
              <ActivityFeed />
            </div>
          </div>
        </div>
      </section>

      {/* What */}
      <section id="what" className="relative z-10 px-6 border-b border-border bg-neutral-950">
        <div className="mx-auto grid max-w-8xl gap-16 md:grid-cols-2 md:gap-20 items-stretch border-x border-border px-24">
          <div className="py-40">
            <span className="text-xs uppercase tracking-[0.25em] text-white/30">
              what
            </span>

            <div className="mt-12 flex flex-col gap-10 font-heading">
              <p className="text-white/85 text-4xl">
                A one week hackathon, by builders for builders.
              </p>
              <p className="text-white/85 text-4xl">
                We won&apos;t make you use a certain tool: use whatever you like.
              </p>
              <p className="text-white/85 text-4xl">
                Oh, and there&apos;s nothing to sell you.
              </p>
              <p className="text-4xl text-buildstory-500">
                We&apos;re all here to build and learn.
              </p>
            </div>
          </div>
          {/* Left — info cards */}
          <div className="py-40 flex items-start">
            <div className="w-full flex flex-col gap-3">
              <div className="flex gap-3">
                <div className="w-full  border border-white/10 px-6 py-5">
                <span className="text-sm font-semibold text-white/50 uppercase tracking-wide">Format</span>
                <p className="text-white/85 mt-1">7 days, solo or team</p>
              </div>
              <div className="w-full  border border-white/10 px-6 py-5">
                <span className="text-sm font-semibold text-white/50 uppercase tracking-wide">Judging</span>
                <p className="text-white/85 mt-1">Peer-to-peer voting + panel favorites</p>
              </div>
              </div>
              <div className=" border border-white/10 px-6 py-5">
                <span className="text-sm font-semibold text-white/50 uppercase tracking-wide">Categories</span>
                <ul className="text-white/85 mt-1 list-disc list-inside space-y-0.5 pl-1">
                  <li>Creativity</li>
                  <li>Business Case</li>
                  <li>Technical Challenge</li>
                  <li>Impact</li>
                  <li>Design</li>
                </ul>
              </div>
              <div className=" border border-white/10 px-6 py-5">
                <span className="text-sm font-semibold text-white/50 uppercase tracking-wide">Recognition</span>
                <p className="text-white/85 mt-1">By category, by country, by region, overall</p>
              </div>
              <div className=" border border-white/10 px-6 py-5">
                <span className="text-sm font-semibold text-white/50 uppercase tracking-wide">Prizes</span>
                <p className="text-white/85 mt-1">None! Recognition is the reward.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* When */}
      <section className="relative z-10 px-6 border-b border-[#1a1917] ">
        <div className="mx-auto grid max-w-8xl gap-16 md:grid-cols-2 md:gap-20 items-stretch border-x border-[#1a1917] px-24">
          {/* Left — copy */}
          <div className="py-40">
            <span className="text-xs uppercase tracking-[0.25em] text-[#3d3a36]">
              when
            </span>

            <h2 className="mt-12 font-heading italic text-4xl text-[#e8e4de]">
              February 23 &rarr; March 1
            </h2>

            <p className="mt-6 font-heading italic text-xl text-[#6b6560]">
              Seven days. Your pace.
            </p>

            <p className="mt-6 font-mono text-base text-[#6b6560] leading-relaxed">
              Not everyone can clear their calendar for a week. That&apos;s
              fine. Tell us how you&apos;re planning to show up.
            </p>
          </div>

          {/* Right — commitment cards */}
          <div className="py-40 flex items-center">
            <div className="w-full grid grid-cols-2 gap-3">
              {/* All-in */}
              <div className="border border-[#1a1917] p-5">
                <div className="flex gap-1 mb-3">
                  <span className="w-5 h-[3px] bg-[#c4a35a]" />
                  <span className="w-5 h-[3px] bg-[#c4a35a]" />
                  <span className="w-5 h-[3px] bg-[#c4a35a]" />
                  <span className="w-5 h-[3px] bg-[#c4a35a]" />
                </div>
                <p className="text-sm font-semibold text-[#e8e4de]">All-in</p>
                <p className="mt-1 font-mono text-xs text-[#6b6560]">
                  Full days, full week. Clearing the decks.
                </p>
              </div>

              {/* Daily */}
              <div className="border border-[#1a1917] p-5">
                <div className="flex gap-1 mb-3">
                  <span className="w-5 h-[3px] bg-[#c4a35a]" />
                  <span className="w-5 h-[3px] bg-[#c4a35a]" />
                  <span className="w-5 h-[3px] bg-[#c4a35a]" />
                  <span className="w-5 h-[3px] bg-[#3d3a36]" />
                </div>
                <p className="text-sm font-semibold text-[#e8e4de]">Daily</p>
                <p className="mt-1 font-mono text-xs text-[#6b6560]">
                  A few focused hours each day.
                </p>
              </div>

              {/* Nights & Weekends */}
              <div className="border border-[#1a1917] p-5">
                <div className="flex gap-1 mb-3">
                  <span className="w-5 h-[3px] bg-[#c4a35a]" />
                  <span className="w-5 h-[3px] bg-[#c4a35a]" />
                  <span className="w-5 h-[3px] bg-[#3d3a36]" />
                  <span className="w-5 h-[3px] bg-[#3d3a36]" />
                </div>
                <p className="text-sm font-semibold text-[#e8e4de]">
                  Nights &amp; Weekends
                </p>
                <p className="mt-1 font-mono text-xs text-[#6b6560]">
                  Building around a day job.
                </p>
              </div>

              {/* Unsure */}
              <div className="border border-[#1a1917] p-5">
                <div className="flex gap-1 mb-3">
                  <span className="w-5 h-[3px] bg-[#c4a35a]" />
                  <span className="w-5 h-[3px] bg-[#3d3a36]" />
                  <span className="w-5 h-[3px] bg-[#3d3a36]" />
                  <span className="w-5 h-[3px] bg-[#3d3a36]" />
                </div>
                <p className="text-sm font-semibold text-[#e8e4de]">Unsure</p>
                <p className="mt-1 font-mono text-xs text-[#6b6560]">
                  You&apos;ll figure it out. That&apos;s fine.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Where */}
      <section className="relative z-10 px-6 border-b border-[#1a1917] ">
        <div className="mx-auto grid max-w-8xl gap-16 md:grid-cols-2 md:gap-20 items-stretch border-x border-[#1a1917] px-24">
          {/* Left — copy */}
          <div className="py-40">
            <span className="text-xs uppercase tracking-[0.25em] text-[#3d3a36]">
              where
            </span>

            <h2 className="mt-12 font-heading italic text-4xl text-[#e8e4de]">
              Everywhere.
            </h2>
            <h2 className="mt-2 font-heading italic text-4xl text-[#6b6560]">
              Online, open, global.
            </h2>

            <p className="mt-10 font-mono text-base text-[#6b6560] leading-relaxed">
              Build from wherever you are. The community lives on Discord,
              builds are tracked through the Buildstory CLI, and streaming
              happens on Twitch via doitlive.club.
            </p>

            <p className="mt-6 font-mono text-base text-[#6b6560] leading-relaxed">
              You&apos;re competing globally but recognised locally &mdash;
              projects are grouped by country and region so standout work gets
              seen no matter where you are.
            </p>
          </div>

          {/* Right — platform cards */}
          <div className="py-40 flex items-center">
            <div className="w-full flex flex-col gap-3">
              {/* Discord */}
              <div className="border border-[#1a1917] p-8">
                <span className="text-lg text-[#6b6560]">&#9671;</span>
                <p className="mt-3 text-sm font-semibold text-[#e8e4de]">
                  Discord
                </p>
                <p className="mt-1 font-mono text-xs text-[#6b6560]">
                  Find teammates, share progress, get help, hang out.
                </p>
              </div>

              {/* Stream it */}
              <div className="border border-[#1a1917] p-8">
                <span className="text-lg text-[#6b6560]">&#9670;</span>
                <p className="mt-3 text-sm font-semibold text-[#e8e4de]">
                  Stream it
                </p>
                <p className="mt-1 font-mono text-xs text-[#6b6560]">
                  Stream your build. Get real-time feedback. Inspire others.
                </p>
                <a
                  href="https://doitlive.club"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block font-mono text-xs text-[#c4a35a] underline underline-offset-4"
                >
                  doitlive.club &rarr;
                </a>
              </div>

              {/* Buildstory CLI */}
              <div className="border border-[#1a1917] p-8">
                <span className="text-lg text-[#6b6560]">&#9656;</span>
                <p className="mt-3 text-sm font-semibold text-[#e8e4de]">
                  Buildstory CLI
                </p>
                <p className="mt-1 font-mono text-xs text-[#6b6560]">
                  Auto-log your progress from your terminal as you build.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who */}
      <section className="relative z-10 px-6 border-b border-[#1a1917] bg-[#0e0d0c]">
        <div className="mx-auto max-w-8xl border-x border-[#1a1917] px-24">
          {/* Top — full width intro */}
          <div className="pt-40 pb-24">
            <span className="text-xs uppercase tracking-[0.25em] text-[#3d3a36]">
              who
            </span>

            <h2 className="mt-12 font-heading italic text-4xl text-[#e8e4de]">
              First-time builders. Seasoned shippers.
            </h2>
            <h2 className="mt-2 font-heading italic text-4xl text-[#6b6560]">
              If you want to build something, this is your week.
            </h2>

            <p className="mt-10 font-mono text-base text-[#6b6560] leading-relaxed max-w-3xl">
              Whether you&apos;re writing your first line of code with an AI
              assistant or you&apos;ve shipped ten products this year. Solo or
              team &mdash; bring your own or find collaborators through the
              hackathon.
            </p>

            <a
              href="#"
              className="mt-8 inline-block border border-[#3d3a36] bg-transparent font-mono text-sm text-[#e8e4de] px-8 py-4 hover:border-[#6b6560] transition-colors"
            >
              Sign up &rarr;
            </a>
          </div>

          {/* Bottom — two-column grid */}
          <div className="grid gap-16 md:grid-cols-2 md:gap-20 pb-40">
            {/* Left — Help run this */}
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-[#3d3a36]">
                help run this
              </span>

              <p className="mt-6 font-mono text-base text-[#6b6560] leading-relaxed">
                This hackathon is open-source and community-powered.
                Here&apos;s how to get involved.
              </p>

              <div className="mt-8">
                <div className="flex items-baseline justify-between border-t border-[#1a1917] py-4">
                  <span className="text-sm font-semibold text-[#e8e4de]">Mentors</span>
                  <span className="font-mono text-xs text-[#6b6560]">Help participants get unstuck</span>
                </div>
                <div className="flex items-baseline justify-between border-t border-[#1a1917] py-4">
                  <span className="text-sm font-semibold text-[#e8e4de]">Co-facilitators</span>
                  <span className="font-mono text-xs text-[#6b6560]">Help run the event day-to-day</span>
                </div>
                <div className="flex items-baseline justify-between border-t border-[#1a1917] py-4">
                  <span className="text-sm font-semibold text-[#e8e4de]">Moderators</span>
                  <span className="font-mono text-xs text-[#6b6560]">Keep Discord healthy</span>
                </div>
                <div className="flex items-baseline justify-between border-t border-[#1a1917] py-4">
                  <span className="text-sm font-semibold text-[#e8e4de]">Panel</span>
                  <span className="font-mono text-xs text-[#6b6560]">Review &amp; recognise standout projects</span>
                </div>
                <div className="flex items-baseline justify-between border-t border-b border-[#1a1917] py-4">
                  <span className="text-sm font-semibold text-[#e8e4de]">Interviewees</span>
                  <span className="font-mono text-xs text-[#6b6560]">Share your process with the community</span>
                </div>
              </div>

              <a
                href="#"
                className="mt-8 inline-block border border-[#3d3a36] bg-transparent font-mono text-sm text-[#e8e4de] px-8 py-4 hover:border-[#6b6560] transition-colors"
              >
                Volunteer &rarr;
              </a>
            </div>

            {/* Right — Sponsors */}
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-[#3d3a36]">
                sponsors
              </span>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="border border-[#1a1917] h-20" />
                <div className="border border-[#1a1917] h-20" />
                <div className="border border-[#1a1917] h-20" />
                <div className="border border-[#1a1917] h-20" />
              </div>

              <p className="mt-6 font-mono text-base text-[#6b6560] leading-relaxed">
                Support builders with tool credits and resources.
              </p>

              <a
                href="#"
                className="mt-4 inline-block font-mono text-xs text-[#c4a35a] underline underline-offset-4"
              >
                Become a sponsor &rarr;
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
