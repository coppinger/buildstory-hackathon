import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { TwitchIcon } from "@/components/icons";
import type { LiveStreamer } from "@/app/api/streamers/route";

function formatViewerCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
}

export function StreamerCard({ streamer }: { streamer: LiveStreamer }) {
  const twitchUrl = `https://twitch.tv/${streamer.twitchUsername}`;

  return (
    <div className="border border-border overflow-hidden hover:border-foreground/20 transition-colors">
      {/* Stream thumbnail */}
      <a
        href={twitchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative"
      >
        <img
          src={streamer.thumbnailUrl}
          alt={streamer.streamTitle}
          className="w-full aspect-video object-cover"
        />
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <Badge className="bg-red-600 text-white border-none text-xs font-semibold px-1.5 py-0.5">
            LIVE
          </Badge>
          <Badge
            variant="secondary"
            className="text-xs font-mono bg-black/60 text-white border-none px-1.5 py-0.5"
          >
            {formatViewerCount(streamer.viewerCount)} viewers
          </Badge>
        </div>
      </a>

      {/* Info */}
      <div className="p-4 space-y-3">
        <p className="text-sm font-medium line-clamp-1" title={streamer.streamTitle}>
          {streamer.streamTitle}
        </p>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {streamer.username ? (
              <Link
                href={`/members/${streamer.username}`}
                className="flex items-center gap-2 min-w-0"
              >
                <UserAvatar
                  avatarUrl={streamer.avatarUrl}
                  displayName={streamer.displayName}
                  size="xs"
                />
                <span className="text-sm text-muted-foreground truncate hover:text-foreground transition-colors">
                  {streamer.displayName}
                </span>
              </Link>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <UserAvatar
                  avatarUrl={streamer.avatarUrl}
                  displayName={streamer.displayName}
                  size="xs"
                />
                <span className="text-sm text-muted-foreground truncate">
                  {streamer.displayName}
                </span>
              </div>
            )}
          </div>
          <a
            href={twitchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={`Watch ${streamer.twitchUsername} on Twitch`}
          >
            <TwitchIcon className="w-4 h-4" />
          </a>
        </div>

        <Badge variant="outline" className="text-xs">
          {streamer.gameName}
        </Badge>
      </div>
    </div>
  );
}
