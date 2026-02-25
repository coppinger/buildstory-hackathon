import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getHackathonProfiles } from "@/lib/queries";

const experienceLabels: Record<string, string> = {
  getting_started: "Getting started",
  built_a_few: "Built a few things",
  ships_constantly: "Ships constantly",
};

const teamLabels: Record<string, string> = {
  solo: "Solo",
  has_team: "Has a team",
  has_team_open: "Team (open)",
  looking_for_team: "Looking for team",
};

export default async function ProfilesPage() {
  const entries = await getHackathonProfiles();

  return (
    <div className="p-8 lg:p-12 w-full">
      <h1 className="font-heading text-3xl text-foreground">Profiles</h1>
      <p className="mt-2 text-muted-foreground">
        Discover builders participating in Hackathon 00.
      </p>

      {entries.length === 0 ? (
        <p className="mt-12 text-muted-foreground text-center">
          No participants registered yet.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {entries.map(({ profile, teamPreference }) => {
            const inner = (
              <div className="border border-border p-6 flex flex-col gap-3 h-full hover:border-foreground/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-foreground shrink-0">
                    {profile.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-foreground font-medium truncate">
                      {profile.displayName}
                    </p>
                    {profile.username && (
                      <p className="text-sm text-muted-foreground font-mono truncate">
                        @{profile.username}
                      </p>
                    )}
                  </div>
                </div>

                {profile.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {profile.bio}
                  </p>
                )}

                <div className="mt-auto pt-2 flex flex-wrap gap-1.5">
                  {profile.experienceLevel && (
                    <Badge variant="outline" className="text-xs">
                      {experienceLabels[profile.experienceLevel] ?? profile.experienceLevel}
                    </Badge>
                  )}
                  {teamPreference && (
                    <Badge variant="outline" className="text-xs">
                      {teamLabels[teamPreference] ?? teamPreference}
                    </Badge>
                  )}
                  {profile.country && (
                    <Badge variant="outline" className="text-xs">
                      {profile.country}
                    </Badge>
                  )}
                </div>
              </div>
            );

            return profile.username ? (
              <Link key={profile.id} href={`/profiles/${profile.username}`}>
                {inner}
              </Link>
            ) : (
              <div key={profile.id}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
