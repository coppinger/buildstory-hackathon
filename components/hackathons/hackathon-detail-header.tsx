import { Badge } from "@/components/ui/badge";
import {
  type ComputedEventState,
  getEventStateLabel,
  getEventStateBadgeVariant,
} from "@/lib/events";
import { formatDateRange } from "@/lib/format";

interface HackathonDetailHeaderProps {
  name: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
  state: ComputedEventState;
  participantCount: number;
  projectCount: number;
  submissionCount: number;
}

export function HackathonDetailHeader({
  name,
  description,
  startsAt,
  endsAt,
  state,
  participantCount,
  projectCount,
  submissionCount,
}: HackathonDetailHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Badge variant={getEventStateBadgeVariant(state)}>
          {getEventStateLabel(state)}
        </Badge>
      </div>

      <h1 className="font-heading text-3xl md:text-5xl text-foreground">
        {name}
      </h1>

      <p className="text-sm font-mono text-muted-foreground">
        {formatDateRange(startsAt, endsAt, "long")} &middot; Fully remote
      </p>

      <p className="text-base text-muted-foreground max-w-2xl">{description}</p>

      <div className="flex flex-wrap gap-6 border-t border-border pt-4 mt-2">
        <Stat label="Participants" value={participantCount} />
        <Stat label="Projects" value={projectCount} />
        <Stat label="Submitted" value={submissionCount} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <p className="text-lg font-medium text-foreground font-mono tabular-nums">
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
