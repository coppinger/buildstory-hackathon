import { BlurFade } from "@/components/blur-fade";
import { GitHubIcon, XIcon, TwitchIcon } from "@/components/icons";

interface TeamMember {
  name: string;
  bio: string;
  avatarUrl?: string;
  socials?: {
    x?: string;
    github?: string;
    twitch?: string;
  };
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Sean Coppinger",
    bio: "Founder of Buildstory. Building tools for builders.",
    socials: {
      x: "https://x.com/seancoppinger",
      github: "https://github.com/coppinger",
    },
  },
  {
    name: "Michael Shimeles",
    bio: "Full-stack builder. Making AI-first products.",
    socials: {
      x: "https://x.com/michaelshimeles",
      github: "https://github.com/michaelshimeles",
    },
  },
  {
    name: "Aiden Laud",
    bio: "Developer and community organizer.",
    socials: {
      x: "https://x.com/aidenlaud",
      github: "https://github.com/aidenlaud",
    },
  },
  {
    name: "Dave",
    bio: "Design and frontend. Crafting the Buildstory experience.",
    socials: {
      x: "https://x.com/dave",
    },
  },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TeamSection() {
  return (
    <section className="relative z-10 px-6 border-b border-border">
      <div className="mx-auto max-w-8xl border-x border-border px-6 md:px-12 lg:px-24">
        <div className="py-16 md:py-40">
          <BlurFade inView>
            <span className="text-xs uppercase tracking-[0.25em] text-buildstory-500">
              team
            </span>
          </BlurFade>

          <BlurFade inView delay={0.1}>
            <h2 className="mt-12 font-heading italic text-3xl md:text-5xl text-[#e8e4de]">
              The people behind the hackathon.
            </h2>
          </BlurFade>

          <BlurFade inView delay={0.15}>
            <p className="mt-2 font-heading italic text-2xl md:text-3xl text-neutral-500">
              Builders who want to see more builders.
            </p>
          </BlurFade>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {TEAM_MEMBERS.map((member, i) => (
              <BlurFade key={member.name} inView delay={0.1 + i * 0.05}>
                <div className="border border-white/10 p-6 flex flex-col gap-4">
                  {/* Avatar */}
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="size-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="size-12 rounded-full bg-white/5 flex items-center justify-center">
                      <span className="text-sm font-medium text-white/50">
                        {getInitials(member.name)}
                      </span>
                    </div>
                  )}

                  {/* Name + bio */}
                  <div>
                    <p className="text-lg font-medium text-[#e8e4de]">
                      {member.name}
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">
                      {member.bio}
                    </p>
                  </div>

                  {/* Social links */}
                  {member.socials && (
                    <div className="flex items-center gap-3 mt-auto">
                      {member.socials.x && (
                        <a
                          href={member.socials.x}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neutral-500 hover:text-white/80 transition-colors"
                        >
                          <XIcon className="size-4" />
                        </a>
                      )}
                      {member.socials.github && (
                        <a
                          href={member.socials.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neutral-500 hover:text-white/80 transition-colors"
                        >
                          <GitHubIcon className="size-4" />
                        </a>
                      )}
                      {member.socials.twitch && (
                        <a
                          href={member.socials.twitch}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neutral-500 hover:text-white/80 transition-colors"
                        >
                          <TwitchIcon className="size-4" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
