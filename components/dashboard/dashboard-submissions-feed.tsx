import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/section-label";
import { getCountryName } from "@/lib/countries";
import { timeAgo } from "@/lib/time";

interface SubmissionFeedItem {
  submission: {
    whatBuilt: string;
    submittedAt: Date;
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
}

interface DashboardSubmissionsFeedProps {
  items: SubmissionFeedItem[];
}

export function DashboardSubmissionsFeed({
  items,
}: DashboardSubmissionsFeedProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Card className="w-full">
      <SectionLabel className="mb-4">Recent Submissions</SectionLabel>

      <div className="flex flex-col gap-4">
        {items.map((item, i) => (
          <div
            key={item.project.slug ?? i}
            className="flex flex-col gap-2 pb-4 border-b border-border last:border-0 last:pb-0"
          >
            <div className="flex items-center gap-2">
              {item.profile.avatarUrl ? (
                <Image
                  src={item.profile.avatarUrl}
                  alt={item.profile.displayName}
                  width={24}
                  height={24}
                  className="h-6 w-6 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground shrink-0">
                  {item.profile.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex items-center gap-1.5 min-w-0">
                {item.profile.username ? (
                  <Link
                    href={`/members/${item.profile.username}`}
                    className="text-sm font-medium text-foreground hover:text-buildstory-500 transition-colors truncate"
                  >
                    {item.profile.displayName}
                  </Link>
                ) : (
                  <span className="text-sm font-medium text-foreground truncate">
                    {item.profile.displayName}
                  </span>
                )}
                {item.profile.country && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {getCountryName(item.profile.country)}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground ml-auto shrink-0">
                {timeAgo(item.submission.submittedAt)}
              </span>
            </div>

            {item.project.slug ? (
              <Link
                href={`/projects/${item.project.slug}`}
                className="text-sm font-medium text-foreground hover:text-buildstory-500 transition-colors"
              >
                {item.project.name}
              </Link>
            ) : (
              <p className="text-sm font-medium text-foreground">
                {item.project.name}
              </p>
            )}

            <p className="text-xs text-muted-foreground line-clamp-2">
              {item.submission.whatBuilt}
            </p>

            {item.tools.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {item.tools.slice(0, 3).map((tool) => (
                  <Badge key={tool.id} variant="secondary" className="text-[10px] px-1.5 py-0">
                    {tool.name}
                  </Badge>
                ))}
                {item.tools.length > 3 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    +{item.tools.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
