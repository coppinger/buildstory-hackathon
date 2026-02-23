import { Header } from "@/components/header";
import { CountdownTimer } from "@/components/countdown-timer";
import { Globe } from "@/components/globe";
import { Button } from "@/components/ui/button";
import { ActivityFeed } from "@/components/activity-feed";
import { FAQ } from "@/components/faq";
import { Badge } from "@/components/ui/badge"

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
            variant="outline"
            size="lg"
            asChild
            className="border-white/20 text-white bg-transparent hover:bg-white/5 hover:text-white px-8 h-12 text-sm font-medium"
          >
            <a href="#what">tell me more ↓</a>
          </Button>
          <Button
            size="lg"
            className="bg-buildstory-500 text-black hover:bg-white/90 px-8 h-12 text-sm font-medium animate-[glow_3s_ease-in-out_infinite] ease-in duration-200"
          >
            I&apos;m in, sign me up
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

            <div className="mt-12 flex flex-col gap-10 font-heading text-5xl">
              <p className="text-white/85">
                Timelines are filling up with people who have things to sell
                you.
              </p>
              <p className="text-white/85">
                The builders with insights to share? Lost in the noise.
              </p>
              <p className="text-white/85">
                We want to see that change, so we&apos;re going to do something
                about it.
              </p>
              <p className=" font-medium leading-snug text-buildstory-500">
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

            <div className="mt-12 flex flex-col gap-10 font-heading  text-5xl">
              <p className="text-white/85 ">
                A one week hackathon, by builders for builders.
              </p>
              <p className="text-white/85 ">
                We won&apos;t make you use a certain tool: use whatever you like.
              </p>
              <p className="text-white/85 ">
                Oh, and there&apos;s nothing to sell you.
              </p>
              <p className=" text-buildstory-500">
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
      <section className="relative z-10 px-6 border-b border-border ">
        <div className="mx-auto grid max-w-8xl gap-16 md:grid-cols-2 md:gap-20 items-stretch border-x border-border px-24">
          {/* Left — copy */}
          <div className="py-40">
            <span className="text-xs uppercase tracking-[0.25em] text-buildstory-500">
              when
            </span>

            <h2 className="mt-12 font-heading italic text-5xl text-[#e8e4de]">
              February 23 &rarr; March 1
            </h2>

            <p className="mt-2 font-heading italic text-3xl text-neutral-500">
              Seven days. Set your own pace.
            </p>

            <p className="mt-6 font-mono text-base text-neutral-500 leading-relaxed">
              Not everyone can clear their calendar for a week. That&apos;s
              fine. Tell us how you&apos;re planning to show up.
            </p>
          </div>

          {/* Right — commitment cards */}
          <div className="py-40 flex items-center">
            <div className="w-full grid grid-cols-2 gap-3">
              {/* All-in */}
              <div className="border border-border p-5">
                <div className="flex gap-1 mb-4">
                  <span className="w-5 h-[3px] bg-buildstory-400" />
                  <span className="w-5 h-[3px] bg-buildstory-400" />
                  <span className="w-5 h-[3px] bg-buildstory-400" />
                  <span className="w-5 h-[3px] bg-buildstory-400" />
                </div>
                <p className="text-lg font-medium text-[#e8e4de]">All-in</p>
                <p className="mt-1 text-base text-neutral-500">
                  Full days, full week. Clearing the decks.
                </p>
              </div>

              {/* Daily */}
              <div className="border border-border p-5">
                <div className="flex gap-1 mb-4">
                  <span className="w-5 h-[3px] bg-buildstory-400" />
                  <span className="w-5 h-[3px] bg-buildstory-400" />
                  <span className="w-5 h-[3px] bg-buildstory-400" />
                  <span className="w-5 h-[3px] bg-[#3d3a36]" />
                </div>
                <p className="text-lg font-medium text-[#e8e4de]">Daily</p>
                <p className="mt-1 text-base text-neutral-500">
                  A few focused hours each day.
                </p>
              </div>

              {/* Nights & Weekends */}
              <div className="border border-border p-5">
                <div className="flex gap-1 mb-4">
                  <span className="w-5 h-[3px] bg-buildstory-400" />
                  <span className="w-5 h-[3px] bg-buildstory-400" />
                  <span className="w-5 h-[3px] bg-[#3d3a36]" />
                  <span className="w-5 h-[3px] bg-[#3d3a36]" />
                </div>
                <p className="text-lg font-medium text-[#e8e4de]">
                  Nights &amp; Weekends
                </p>
                <p className="mt-1 text-base text-neutral-500">
                  Building around a day job.
                </p>
              </div>

              {/* Unsure */}
              <div className="border border-border p-5">
                <div className="flex gap-1 mb-4">
                  <span className="w-5 h-[3px] bg-buildstory-400" />
                  <span className="w-5 h-[3px] bg-[#3d3a36]" />
                  <span className="w-5 h-[3px] bg-[#3d3a36]" />
                  <span className="w-5 h-[3px] bg-[#3d3a36]" />
                </div>
                <p className="text-lg font-medium text-[#e8e4de]">Unsure</p>
                <p className="mt-1 text-base text-neutral-500">
                  You&apos;ll figure it out as you go. That&apos;s fine, too.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Where */}
      <section className="relative z-10 px-6 border-b border-border ">
        <div className="mx-auto grid max-w-8xl gap-16 md:grid-cols-2 md:gap-20 items-stretch border-x border-border px-24">
          {/* Left — copy */}
          <div className="py-40">
            <span className="text-xs uppercase tracking-[0.25em] text-buildstory-500">
              where
            </span>

            <h2 className="mt-12 font-heading italic text-5xl text-[#e8e4de]">
              Everywhere.
            </h2>
            <h2 className="mt-2 font-heading italic text-3xl text-neutral-500">
              Online, open, global.
            </h2>

            <p className="mt-10 font-mono text-base text-neutral-500 leading-relaxed">
              Build from wherever you are. The community lives on Discord,
              builds are tracked through the Buildstory CLI, and streaming
              happens on Twitch and/or X with a guide on doitlive.club.
            </p>

            <p className="mt-6 font-mono text-base text-neutral-500 leading-relaxed">
              You&apos;re competing globally but recognised locally &mdash;
              projects are grouped by country and region so standout work gets
              seen no matter where you are.
            </p>
          </div>

          {/* Right — platform cards */}
          <div className="py-40 flex items-center">
            <div className="w-full flex flex-col gap-3">
              {/* Discord */}
              <div className="border border-border p-8">
                <div className="flex items-center gap-3">
                  <img src="/discord.svg" alt="Discord" className="w-6 h-6 invert opacity-50" />
                </div>
                <p className="mt-3 text-lg font-medium text-[#e8e4de]">
                  Discord
                </p>
                <p className="mt-1 text-neutral-500">
                  Find teammates, share progress, get help, hang out.
                </p>
              </div>

              {/* Stream it */}
              <div className="border border-border p-8">
                <div className="flex items-center gap-4">
                  <img src="/twitch.svg" alt="Twitch" className="w-6 h-6 invert opacity-50" />
                  <img src="/x.svg" alt="X" className="w-6 h-6 invert opacity-50" />
                </div>
                <div className="flex gap-4 items-center mt-3">
                  <p className="text-lg font-medium text-[#e8e4de]">
                  Stream it
                </p>
                <Badge variant={"secondary"}>Optional</Badge>
                </div>
                <p className="mt-1 text-neutral-500">
                  Stream your build. Get real-time feedback. Inspire others.
                </p>
                <a
                  href="https://doitlive.club"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block font-mono text-buildstory-400 underline underline-offset-4"
                >
                  doitlive.club &rarr;
                </a>
              </div>

              {/* Buildstory CLI */}
              <div className="border border-border p-8">
                <div className="flex items-center gap-3">
                  <img src="/npm.svg" alt="NPM" className="w-6 h-6 invert opacity-50" />
                </div>
                <p className="mt-3 text-lg font-medium text-[#e8e4de]">
                  Buildstory CLI
                </p>
                <p className="mt-1 text-neutral-500">
                  Auto-log your progress from your terminal as you build.
                </p>
                <div className="mt-4 border border-buildstory-700 border-dashed p-4">
                  <p className="text-neutral-500">
                  npm i -g buildstory
                </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who */}
      <section className="relative z-10 px-6 border-b border-border ">
        <div className="mx-auto max-w-8xl border-x border-border px-24">
          {/* Top — full width intro */}
          <div className="pt-40 pb-24">
            <span className="text-xs uppercase tracking-[0.25em] text-buildstory-500">
              who
            </span>

            <h2 className="mt-12 font-heading italic text-5xl text-[#e8e4de]">
              First-time builders &amp; seasoned shippers.
            </h2>
            <h2 className="mt-2 font-heading italic text-3xl text-neutral-500">
              If you want to build something, this is your week.
            </h2>

            <p className="mt-10 font-mono text-base text-neutral-500 leading-relaxed max-w-3xl">
              Whether you&apos;re writing your first line of code with an AI
              assistant or you&apos;ve shipped ten products this year. Solo or
              team &mdash; bring your own or find collaborators through the
              hackathon.
            </p>

            <a
              href="#"
              className="mt-8 inline-block border border-[#3d3a36] bg-transparent font-mono text-sm text-[#e8e4de] px-8 py-4 hover:border-neutral-500text-neutral-500 transition-colors"
            >
              Sign up &rarr;
            </a>
          </div>

          {/* Bottom — two-column grid */}
          <div className="grid gap-16 md:grid-cols-2 md:gap-20 pb-40">
            {/* Left — Help run this */}
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-buildstory-500">
                help run this
              </span>

              <p className="mt-6 font-mono text-base text-neutral-500 leading-relaxed">
                This hackathon is open-source and community-powered.
                Here&apos;s how to get involved.
              </p>

              <div className="mt-8">
                <div className="flex items-baseline justify-between border-t border-border py-6">
                  <span className="text-lg font-medium text-[#e8e4de]">Mentors</span>
                  <span className="text-base text-neutral-500">Help participants get unstuck</span>
                </div>
                <div className="flex items-baseline justify-between border-t border-border py-6">
                  <span className="text-lg font-medium text-[#e8e4de]">Co-facilitators</span>
                  <span className="text-base text-neutral-500">Help run the event day-to-day</span>
                </div>
                <div className="flex items-baseline justify-between border-t border-border py-6">
                  <span className="text-lg font-medium text-[#e8e4de]">Moderators</span>
                  <span className="text-base text-neutral-500">Keep Discord healthy</span>
                </div>
                <div className="flex items-baseline justify-between border-t border-border py-6">
                  <span className="text-lg font-medium text-[#e8e4de]">Panel</span>
                  <span className="text-base text-neutral-500">Review &amp; recognise standout projects</span>
                </div>
                <div className="flex items-baseline justify-between border-t border-b border-border py-4">
                  <span className="text-lg font-medium text-[#e8e4de]">Interviewees</span>
                  <span className="text-base text-neutral-500">Share your process with the community</span>
                </div>
              </div>

              <a
                href="#"
                className="mt-8 inline-block border border-[#3d3a36] bg-transparent font-mono text-sm text-[#e8e4de] px-8 py-4 hover:border-neutral-500text-neutral-500 transition-colors"
              >
                Volunteer &rarr;
              </a>
            </div>

            {/* Right — Sponsors */}
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-buildstory-500">
                sponsors
              </span>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="border border-border h-20 border-dashed" />
                <div className="border border-border h-20 border-dashed" />
                <div className="border border-border h-20 border-dashed" />
                <div className="border border-border h-20 border-dashed" />
              </div>

              <p className="mt-6 font-mono text-base text-neutral-500 leading-relaxed">
                Support builders with tool credits and resources.
              </p>

              <a
                href="#"
                className="mt-4 inline-block font-mono text-base text-buildstory-400 underline underline-offset-4"
              >
                Become a sponsor &rarr;
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 px-6 border-b border-border ">
        <div className="mx-auto max-w-8xl border-x border-border px-24">
          <div className="py-40">
            <span className="text-xs uppercase tracking-[0.25em] text-buildstory-500">
              faq
            </span>

            <div className="mt-12">
              <FAQ />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="relative z-10 px-6 border-b border-border">
        <div className="mx-auto max-w-8xl border-x border-border px-24">
          <div className="py-40 flex flex-col items-center text-center">
            <span className="text-xs uppercase tracking-[0.25em] text-buildstory-500">
              join us
            </span>

            <h2 className="mt-8 font-heading text-5xl md:text-6xl text-[#e8e4de] max-w-3xl leading-tight">
              Stop planning. Start building.
            </h2>

            <p className="mt-6 max-w-xl font-mono text-base text-neutral-500 leading-relaxed">
              One week, no gatekeeping, no prerequisites. Just you, your ideas, and a community
              that actually wants to see you ship.
            </p>

            <div className="mt-10 flex items-center gap-4">
              <Button
                size="lg"
                className="bg-buildstory-500 text-black hover:bg-white/90 px-8 h-12 text-sm font-medium animate-[glow_3s_ease-in-out_infinite] ease-in duration-200"
              >
                I&apos;m in, sign me up
              </Button>
            </div>

            <p className="mt-6 font-mono text-sm text-white/30">
              Free to enter &middot; All skill levels &middot; Solo or team
            </p>
          </div>
        </div>
      </section>

      <section className="border-border border-x flex justify-between max-w-8xl mx-auto px-6 py-8 ">
        <p className="font-mono text-neutral-600">© 2025 Buildstory
        </p>
        <p className="font-mono text-neutral-600">Show, don't tell.</p>
      </section>
    </div>
  );
}
