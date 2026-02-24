import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { events } from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle({ client: sql });

async function seed() {
  await db
    .insert(events)
    .values({
      name: "Hackathon 00",
      slug: "hackathon-00",
      description:
        "The inaugural Buildstory hackathon. 7 days to build something real with AI. Ship by March 8.",
      startsAt: new Date("2026-03-01T00:00:00Z"),
      endsAt: new Date("2026-03-08T23:59:59Z"),
      registrationOpensAt: new Date("2026-02-15T00:00:00Z"),
      registrationClosesAt: new Date("2026-03-01T00:00:00Z"),
      status: "open",
    })
    .onConflictDoNothing({ target: events.slug });

  console.log("Seeded Hackathon 00 event");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
