import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCountryName } from "@/lib/countries";
import { HighlightBadges } from "@/components/reviews/highlight-badges";

interface SubmissionCardProps {
  submission: {
    whatBuilt: string;
    demoUrl: string | null;
    demoMediaUrl: string | null;
    demoMediaType: string | null;
    lessonLearned: string | null;
  };
  profile: {
    displayName: string;
    username: string | null;
    avatarUrl: string | null;
    country: string | null;
  };
  project: {
    name: string;
    slug: string | null;
  };
  tools: { id: string; name: string }[];
  highlights?: {
    totalReviews: number;
    categories: { category: string; count: number }[];
  };
}

const MAX_VISIBLE_TOOLS = 4;

export function SubmissionCard({
  submission,
  profile,
  project,
  tools,
  highlights,
}: SubmissionCardProps) {
  const visibleTools = tools.slice(0, MAX_VISIBLE_TOOLS);
  const extraCount = tools.length - MAX_VISIBLE_TOOLS;

  return (
    <Card className="w-full flex flex-col gap-4">
      {/* Builder info */}
      <div className="flex items-center gap-3">
        {profile.avatarUrl ? (
          <Image
            src={profile.avatarUrl}
            alt={profile.displayName}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
            {profile.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          {profile.username ? (
            <Link
              href={`/members/${profile.username}`}
              className="text-sm font-medium text-foreground hover:text-buildstory-500 transition-colors truncate block"
            >
              {profile.displayName}
            </Link>
          ) : (
            <span className="text-sm font-medium text-foreground truncate block">
              {profile.displayName}
            </span>
          )}
          {profile.country && (
            <p className="text-xs text-muted-foreground">
              {getCountryName(profile.country)}
            </p>
          )}
        </div>
      </div>

      {/* Project name */}
      {project.slug ? (
        <Link
          href={`/projects/${project.slug}`}
          className="text-base font-heading text-foreground hover:text-buildstory-500 transition-colors break-words"
        >
          {project.name}
        </Link>
      ) : (
        <p className="text-base font-heading text-foreground break-words">
          {project.name}
        </p>
      )}

      {/* What they built */}
      <p className="text-sm text-muted-foreground line-clamp-3">
        {submission.whatBuilt}
      </p>

      {/* Tools */}
      {tools.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {visibleTools.map((tool) => (
            <Badge key={tool.id} variant="secondary" className="text-xs">
              {tool.name}
            </Badge>
          ))}
          {extraCount > 0 && (
            <Badge variant="outline" className="text-xs">
              +{extraCount} more
            </Badge>
          )}
        </div>
      )}

      {/* Highlights */}
      {highlights && highlights.totalReviews > 0 && (
        <HighlightBadges
          categories={highlights.categories}
          totalReviews={highlights.totalReviews}
        />
      )}

      {/* Links */}
      {(submission.demoUrl || project.slug) && (
        <div className="flex items-center gap-3 pt-1">
          {submission.demoUrl && (
            <a
              href={submission.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-buildstory-500 hover:text-foreground transition-colors"
            >
              Demo &rarr;
            </a>
          )}
          {project.slug && (
            <Link
              href={`/projects/${project.slug}`}
              className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
            >
              Project &rarr;
            </Link>
          )}
        </div>
      )}
    </Card>
  );
}
