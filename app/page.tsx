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
        <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl max-w-4xl text-white leading-tight">
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
            className="bg-white text-black hover:bg-white/90 px-8 h-12 text-sm font-medium rounded-lg"
          >
            I&apos;m in, sign me up
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="border-white/20 text-white bg-transparent hover:bg-white/5 hover:text-white px-8 h-12 text-sm font-medium rounded-lg"
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
        <div className="mx-auto grid max-w-7xl gap-16 md:grid-cols-2 md:gap-20 items-stretch border-x border-border px-24">
          {/* Left — copy */}
          <div className="py-40">
            <span className="text-xs uppercase tracking-[0.25em] text-white/30">
              why
            </span>

            <div className="mt-12 flex flex-col gap-10">
              <p className="font-medium leading-snug text-white/85 text-3xl">
                Timelines are filling up with people who have things to sell
                you.
              </p>
              <p className="font-medium leading-snug text-white/85 text-3xl">
                The builders with insights to share? Lost in the noise.
              </p>
              <p className="font-medium leading-snug text-white/85 text-3xl">
                We want to see that change, so we&apos;re going to do something
                about it.
              </p>
              <p className="text-3xl font-medium leading-snug text-orange-500 sm:text-3xl">
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
    </div>
  );
}
