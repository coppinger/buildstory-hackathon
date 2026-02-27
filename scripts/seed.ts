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
  {
    clerkId: "seed_user_9",
    username: "ines_dev",
    displayName: "Ines Dev",
    bio: "Frontend engineer obsessed with design systems.",
    country: "FR",
    experienceLevel: "ships_constantly" as const,
    twitterHandle: "inesdev",
  },
  {
    clerkId: "seed_user_10",
    username: "jake_proto",
    displayName: "Jake Proto",
    bio: "Rapid prototyper. Cursor + Claude all day.",
    country: "US",
    region: "US-NY",
    experienceLevel: "built_a_few" as const,
    githubHandle: "jakeproto",
  },
  {
    clerkId: "seed_user_11",
    username: "kira_ai",
    displayName: "Kira AI",
    bio: "Research scientist exploring practical AI applications.",
    country: "KR",
    experienceLevel: "ships_constantly" as const,
    websiteUrl: "https://kira.ai",
  },
  {
    clerkId: "seed_user_12",
    username: "leo_stack",
    displayName: "Leo Stack",
    bio: "Fullstack TypeScript enthusiast.",
    country: "AU",
    region: "AU-NSW",
    experienceLevel: "built_a_few" as const,
    githubHandle: "leostack",
  },
  {
    clerkId: "seed_user_13",
    username: "mia_makes",
    displayName: "Mia Makes",
    bio: "Designer who codes. Making tools for creatives.",
    country: "NL",
    experienceLevel: "ships_constantly" as const,
  },
  {
    clerkId: "seed_user_14",
    username: "nate_builds",
    displayName: "Nate Builds",
    bio: "Ex-FAANG, now indie hacking with AI.",
    country: "US",
    region: "US-WA",
    experienceLevel: "ships_constantly" as const,
    twitterHandle: "natebuilds",
    githubHandle: "natebuilds",
  },
  {
    clerkId: "seed_user_15",
    username: "olivia_ops",
    displayName: "Olivia Ops",
    bio: "DevOps engineer automating everything with AI.",
    country: "SE",
    experienceLevel: "built_a_few" as const,
  },
  {
    clerkId: "seed_user_16",
    username: "pete_pixel",
    displayName: "Pete Pixel",
    bio: "Game dev making AI-powered NPCs.",
    country: "PL",
    experienceLevel: "built_a_few" as const,
    githubHandle: "petepixel",
  },
  {
    clerkId: "seed_user_17",
    username: "quinn_code",
    displayName: "Quinn Code",
    bio: "CS student building their first real project.",
    country: "IE",
    experienceLevel: "getting_started" as const,
  },
  {
    clerkId: "seed_user_18",
    username: "rosa_labs",
    displayName: "Rosa Labs",
    bio: "Biotech researcher applying LLMs to drug discovery.",
    country: "ES",
    experienceLevel: "ships_constantly" as const,
    websiteUrl: "https://rosalabs.bio",
  },
  {
    clerkId: "seed_user_19",
    username: "sam_ships",
    displayName: "Sam Ships",
    bio: "Serial shipper. 12 projects in 12 months.",
    country: "US",
    region: "US-TX",
    experienceLevel: "ships_constantly" as const,
    twitterHandle: "samships",
  },
  {
    clerkId: "seed_user_20",
    username: "tina_tech",
    displayName: "Tina Tech",
    bio: "Teaching kids to code with AI tools.",
    country: "NG",
    experienceLevel: "built_a_few" as const,
  },
  {
    clerkId: "seed_user_21",
    username: "uma_ux",
    displayName: "Uma UX",
    bio: "UX researcher building AI usability testing tools.",
    country: "IN",
    region: "IN-KA",
    experienceLevel: "built_a_few" as const,
  },
  {
    clerkId: "seed_user_22",
    username: "vic_ventures",
    displayName: "Vic Ventures",
    bio: "VC turned builder. Putting my money where my code is.",
    country: "SG",
    experienceLevel: "getting_started" as const,
  },
  {
    clerkId: "seed_user_23",
    username: "wren_writes",
    displayName: "Wren Writes",
    bio: "Technical writer building AI doc generators.",
    country: "CA",
    region: "CA-BC",
    experienceLevel: "built_a_few" as const,
    githubHandle: "wrenwrites",
  },
  {
    clerkId: "seed_user_24",
    username: "xander_x",
    displayName: "Xander X",
    bio: "Cybersecurity pro building AI threat detection.",
    country: "IL",
    experienceLevel: "ships_constantly" as const,
  },
  {
    clerkId: "seed_user_25",
    username: "yuki_yolo",
    displayName: "Yuki Yolo",
    bio: "Startup founder. Move fast, ship faster.",
    country: "JP",
    experienceLevel: "ships_constantly" as const,
    twitterHandle: "yukiyolo",
  },
  {
    clerkId: "seed_user_26",
    username: "zara_zen",
    displayName: "Zara Zen",
    bio: "Mindfulness app developer exploring AI coaching.",
    country: "ZA",
    experienceLevel: "built_a_few" as const,
  },
  {
    clerkId: "seed_user_27",
    username: "axel_auto",
    displayName: "Axel Auto",
    bio: "Robotics engineer adding LLM brains to robots.",
    country: "DE",
    experienceLevel: "ships_constantly" as const,
    githubHandle: "axelauto",
  },
  {
    clerkId: "seed_user_28",
    username: "bella_bytes",
    displayName: "Bella Bytes",
    bio: "Data engineer building smarter pipelines with AI.",
    country: "IT",
    experienceLevel: "built_a_few" as const,
  },
  {
    clerkId: "seed_user_29",
    username: "carl_cloud",
    displayName: "Carl Cloud",
    bio: "Cloud architect exploring AI infrastructure.",
    country: "US",
    region: "US-CO",
    experienceLevel: "ships_constantly" as const,
    websiteUrl: "https://carlcloud.dev",
  },
  {
    clerkId: "seed_user_30",
    username: "diya_data",
    displayName: "Diya Data",
    bio: "ML engineer focused on real-time inference.",
    country: "IN",
    region: "IN-MH",
    experienceLevel: "ships_constantly" as const,
  },
  {
    clerkId: "seed_user_31",
    username: "eli_edge",
    displayName: "Eli Edge",
    bio: "Edge computing enthusiast. Running models on-device.",
    country: "FI",
    experienceLevel: "built_a_few" as const,
    githubHandle: "eliedge",
  },
  {
    clerkId: "seed_user_32",
    username: "faye_flux",
    displayName: "Faye Flux",
    bio: "Creative technologist. Art meets AI.",
    country: "GB",
    region: "GB-EDH",
    experienceLevel: "ships_constantly" as const,
    twitterHandle: "fayeflux",
  },
  {
    clerkId: "seed_user_33",
    username: "gus_graph",
    displayName: "Gus Graph",
    bio: "Graph database nerd building knowledge graphs with AI.",
    country: "AT",
    experienceLevel: "built_a_few" as const,
  },
  {
    clerkId: "seed_user_34",
    username: "hope_hack",
    displayName: "Hope Hack",
    bio: "Social impact developer. AI for good.",
    country: "KE",
    experienceLevel: "getting_started" as const,
  },
  {
    clerkId: "seed_user_35",
    username: "ivan_infra",
    displayName: "Ivan Infra",
    bio: "Infrastructure as code, now with AI.",
    country: "UA",
    experienceLevel: "ships_constantly" as const,
    githubHandle: "ivaninfra",
  },
  {
    clerkId: "seed_user_36",
    username: "jade_jam",
    displayName: "Jade Jam",
    bio: "Music producer building AI composition tools.",
    country: "JM",
    experienceLevel: "getting_started" as const,
  },
  {
    clerkId: "seed_user_37",
    username: "kai_kernel",
    displayName: "Kai Kernel",
    bio: "Systems programmer. Optimizing AI at the metal.",
    country: "NZ",
    experienceLevel: "ships_constantly" as const,
  },
  {
    clerkId: "seed_user_38",
    username: "luna_lang",
    displayName: "Luna Lang",
    bio: "Linguist building multilingual AI tools.",
    country: "MX",
    experienceLevel: "built_a_few" as const,
    twitterHandle: "lunalang",
  },
  {
    clerkId: "seed_user_39",
    username: "max_mesh",
    displayName: "Max Mesh",
    bio: "3D artist generating assets with AI.",
    country: "BR",
    region: "BR-RJ",
    experienceLevel: "built_a_few" as const,
  },
  {
    clerkId: "seed_user_40",
    username: "nina_net",
    displayName: "Nina Net",
    bio: "Networking engineer automating config with LLMs.",
    country: "CH",
    experienceLevel: "ships_constantly" as const,
  },
  {
    clerkId: "seed_user_41",
    username: "omar_open",
    displayName: "Omar Open",
    bio: "Open source advocate. Building in public.",
    country: "EG",
    experienceLevel: "built_a_few" as const,
    githubHandle: "omaropen",
  },
  {
    clerkId: "seed_user_42",
    username: "priya_prod",
    displayName: "Priya Prod",
    bio: "Product manager learning to build with AI.",
    country: "IN",
    region: "IN-DL",
    experienceLevel: "getting_started" as const,
  },
  {
    clerkId: "seed_user_43",
    username: "rex_rust",
    displayName: "Rex Rust",
    bio: "Rust developer building high-perf AI tooling.",
    country: "US",
    region: "US-OR",
    experienceLevel: "ships_constantly" as const,
    githubHandle: "rexrust",
  },
  {
    clerkId: "seed_user_44",
    username: "suki_swift",
    displayName: "Suki Swift",
    bio: "iOS developer adding on-device AI features.",
    country: "JP",
    experienceLevel: "built_a_few" as const,
  },
  {
    clerkId: "seed_user_45",
    username: "theo_tensor",
    displayName: "Theo Tensor",
    bio: "Deep learning researcher turned app builder.",
    country: "GR",
    experienceLevel: "ships_constantly" as const,
    websiteUrl: "https://theotensor.com",
  },
  {
    clerkId: "seed_user_46",
    username: "uri_util",
    displayName: "Uri Util",
    bio: "Developer tools enthusiast. Making DX better with AI.",
    country: "IL",
    experienceLevel: "built_a_few" as const,
  },
  {
    clerkId: "seed_user_47",
    username: "vera_voice",
    displayName: "Vera Voice",
    bio: "Voice UI designer building conversational AI.",
    country: "RU",
    experienceLevel: "built_a_few" as const,
  },
  {
    clerkId: "seed_user_48",
    username: "will_web3",
    displayName: "Will Web3",
    bio: "Decentralized AI explorer. On-chain everything.",
    country: "PT",
    experienceLevel: "getting_started" as const,
  },
  {
    clerkId: "seed_user_49",
    username: "xena_xr",
    displayName: "Xena XR",
    bio: "XR developer integrating AI into spatial computing.",
    country: "US",
    region: "US-CA",
    experienceLevel: "ships_constantly" as const,
  },
  {
    clerkId: "seed_user_50",
    username: "yosef_yaml",
    displayName: "Yosef Yaml",
    bio: "Config management wizard. AI-powered DevOps.",
    country: "TR",
    experienceLevel: "built_a_few" as const,
    githubHandle: "yosefyaml",
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

const TEAM_PREFS_POOL = ["solo", "has_team", "has_team_open", "looking_for_team"] as const;
const COMMITMENT_POOL = ["all_in", "daily", "nights_weekends", "not_sure"] as const;

const TEAM_PREFERENCES = SEED_PROFILES.map(
  (_, i) => TEAM_PREFS_POOL[i % TEAM_PREFS_POOL.length]
);
const COMMITMENT_LEVELS = SEED_PROFILES.map(
  (_, i) => COMMITMENT_POOL[i % COMMITMENT_POOL.length]
);

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
