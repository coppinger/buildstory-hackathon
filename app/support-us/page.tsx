import Image from "next/image";
import Link from "next/link";
import { BlurFade } from "@/components/blur-fade";
import { Button } from "@/components/ui/button";
import { ogMeta } from "@/lib/metadata";

const CONTACT_EMAIL = "charlie@buildstory.com";
const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`;

export const metadata = ogMeta(
  "Support Buildstory",
  "Arm real builders with real tools. Support free monthly AI hackathons and put your product in the hands of people who actually build with it."
);

export default function SupportUsPage() {
  return (
    <div className="relative min-h-screen">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-8xl items-center justify-between px-6">
          <Link href="/" className="shrink-0">
            <Image
              src="/buildstory-logo.svg"
              alt="BuildStory"
              width={140}
              height={28}
              priority
            />
          </Link>
          <Button
            asChild
            size="lg"
            className="bg-buildstory-500 text-black hover:bg-buildstory-400 px-8 h-12 text-sm font-medium"
          >
            <a href={CONTACT_MAILTO}>Get in touch</a>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center px-6 pt-32 md:pt-48 pb-16 md:pb-24 gap-8 text-center border-b border-border">
        <BlurFade delay={0.1}>
          <span className="text-xs uppercase tracking-[0.2em] text-white/40">
            support buildstory
          </span>
        </BlurFade>

        <BlurFade delay={0.25} blur="16px">
          <h1 className="font-heading font-normal text-4xl sm:text-5xl md:text-7xl max-w-4xl text-white leading-tight">
            Arm real builders with real tools.
          </h1>
        </BlurFade>

        <BlurFade delay={0.4}>
          <p className="max-w-2xl text-lg text-white/50 leading-relaxed">
            Buildstory runs free monthly AI hackathons for all experience
            levels. No courses, no upsells — just people building real things
            in public. When you support a hackathon, your product ends up in
            the hands of people who actually build with it — with proof living
            on their profile permanently.
          </p>
        </BlurFade>

        <BlurFade delay={0.55}>
          <div className="flex items-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-buildstory-500 text-black hover:bg-white/90 px-8 h-12 text-sm font-medium ease-in duration-200"
            >
              <a href={CONTACT_MAILTO}>Get in touch</a>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="border-white/20 text-white bg-transparent hover:bg-white/5 hover:text-white px-8 h-12 text-sm font-medium"
            >
              <a href="#why">Learn more ↓</a>
            </Button>
          </div>
        </BlurFade>
      </section>

      {/* Stats bar */}
      <section className="relative z-10 px-6 border-b border-border">
        <div className="mx-auto max-w-8xl border-x border-border">
          <BlurFade inView>
            <div className="grid grid-cols-2 md:grid-cols-4">
              {[
                { value: "77", label: "builders" },
                { value: "24", label: "countries" },
                { value: "7-day", label: "format" },
                { value: "Monthly", label: "cadence" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="border-b md:border-b-0 md:border-r border-border last:border-r-0 px-6 md:px-12 py-8 text-center"
                >
                  <p className="font-heading text-3xl md:text-4xl text-white">
                    {stat.value}
                  </p>
                  <p className="font-mono text-sm text-white/40 mt-1 uppercase tracking-wide">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Why support Buildstory */}
      <section id="why" className="relative z-10 px-6 border-b border-border">
        <div className="mx-auto max-w-8xl border-x border-border px-6 md:px-12 lg:px-24">
          <div className="py-16 md:py-40">
            <BlurFade inView>
              <span className="text-xs uppercase tracking-[0.25em] text-buildstory-500">
                why support buildstory
              </span>
            </BlurFade>

            <BlurFade inView delay={0.1} blur="16px">
              <h2 className="mt-8 font-heading text-4xl md:text-6xl text-[#e8e4de] max-w-3xl leading-tight">
                Your product, in the hands of people who ship.
              </h2>
            </BlurFade>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <BlurFade inView delay={0.1}>
                <div className="border border-white/10 px-6 py-5">
                  <p className="text-lg font-medium text-[#e8e4de]">
                    Authentic adoption signal
                  </p>
                  <p className="text-white/50 mt-1">
                    Tools are logged in build logs, tagged to real projects, and
                    visible on profiles. Not paid placements — real usage by real
                    builders.
                  </p>
                </div>
              </BlurFade>
              <BlurFade inView delay={0.15}>
                <div className="border border-white/10 px-6 py-5">
                  <p className="text-lg font-medium text-[#e8e4de]">
                    Reach builders who ship
                  </p>
                  <p className="text-white/50 mt-1">
                    Every participant commits to shipping something functional in
                    7 days. These aren&apos;t tire-kickers — they&apos;re people
                    who finish what they start.
                  </p>
                </div>
              </BlurFade>
              <BlurFade inView delay={0.2}>
                <div className="border border-white/10 px-6 py-5">
                  <p className="text-lg font-medium text-[#e8e4de]">
                    Recurring, compounding exposure
                  </p>
                  <p className="text-white/50 mt-1">
                    Monthly hackathons mean monthly cohorts. Early supporters get
                    featured across every event — your reach compounds over time.
                  </p>
                </div>
              </BlurFade>
              <BlurFade inView delay={0.25}>
                <div className="border border-white/10 px-6 py-5">
                  <p className="text-lg font-medium text-[#e8e4de]">
                    Zero fluff, full transparency
                  </p>
                  <p className="text-white/50 mt-1">
                    No VC, no upsells, independently run. Your support goes
                    directly to participants — and you can see exactly how
                    it&apos;s used.
                  </p>
                </div>
              </BlurFade>
            </div>
          </div>
        </div>
      </section>

      {/* Ways to support */}
      <section className="relative z-10 px-6 border-b border-border">
        <div className="mx-auto max-w-8xl border-x border-border px-6 md:px-12 lg:px-24">
          <div className="py-16 md:py-40">
            <BlurFade inView>
              <span className="text-xs uppercase tracking-[0.25em] text-buildstory-500">
                ways to support
              </span>
            </BlurFade>

            <BlurFade inView delay={0.1} blur="16px">
              <h2 className="mt-8 font-heading text-4xl md:text-6xl text-[#e8e4de] max-w-3xl leading-tight">
                Pick what works for you.
              </h2>
            </BlurFade>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-3">
              <BlurFade inView delay={0.1}>
                <div className="border border-white/10 px-6 py-8 h-full">
                  <span className="text-sm font-semibold text-white/50 uppercase tracking-wide">
                    01
                  </span>
                  <p className="text-xl font-medium text-[#e8e4de] mt-3">
                    Tool credits & plans
                  </p>
                  <p className="text-white/50 mt-2 leading-relaxed">
                    Offer free product access during the hackathon. Participants
                    build with your tool and generate authentic usage signal that
                    lives on their profile.
                  </p>
                </div>
              </BlurFade>
              <BlurFade inView delay={0.15}>
                <div className="border border-white/10 px-6 py-8 h-full">
                  <span className="text-sm font-semibold text-white/50 uppercase tracking-wide">
                    02
                  </span>
                  <p className="text-xl font-medium text-[#e8e4de] mt-3">
                    API credits
                  </p>
                  <p className="text-white/50 mt-2 leading-relaxed">
                    Remove the cost friction for builders exploring your
                    platform. They get to experiment freely, you get real-world
                    usage data and feedback.
                  </p>
                </div>
              </BlurFade>
              <BlurFade inView delay={0.2}>
                <div className="border border-white/10 px-6 py-8 h-full">
                  <span className="text-sm font-semibold text-white/50 uppercase tracking-wide">
                    03
                  </span>
                  <p className="text-xl font-medium text-[#e8e4de] mt-3">
                    Prizes & incentives
                  </p>
                  <p className="text-white/50 mt-2 leading-relaxed">
                    Sponsor prizes for top builders. Winners showcase your
                    product in their project and build log — permanent, credible
                    social proof.
                  </p>
                </div>
              </BlurFade>
            </div>
          </div>
        </div>
      </section>

      {/* What you get / The format */}
      <section className="relative z-10 px-6 border-b border-border">
        <div className="mx-auto grid max-w-8xl gap-16 md:grid-cols-2 md:gap-20 items-stretch border-x border-border px-6 md:px-12 lg:px-24">
          {/* Left — What you get */}
          <div className="py-16 md:py-40">
            <BlurFade inView>
              <span className="text-xs uppercase tracking-[0.25em] text-white/30">
                what you get
              </span>
            </BlurFade>

            <div className="mt-12 flex flex-col gap-10 font-heading text-3xl md:text-5xl">
              <BlurFade inView delay={0.1}>
                <p className="text-white/85">
                  Buildstory tracks every tool used in every project.
                </p>
              </BlurFade>
              <BlurFade inView delay={0.2}>
                <p className="text-white/85">
                  When someone builds with your product, it shows up in their
                  build log, profile, and tool thread. Permanently.
                </p>
              </BlurFade>
              <BlurFade inView delay={0.3}>
                <p className="text-buildstory-500">
                  This isn&apos;t a logo on a banner. It&apos;s verifiable proof
                  that real people chose your tool.
                </p>
              </BlurFade>
            </div>
          </div>

          {/* Right — The format */}
          <div className="py-16 md:py-40 flex items-start">
            <div className="w-full">
              <BlurFade inView>
                <span className="text-xs uppercase tracking-[0.25em] text-white/30">
                  the format
                </span>
              </BlurFade>

              <div className="mt-12 flex flex-col gap-3">
                <BlurFade inView delay={0.1}>
                  <div className="border border-white/10 px-6 py-5">
                    <span className="text-sm font-semibold text-white/50 uppercase tracking-wide">
                      01
                    </span>
                    <p className="text-white/85 mt-1">
                      7-day monthly hackathons — short enough to be intense, long
                      enough to ship something real.
                    </p>
                  </div>
                </BlurFade>
                <BlurFade inView delay={0.2}>
                  <div className="border border-white/10 px-6 py-5">
                    <span className="text-sm font-semibold text-white/50 uppercase tracking-wide">
                      02
                    </span>
                    <p className="text-white/85 mt-1">
                      All experience levels welcome — from first-time builders to
                      senior engineers exploring new tools.
                    </p>
                  </div>
                </BlurFade>
                <BlurFade inView delay={0.3}>
                  <div className="border border-white/10 px-6 py-5">
                    <span className="text-sm font-semibold text-white/50 uppercase tracking-wide">
                      03
                    </span>
                    <p className="text-white/85 mt-1">
                      Built in public — streams, posts, build logs. Your tool gets
                      organic visibility throughout the event.
                    </p>
                  </div>
                </BlurFade>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 px-6 border-b border-border">
        <div className="mx-auto max-w-8xl border-x border-border px-6 md:px-12 lg:px-24">
          <div className="py-16 md:py-40 flex flex-col items-center text-center">
            <BlurFade inView>
              <span className="text-xs uppercase tracking-[0.25em] text-buildstory-500">
                get involved
              </span>
            </BlurFade>

            <BlurFade inView delay={0.1} blur="16px">
              <h2 className="mt-8 font-heading text-5xl md:text-6xl text-[#e8e4de] max-w-3xl leading-tight">
                Help us arm the builders.
              </h2>
            </BlurFade>

            <BlurFade inView delay={0.2}>
              <p className="mt-6 max-w-xl font-mono text-base text-neutral-500 leading-relaxed">
                Next event: March 28 – April 4, 2026. We&apos;re looking for
                tool makers who want their product in the hands of people who
                actually build. No contracts, no minimums.
              </p>
            </BlurFade>

            <BlurFade inView delay={0.3}>
              <div className="mt-10 flex items-center gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-buildstory-500 text-black hover:bg-white/90 px-8 h-12 text-sm font-medium ease-in duration-200"
                >
                  <a href={CONTACT_MAILTO}>
                    Reach out — {CONTACT_EMAIL}
                  </a>
                </Button>
              </div>
            </BlurFade>

            <BlurFade inView delay={0.4}>
              <p className="mt-6 font-mono text-sm text-white/30">
                Free for builders &middot; Independently run &middot; Open to
                all
              </p>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="border-border border-x flex justify-between max-w-8xl mx-auto px-6 py-8">
        <p className="font-mono text-neutral-600">© 2026 Buildstory</p>
        <p className="font-mono text-neutral-600">Show, don&apos;t tell.</p>
      </section>
    </div>
  );
}
