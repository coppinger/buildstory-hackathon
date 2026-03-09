import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  type ComputedEventState,
  getEventStateLabel,
  getEventStateBadgeVariant,
} from "@/lib/events";
import { formatDateRange } from "@/lib/format";

interface HackathonHistoryEntry {
  event: {
    name: string;
    slug: string;
    startsAt: Date;
    endsAt: Date;
  };
  state: ComputedEventState;
  submission: {
    whatBuilt: string;
    demoUrl: string | null;
    tools: { id: string; name: string }[];
  } | null;
}

interface HackathonHistorySectionProps {
  history: HackathonHistoryEntry[];
}

export function HackathonHistorySection({
  history,
}: HackathonHistorySectionProps) {
  if (history.length === 0) return null;

  return (
    <div className="mt-8">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
        Hackathon History
      </p>

      <div className="flex flex-col gap-4">
        {history.map((entry) => (
          <div key={entry.event.slug} className="border border-border p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link
                  href={`/hackathons/${entry.event.slug}`}
                  className="text-sm font-medium text-foreground hover:text-buildstory-500 transition-colors"
                >
                  {entry.event.name}
                </Link>
                <p className="text-xs font-mono text-muted-foreground mt-0.5">
                  {formatDateRange(entry.event.startsAt, entry.event.endsAt)}
                </p>
              </div>
              <Badge variant={getEventStateBadgeVariant(entry.state)}>
                {getEventStateLabel(entry.state)}
              </Badge>
            </div>

            {entry.submission ? (
              <div className="mt-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {entry.submission.whatBuilt}
                </p>
                {entry.submission.tools.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {entry.submission.tools.map((tool) => (
                      <Badge
                        key={tool.id}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tool.name}
                      </Badge>
                    ))}
                  </div>
                )}
                {entry.submission.demoUrl && (
                  <a
                    href={entry.submission.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-buildstory-500 hover:text-foreground transition-colors mt-2 inline-block"
                  >
                    Demo &rarr;
                  </a>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-2 font-mono">
                Participated
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
