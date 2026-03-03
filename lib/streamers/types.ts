export interface LiveStreamer {
  profileId: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  twitchUsername: string;
  streamTitle: string;
  gameName: string;
  viewerCount: number;
  thumbnailUrl: string;
  startedAt: string;
}
