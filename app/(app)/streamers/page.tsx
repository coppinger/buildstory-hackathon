import { StreamersList } from "@/components/streamers/streamers-list";

export default function StreamersPage() {
  return (
    <div className="p-6 md:p-8 lg:p-12 w-full">
      <h1 className="font-heading text-3xl text-foreground">Streamers</h1>
      <p className="mt-2 text-muted-foreground">
        Watch hackathon participants building live on Twitch.
      </p>
      <StreamersList />
    </div>
  );
}
