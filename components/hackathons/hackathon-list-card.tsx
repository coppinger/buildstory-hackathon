import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  type EventStatus,
  getEventStateLabel,
  getEventStateBadgeVariant,
} from "@/lib/events";
import { formatDateRange } from "@/lib/format";

interface HackathonListCardProps {
  name: string;
  slug: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
  state: EventStatus;
  participantCount: number;
}

export function HackathonListCard({
  name,
  slug,
  description,
  startsAt,
  endsAt,
  state,
  participantCount,
}: HackathonListCardProps) {
  return (
    <Link href={`/hackathons/${slug}`}>
      <Card className="w-full hover:border-foreground/20 transition-colors">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-heading text-xl text-foreground">{name}</h2>
              <p className="text-sm font-mono text-muted-foreground mt-1">
                {formatDateRange(startsAt, endsAt)}
              </p>
            </div>
            <Badge variant={getEventStateBadgeVariant(state)}>
              {getEventStateLabel(state)}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>

          <p className="text-xs font-mono text-muted-foreground">
            {participantCount} {participantCount === 1 ? "participant" : "participants"}
          </p>
        </div>
      </Card>
    </Link>
  );
}
