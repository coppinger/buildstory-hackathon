import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../lib/db/schema";

const { profiles, events, eventRegistrations, projects, eventProjects } = schema;

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle({ client: sql, schema });

const HACKATHON_EVENT = {
  name: "Hackathon 00",
  slug: "hackathon-00",
  description: "The first Buildstory hackathon — 7 days to build something real with AI.",
  startsAt: new Date("2026-03-01T12:00:00Z"),
  endsAt: new Date("2026-03-08T12:00:00Z"),
  registrationOpensAt: new Date("2026-02-15T00:00:00Z"),
  registrationClosesAt: new Date("2026-03-01T12:00:00Z"),
  status: "open" as const,
};

const SEED_PROFILES = [
  {
    clerkId: "seed_user_1",
    username: "alice_builder",
    displayName: "Alice Builder",
    bio: "Full-stack dev exploring AI agents and code generation tools.",
    country: "US",
    region: "US-CA",
    experienceLevel: "ships_constantly" as const,
    githubHandle: "alicebuilder",
    twitterHandle: "alicebuilds",
  },
  {
    clerkId: "seed_user_2",
    username: "bob_hacks",
    displayName: "Bob Hacks",
    bio: "Product designer learning to code with AI assistants.",
    country: "GB",
    region: "GB-LND",
    experienceLevel: "built_a_few" as const,
    websiteUrl: "https://bobhacks.dev",
  },
  {
    clerkId: "seed_user_3",
    username: "carla_ships",
    displayName: "Carla Ships",
    bio: "First-time hackathon participant. Excited to learn!",
    country: "DE",
    experienceLevel: "getting_started" as const,
  },
  {
    clerkId: "seed_user_4",
    username: "dan_devs",
    displayName: "Dan Devs",
    bio: "Backend engineer building AI-powered APIs.",
    country: "IE",
    region: "IE-D",
    experienceLevel: "ships_constantly" as const,
    githubHandle: "dandevs",
    twitchUrl: "https://twitch.tv/dandevs",
  },
  {
    clerkId: "seed_user_5",
    username: "eve_creates",
    displayName: "Eve Creates",
    bio: "Creative coder making generative art with AI.",
    country: "JP",
    experienceLevel: "built_a_few" as const,
    twitterHandle: "evecreates",
  },
  {
    clerkId: "seed_user_6",
    username: "frank_builds",
    displayName: "Frank Builds",
    bio: "Mobile dev exploring cross-platform AI features.",
    country: "BR",
    region: "BR-SP",
    experienceLevel: "built_a_few" as const,
  },
  {
    clerkId: "seed_user_7",
    username: "grace_codes",
    displayName: "Grace Codes",
    bio: "ML engineer turned product builder.",
    country: "IN",
    experienceLevel: "ships_constantly" as const,
    githubHandle: "gracecodes",
    websiteUrl: "https://gracecodes.io",
  },
  {
    clerkId: "seed_user_8",
    username: "hank_makers",
    displayName: "Hank Makers",
    bio: "Hobbyist builder. Weekend projects are my thing.",
    country: "CA",
    region: "CA-ON",
    experienceLevel: "getting_started" as const,
  },
];

const SEED_PROJECTS = [
  {
    ownerIndex: 0,
    name: "AI Code Reviewer",
    slug: "ai-code-reviewer",
    description: "An AI-powered code review tool that provides actionable feedback on pull requests.",
    startingPoint: "new" as const,
    goalText: "Ship a working GitHub App integration",
    githubUrl: "https://github.com/alicebuilder/ai-code-reviewer",
  },
  {
    ownerIndex: 1,
    name: "DesignBot",
    slug: "designbot",
    description: "A Figma plugin that generates UI component variations using AI.",
    startingPoint: "new" as const,
    goalText: "Launch on Figma community",
  },
  {
    ownerIndex: 3,
    name: "API Health Monitor",
    slug: "api-health-monitor",
    description: "Smart API monitoring that predicts outages before they happen.",
    startingPoint: "existing" as const,
    goalText: "Add AI anomaly detection to the dashboard",
    githubUrl: "https://github.com/dandevs/api-health-monitor",
  },
  {
    ownerIndex: 4,
    name: "Generative Postcards",
    slug: "generative-postcards",
    description: "Create and send AI-generated postcards from your travel photos.",
    startingPoint: "new" as const,
    goalText: "Get 10 people to send a postcard",
  },
  {
    ownerIndex: 6,
    name: "Model Playground",
    slug: "model-playground",
    description: "A visual playground for comparing different AI model outputs side by side.",
    startingPoint: "existing" as const,
    goalText: "Ship a working MVP with 3 model providers",
    githubUrl: "https://github.com/gracecodes/model-playground",
    liveUrl: "https://model-playground.vercel.app",
  },
  {
    ownerIndex: 5,
    name: "Fit Tracker AI",
    slug: "fit-tracker-ai",
    description: "AI-powered workout tracker that adapts routines based on progress.",
    startingPoint: "new" as const,
    goalText: "Ship a working MVP",
  },
  {
    ownerIndex: 7,
    name: "Weekend Recipe AI",
    slug: "weekend-recipe-ai",
    description: "Takes a photo of your fridge and suggests recipes you can make.",
    startingPoint: "new" as const,
    goalText: "Get the image recognition working",
  },
  {
    ownerIndex: 2,
    name: "Learn Lang",
    slug: "learn-lang",
    description: "AI language tutor that creates personalized lessons from your interests.",
    startingPoint: "new" as const,
    goalText: "Build the conversation practice feature",
  },
];

const TEAM_PREFERENCES = [
  "solo",
  "has_team",
  "solo",
  "has_team_open",
  "solo",
  "looking_for_team",
  "has_team",
  "looking_for_team",
] as const;

const COMMITMENT_LEVELS = [
  "all_in",
  "daily",
  "nights_weekends",
  "all_in",
  "daily",
  "not_sure",
  "all_in",
  "nights_weekends",
] as const;

async function seed() {
  console.warn("Seeding database...");

  // 1. Upsert hackathon event
  const [event] = await db
    .insert(events)
    .values(HACKATHON_EVENT)
    .onConflictDoNothing()
    .returning();

  const eventRow =
    event ??
    (await db.query.events.findFirst({
      where: (e, { eq }) => eq(e.slug, "hackathon-00"),
    }));

  if (!eventRow) {
    console.error("Failed to find or create hackathon event");
    process.exit(1);
  }

  console.warn(`Event: ${eventRow.name} (${eventRow.id})`);

  // 2. Upsert profiles
  const profileRows = [];
  for (const p of SEED_PROFILES) {
    const [row] = await db
      .insert(profiles)
      .values(p)
      .onConflictDoNothing()
      .returning();

    if (row) {
      profileRows.push(row);
    } else {
      // Already exists — find it
      const existing = await db.query.profiles.findFirst({
        where: (pr, { eq }) => eq(pr.clerkId, p.clerkId),
      });
      if (existing) profileRows.push(existing);
    }
  }

  console.warn(`Profiles: ${profileRows.length} seeded`);

  // 3. Upsert registrations
  for (let i = 0; i < profileRows.length; i++) {
    await db
      .insert(eventRegistrations)
      .values({
        eventId: eventRow.id,
        profileId: profileRows[i].id,
        teamPreference: TEAM_PREFERENCES[i],
        commitmentLevel: COMMITMENT_LEVELS[i],
      })
      .onConflictDoNothing();
  }

  console.warn(`Registrations: ${profileRows.length} linked`);

  // 4. Upsert projects + event links
  let projectCount = 0;
  for (const sp of SEED_PROJECTS) {
    const profile = profileRows[sp.ownerIndex];
    if (!profile) continue;

    const [proj] = await db
      .insert(projects)
      .values({
        profileId: profile.id,
        name: sp.name,
        slug: sp.slug,
        description: sp.description,
        startingPoint: sp.startingPoint,
        goalText: sp.goalText,
        githubUrl: sp.githubUrl ?? null,
        liveUrl: sp.liveUrl ?? null,
      })
      .onConflictDoNothing()
      .returning();

    if (proj) {
      await db
        .insert(eventProjects)
        .values({ eventId: eventRow.id, projectId: proj.id })
        .onConflictDoNothing();
      projectCount++;
    }
  }

  console.warn(`Projects: ${projectCount} seeded`);
  console.warn("Done!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
