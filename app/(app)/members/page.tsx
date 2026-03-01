import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { getHackathonProfiles } from "@/lib/queries";
import { getCountryByCode, formatLocation } from "@/lib/countries";
import { getRegionName } from "@/lib/regions";

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
    <div className="p-6 md:p-8 lg:p-12 w-full">
      <h1 className="font-heading text-3xl text-foreground">Members</h1>
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
                  <UserAvatar
                    avatarUrl={profile.avatarUrl}
                    displayName={profile.displayName}
                    size="sm"
                  />
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
                      {getCountryByCode(profile.country)?.flag}{" "}
                      {formatLocation(profile.country, profile.region, profile.region ? getRegionName(profile.region) : undefined)}
                    </Badge>
                  )}
                </div>
              </div>
            );

            return profile.username ? (
              <Link key={profile.id} href={`/members/${profile.username}`}>
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
