import type { Metadata } from "next";
import { getAllPublicEvents, getEventRegistrationCount } from "@/lib/queries";
import { HackathonListCard } from "@/components/hackathons/hackathon-list-card";

export const metadata: Metadata = {
  title: "Hackathons",
};

export default async function HackathonsPage() {
  const allEvents = await getAllPublicEvents();

  const eventsWithState = await Promise.all(
    allEvents.map(async (event) => {
      const state = event.status;
      const participantCount = await getEventRegistrationCount(event.id);
      return { event, state, participantCount };
    })
  );

  const current = eventsWithState.filter(
    (e) => e.state === "active" || e.state === "judging"
  );
  const upcoming = eventsWithState.filter((e) => e.state === "open");
  const previous = eventsWithState.filter((e) => e.state === "complete");

  return (
    <div className="p-6 md:p-8 lg:p-12 w-full max-w-3xl">
      <h1 className="font-heading text-3xl md:text-4xl text-foreground">
        Hackathons
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Build something real. Ship it. Repeat.
      </p>

      {current.length > 0 && (
        <Section title="Current">
          {current.map(({ event, state, participantCount }) => (
            <HackathonListCard
              key={event.id}
              name={event.name}
              slug={event.slug}
              description={event.description}
              startsAt={event.startsAt}
              endsAt={event.endsAt}
              state={state}
              participantCount={participantCount}
            />
          ))}
        </Section>
      )}

      {upcoming.length > 0 && (
        <Section title="Upcoming">
          {upcoming.map(({ event, state, participantCount }) => (
            <HackathonListCard
              key={event.id}
              name={event.name}
              slug={event.slug}
              description={event.description}
              startsAt={event.startsAt}
              endsAt={event.endsAt}
              state={state}
              participantCount={participantCount}
            />
          ))}
        </Section>
      )}

      {previous.length > 0 && (
        <Section title="Previous">
          {previous.map(({ event, state, participantCount }) => (
            <HackathonListCard
              key={event.id}
              name={event.name}
              slug={event.slug}
              description={event.description}
              startsAt={event.startsAt}
              endsAt={event.endsAt}
              state={state}
              participantCount={participantCount}
            />
          ))}
        </Section>
      )}

      {eventsWithState.length === 0 && (
        <div className="text-center py-20">
          <p className="text-sm text-muted-foreground font-mono">
            No hackathons yet. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-8">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono mb-4">
        {title}
      </p>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}
