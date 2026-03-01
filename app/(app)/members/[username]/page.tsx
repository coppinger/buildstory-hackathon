import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { UserAvatar } from "@/components/ui/user-avatar";
import { getProfileByUsername } from "@/lib/queries";
import { getCountryByCode, formatLocation } from "@/lib/countries";
import { getRegionName } from "@/lib/regions";

const experienceLabels: Record<string, string> = {
  getting_started: "Getting started",
  built_a_few: "Built a few things",
  ships_constantly: "Ships constantly",
};

const startingPointLabels: Record<string, string> = {
  new: "New",
  existing: "Existing",
};

export default async function ProfileDetailPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const [profile, { userId }] = await Promise.all([
    getProfileByUsername(username),
    auth(),
  ]);

  if (!profile) notFound();

  const isOwner = userId != null && profile.clerkId === userId;

  return (
    <div className="p-6 md:p-8 lg:p-12 w-full max-w-3xl">
      <Link
        href="/members"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors font-mono"
      >
        ← Back to members
      </Link>

      <div className="mt-6 flex items-center gap-4">
        <UserAvatar
          avatarUrl={profile.avatarUrl}
          displayName={profile.displayName}
          size="md"
        />
        <div className="flex-1">
          <h1 className="font-heading text-3xl text-foreground">
            {profile.displayName}
          </h1>
          {profile.username && (
            <p className="text-muted-foreground font-mono">
              @{profile.username}
            </p>
          )}
        </div>
        {isOwner && (
          <Button variant="outline" size="sm" asChild>
            <Link href="/settings">
              <Icon name="edit" size="3.5" />
              Edit profile
            </Link>
          </Button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {profile.experienceLevel && (
          <Badge variant="outline">
            {experienceLabels[profile.experienceLevel] ?? profile.experienceLevel}
          </Badge>
        )}
        {profile.country && (
          <Badge variant="outline">
            {getCountryByCode(profile.country)?.flag}{" "}
            {formatLocation(profile.country, profile.region, profile.region ? getRegionName(profile.region) : undefined)}
          </Badge>
        )}
      </div>

      {profile.bio && (
        <p className="mt-6 text-base text-muted-foreground leading-relaxed">
          {profile.bio}
        </p>
      )}

      {/* Social links */}
      {(profile.websiteUrl || profile.twitterHandle || profile.githubHandle || profile.twitchUrl || profile.streamUrl) && (
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm font-mono">
          {profile.websiteUrl && (
            <a
              href={profile.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-buildstory-500 transition-colors"
            >
              {profile.websiteUrl.replace(/^https?:\/\//, "")}
            </a>
          )}
          {profile.githubHandle && (
            <a
              href={`https://github.com/${profile.githubHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-buildstory-500 transition-colors"
            >
              GitHub
            </a>
          )}
          {profile.twitterHandle && (
            <a
              href={`https://x.com/${profile.twitterHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-buildstory-500 transition-colors"
            >
              @{profile.twitterHandle}
            </a>
          )}
          {profile.twitchUrl && (
            <a
              href={profile.twitchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-buildstory-500 transition-colors"
            >
              Twitch
            </a>
          )}
          {profile.streamUrl && (
            <a
              href={profile.streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-buildstory-500 transition-colors"
            >
              Stream
            </a>
          )}
        </div>
      )}

      {/* Projects */}
      <div className="mt-10 border-t border-border pt-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
          Projects
        </p>
        {profile.projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No projects yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {profile.projects.map((project) => {
              const card = (
                <div className="border border-border p-5 flex flex-col gap-2 hover:border-foreground/20 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-heading text-lg text-foreground">
                      {project.name}
                    </h3>
                    {project.startingPoint && (
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {startingPointLabels[project.startingPoint] ?? project.startingPoint}
                      </Badge>
                    )}
                  </div>
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  {project.eventProjects.length > 0 && (
                    <div className="flex gap-1.5 mt-1">
                      {project.eventProjects.map((ep) => (
                        <Badge key={ep.id} variant="secondary" className="text-xs">
                          {ep.event.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              );

              return project.slug ? (
                <Link key={project.id} href={`/projects/${project.slug}`}>
                  {card}
                </Link>
              ) : (
                <div key={project.id}>{card}</div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
