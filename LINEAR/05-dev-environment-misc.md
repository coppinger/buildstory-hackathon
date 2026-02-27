# Ticket 05: Dev Environment & Misc

**Priority:** Medium | **Estimate:** Small | **Labels:** DX, tooling

## Summary

Improve the developer experience: add a seed script with sample data for local development, add "Settings" to the app sidebar, and clean up minor rough edges.

## Context

- The existing seed script (`lib/db/seed.ts`) only creates the hackathon event record — no profiles, projects, or registrations
- The sidebar has 4 nav items (Dashboard, Hackathon, Projects, Profiles) but no Settings link
- Ticket 04 creates the `/settings` page; this ticket adds the nav link to it

## Owned Files (write access)

- `components/app-sidebar.tsx` — add Settings nav item
- `scripts/seed.ts` — NEW: comprehensive seed script
- `package.json` — add `db:seed` script

**Reads from (no changes):**
- `lib/db/schema.ts` — table definitions for seed data
- `lib/db/index.ts` — db client

## Coordination Dependencies

- **From Ticket 04:** Ticket 04 creates `/settings`. This ticket adds it to the sidebar.

## Tasks

### 1. Add "Settings" to Sidebar (`components/app-sidebar.tsx`)

Add a Settings nav item separated from the main nav group. It should appear at the bottom of the sidebar, visually distinct from the content nav items.

**Current nav items:**
```ts
const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Hackathon", href: "/hackathon" },
  { label: "Projects", href: "/projects" },
  { label: "Profiles", href: "/profiles" },
];
```

**Options for placement:**

**Option A (simple):** Add to the existing array:
```ts
const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Hackathon", href: "/hackathon" },
  { label: "Projects", href: "/projects" },
  { label: "Profiles", href: "/profiles" },
  { label: "Settings", href: "/settings" },
];
```

**Option B (separated):** Render Settings as a separate link below the main nav, with a small gap or divider. This is nicer UX since Settings is a utility page, not content. Use the same link styles but render it in its own section.

Go with whichever fits the current sidebar layout naturally. If the sidebar is a simple `<nav>` with a map, Option A is fine. If there's room for a bottom section, Option B is better.

### 2. Seed Script (`scripts/seed.ts`)

Create a comprehensive seed script that populates the dev database with realistic sample data for local development. This is critical for UI development — empty states are hard to design against.

**Location:** `scripts/seed.ts` (new file)

**Script structure:**
```ts
import { db } from "@/lib/db";
import { profiles, projects, events, eventRegistrations, eventProjects } from "@/lib/db/schema";
import { HACKATHON_SLUG } from "@/lib/constants";

async function seed() {
  console.log("Seeding database...");

  // 1. Ensure hackathon event exists (from existing seed.ts logic)
  // 2. Create sample profiles
  // 3. Create sample projects
  // 4. Register profiles for the event
  // 5. Link projects to the event

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
```

**Sample data to create:**

**Profiles (5-8):**
```ts
const sampleProfiles = [
  {
    clerkId: "seed_user_1",
    username: "alexbuilds",
    displayName: "Alex Chen",
    bio: "Full-stack dev building AI tools. Previously at Stripe.",
    experienceLevel: "ships_constantly",
    country: "US",
    region: "US-CA",
    githubHandle: "alexchen",
    twitterHandle: "alexbuilds",
    websiteUrl: "https://alexchen.dev",
  },
  {
    clerkId: "seed_user_2",
    username: "priya-codes",
    displayName: "Priya Sharma",
    bio: "ML engineer exploring creative AI applications.",
    experienceLevel: "built_a_few",
    country: "IN",
    region: "IN-KA",
    githubHandle: "priyasharma",
  },
  {
    clerkId: "seed_user_3",
    username: "marcusdev",
    displayName: "Marcus Johnson",
    bio: "Just started learning to code with AI assistants.",
    experienceLevel: "getting_started",
    country: "GB",
    region: "GB-ENG",
  },
  {
    clerkId: "seed_user_4",
    username: "yuki-ml",
    displayName: "Yuki Tanaka",
    bio: "Building computer vision tools for accessibility.",
    experienceLevel: "ships_constantly",
    country: "JP",
    githubHandle: "yukiml",
    twitterHandle: "yuki_ml",
    twitchUrl: "https://twitch.tv/yukiml",
  },
  {
    clerkId: "seed_user_5",
    username: "sam-creates",
    displayName: "Sam Rivera",
    bio: "Designer turned developer. Making AI more human.",
    experienceLevel: "built_a_few",
    country: "BR",
    region: "BR-SP",
    websiteUrl: "https://samrivera.design",
    twitterHandle: "samcreates",
  },
];
```

**Projects (5-8, linked to profiles above):**
```ts
const sampleProjects = [
  {
    profileIndex: 0, // Alex
    name: "CodeReview AI",
    slug: "codereview-ai",
    description: "An AI-powered code review tool that catches bugs and suggests improvements before you push.",
    startingPoint: "new",
    goalText: "Ship a working MVP with GitHub integration",
    githubUrl: "https://github.com/alexchen/codereview-ai",
  },
  {
    profileIndex: 1, // Priya
    name: "ArtLens",
    slug: "artlens",
    description: "Turn your phone camera into an art analyzer. Point at any artwork and get instant context, history, and style analysis.",
    startingPoint: "existing",
    goalText: "Add real-time video analysis and museum mode",
    githubUrl: "https://github.com/priyasharma/artlens",
    liveUrl: "https://artlens.app",
  },
  {
    profileIndex: 2, // Marcus
    name: "My First AI App",
    slug: "my-first-ai-app",
    description: "Learning to build with AI by creating a simple chatbot that helps with homework.",
    startingPoint: "new",
    goalText: "Learn a new AI framework",
  },
  {
    profileIndex: 3, // Yuki
    name: "Accessible Vision",
    slug: "accessible-vision",
    description: "Computer vision toolkit that generates audio descriptions of images for visually impaired users.",
    startingPoint: "existing",
    goalText: "Ship browser extension and get 10 beta users",
    githubUrl: "https://github.com/yukiml/accessible-vision",
    liveUrl: "https://accessible-vision.dev",
  },
  {
    profileIndex: 4, // Sam
    name: "DesignBuddy",
    slug: "designbuddy",
    description: "AI design assistant that gives feedback on your UI mockups and suggests accessibility improvements.",
    startingPoint: "new",
    goalText: "Launch on Product Hunt",
    githubUrl: "https://github.com/samrivera/designbuddy",
  },
];
```

**Event registrations:** Register all sample profiles for the hackathon event with varied `teamPreference` values (`solo`, `has_team`, `looking_for_team`, etc.).

**Event projects:** Link all sample projects to the hackathon event.

**Important implementation notes:**
- Use `onConflictDoNothing()` on all inserts so the script is idempotent (safe to run multiple times)
- Use `seed_user_*` clerk IDs — these won't collide with real Clerk users
- The script should be runnable with `npx tsx scripts/seed.ts` (tsx handles TypeScript and path aliases via tsconfig)
- Import the db client from `@/lib/db` — ensure the path alias works with tsx (may need to use `tsx --tsconfig tsconfig.json`)

### 3. Add `db:seed` Script to `package.json`

Add to the `scripts` section:
```json
"db:seed": "tsx scripts/seed.ts"
```

Check if `tsx` is already a dependency. If not, add it as a dev dependency: `npm install -D tsx`.

Note: The existing `lib/db/seed.ts` file only seeds the event record. The new `scripts/seed.ts` should call the same event-seeding logic (or inline it) and then add the sample profiles/projects on top.

### 4. Move/Consolidate Event Seed Logic

The existing `lib/db/seed.ts` creates the hackathon event. The new `scripts/seed.ts` should either:
- Import and call the event seed from `lib/db/seed.ts`, then add sample data
- Or inline the event creation and make `scripts/seed.ts` the single entry point

Either way, the `db:seed` script should be a one-command solution that gives you a populated dev database.

## Verification

1. Run `npm run db:seed` against the dev database — verify it completes without errors
2. Run it again — verify idempotency (no duplicate key errors)
3. Check `/projects` — verify sample projects appear with correct data
4. Check `/profiles` — verify sample profiles appear with varied experience levels and countries
5. Check that a project detail page (`/projects/codereview-ai`) shows the correct author
6. Verify the sidebar shows "Settings" nav item linking to `/settings`
7. Run `npm run lint` — verify no lint errors in new files
8. Run `npm test` — verify no regressions
