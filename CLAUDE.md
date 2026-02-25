# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Buildstory

Buildstory is a community platform for AI builders. The core thesis: "what have you built?" is the ultimate signal of credibility in a landscape full of noise.

The platform combines profiles, project showcases, automated build logs (via GitHub webhook integration), and a reputation system where verified building experience earns authority. Projects are tagged with the tools used to build them, and those tags double as permanent discussion threads — so conversations about a tool are anchored to real usage, not speculation.

## Current Focus

Launching through **Hackathon 00** (March 1–8, 2026), a 7-day AI building event. Everything built for v1 serves this event but is architected to outlive it. Participants register, create projects, log updates, and ship something real by the end of the week.

## Principles

- Show, don't tell — verifiable work over marketing claims
- Zero-friction capture — automated build logs after initial setup
- Projects are first-class, independent entities that can optionally be linked to events
- Inclusive by default — designed for builders at every experience level

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19, TypeScript), deployed on Vercel
- **Styling**: Tailwind CSS v4, shadcn/ui (new-york style), tw-animate-css
- **Fonts**: DM Sans (body via `font-sans`), Instrument Serif (headings via `font-heading`), DM Mono (mono via `font-mono`) -- loaded in `app/layout.tsx` as CSS variables
- **Animation**: Motion (Framer Motion), custom BlurFade component with scroll-triggered `inView` mode; `canvas-confetti` for celebration effects
- **Map**: Mapbox GL (`mapbox-gl`) for the Globe component
- **Shaders**: `@paper-design/shaders-react` for ShaderBackground
- **Auth**: Clerk (`@clerk/nextjs`) -- custom sign-in/sign-up forms (not Clerk pre-built components)
- **Database**: Neon Postgres via `@neondatabase/serverless` (HTTP adapter), Drizzle ORM
- **Icons**: Google Material Symbols (`material-symbols`, sharp filled style) via `components/ui/icon.tsx` `<Icon>` wrapper -- brand icons (GitHub, Google) are custom SVGs in `components/icons.tsx`
- **UI primitives**: Radix UI via `radix-ui` package
- **Charts**: Recharts (`recharts`) via shadcn chart component (`components/ui/chart.tsx`)
- **Notifications**: Discord webhooks (`lib/discord.ts`) -- fire-and-forget signup/project pings and milestone alerts
- **Monitoring**: Sentry (`@sentry/nextjs`) -- error tracking on server, edge, and client; server actions use `Sentry.captureException` with component/action tags
- **Testing**: Vitest (integration tests against real Neon DB)
- **CI**: GitHub Actions (`.github/workflows/test.yml`) -- lint + tests on push/PR to main
- **AI enrichment:** Anthropic API (future — build log processing)

## Commands

```
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
npm test         # Run integration tests (Vitest, hits real DB)
npm run test:watch  # Run tests in watch mode
npx drizzle-kit generate   # Generate migrations from schema changes
npx drizzle-kit migrate    # Apply migrations to database
npx drizzle-kit studio     # Open Drizzle Studio (DB browser)
```

## Architecture

### Auth Flow

Clerk auth with **custom UI forms** (not pre-built Clerk components). The auth pages use `useSignIn` and `useSignUp` hooks from `@clerk/nextjs` with email/password and OAuth (Google, GitHub).

- `proxy.ts` -- Clerk middleware using Next.js 16's proxy convention (replaces traditional `middleware.ts`); redirects signed-in users from `/` to `/dashboard`; also enforces admin route protection (redirects non-admin users from `/admin/*`)
- `app/(auth)/` -- Route group with a two-column layout (form left, dark panel right)
- `app/(auth)/sign-in/` -- Posts to `/dashboard` after sign-in (email or OAuth)
- `app/(auth)/sign-up/` -- Posts to `/hackathon` after sign-up (email or OAuth)
- Admin access: `lib/admin.ts` exports `isAdmin(clerkUserId)` which checks the `ADMIN_USER_IDS` env var (comma-separated Clerk IDs). Guarded at both middleware and layout levels (defense-in-depth).

### Profile Creation (Just-in-Time)

No webhook. Profiles are created lazily via `lib/db/ensure-profile.ts` -- call `ensureProfile(clerkId)` whenever you need to guarantee a profile exists. It checks for an existing profile, and if absent, fetches the user's name from Clerk and inserts a new row with `onConflictDoNothing` for race-safety.

### Database

Neon Postgres with Drizzle ORM. Client in `lib/db/index.ts` uses the Neon HTTP (serverless) adapter and imports the full schema for relational queries.

**Schema** (`lib/db/schema.ts`):
- `profiles` -- clerk_id (unique), username (unique, nullable), display_name, bio, social links, experience_level enum
- `events` -- name, slug (unique), description, dates, status enum (draft/open/active/judging/complete)
- `eventRegistrations` -- links profile to event with team_preference enum, unique on (event_id, profile_id)
- `projects` -- profile_id (FK), name, slug (unique, nullable), description, starting_point enum, goal_text, github_url, live_url
- `eventProjects` -- junction linking projects to events, unique on (event_id, project_id)
- `users` -- legacy table (id, name, email)

Enums: `experience_level`, `event_status`, `team_preference`, `starting_point`

Type exports follow the pattern: `TableName` (select type) and `NewTableName` (insert type).

Config reads `DATABASE_URL` from `.env.local` (via dotenv in `drizzle.config.ts`; Next.js auto-loads it at runtime).

### Page Structure

`app/page.tsx` is a single server component composing all landing page sections. Client-side interactivity is isolated to individual components (countdown timer, globe, activity feed, FAQ accordion). Components use `BlurFade` wrapper for staggered scroll-triggered animations.

`app/(app)/` -- Authenticated app shell with `AppTopbar` + `AppSidebar` layout (see `components/app-topbar.tsx`, `components/app-sidebar.tsx`). Contains dashboard, projects, profiles, teams, and forum pages. The dashboard (`app/(app)/dashboard/page.tsx`) is a server component that queries hackathon data and registration status, with client components in `components/dashboard/` (countdown timer, activity feed).

`app/(onboarding)/` -- Minimal-chrome layout (logo + centered content, no sidebar) for guided flows. Currently contains the hackathon registration flow at `/hackathon`.

`app/admin/` -- Admin-only area (Clerk auth + `isAdmin` guard in both middleware and layout). Contains the growth dashboard at `/admin/dashboard` with stat cards, signups-over-time chart (Recharts), and live activity feed. Polling API at `app/api/admin/stats/route.ts` refreshes data every 30s. DB queries in `lib/admin/queries.ts`.

### Hackathon Onboarding Flow

Multi-step registration at `/hackathon` (`app/(onboarding)/hackathon/`). Eight isolated steps identified by string `StepId`: `identity`, `experience`, `team_preference`, `bridge`, `project_basics`, `starting_point`, `project_goal`, `celebration`. Steps map to three high-level stepper phases (Register, Build, Done).

- Server page checks auth, ensures profile, detects existing registration
- Orchestrator (`hackathon-onboarding.tsx`) owns all state (`OnboardingState`), navigation, and server action calls -- individual step components are pure presentation receiving props/callbacks
- Each step is a separate component in `components/onboarding/steps/` (e.g., `identity-step.tsx`, `experience-step.tsx`, `project-basics-step.tsx`). Old monolithic `registration-step.tsx` and `project-step.tsx` were removed.
- `WizardCard` wraps most steps with a consistent card layout (label, title, description, primary/secondary buttons)
- 6 server actions in `actions.ts`: `checkUsernameAvailability`, `completeRegistration`, `createOnboardingProject`, `searchUsers`, `searchProjects`, `checkProjectSlugAvailability`
- Reusable onboarding components in `components/onboarding/` (predictive search, section radio group with optional icon support, live preview badge, step transitions)
- **Dev mode**: `?dev=true` query param (dev only) enables a floating toolbar that jumps to any step and fills mock data, skipping DB writes for frontend iteration

### Discord Notifications

Fire-and-forget Discord webhook pings on key events. All calls are non-blocking (errors caught and reported to Sentry, never break the user flow).

- `lib/discord.ts` -- `sendDiscordWebhook(url, payload)`, plus `notifySignup` and `notifyProject` helpers
- `lib/milestones.ts` -- `checkSignupMilestone` / `checkProjectMilestone` fire a ping to a separate milestones webhook when totals hit thresholds (10, 25, 50, 75, 100, 150, 200, 250, 500, 1000)
- Called from `completeRegistration` and `createOnboardingProject` in `app/(onboarding)/hackathon/actions.ts`, and from `registerForEvent` / `createProject` in `app/event/[slug]/actions.ts`

### Error Handling

Sentry is configured for server (`sentry.server.config.ts`), edge (`sentry.edge.config.ts`), and client (`instrumentation-client.ts`) runtimes. Server actions catch errors and report via `Sentry.captureException` with `tags: { component: "server-action", action }` and relevant `extra` context before returning `{ success: false, error }`.

For database constraint violations, use the pattern in `app/(onboarding)/hackathon/actions.ts`: import `NeonDbError` from `@neondatabase/serverless`, create an `isUniqueViolation(error, constraintName)` helper that checks `error.code === "23505"` and constraint name (handling Drizzle's `.cause` wrapping), and call it instead of string-matching on error messages.

### Testing

Integration tests in `__tests__/integration/` run against the real Neon database via Vitest. Tests mock Clerk auth (`vi.mock("@clerk/nextjs/server")`), `next/cache`, and Sentry, then exercise server actions and DB helpers directly. Each test file manages its own cleanup in `afterAll`. Config in `vitest.config.ts`.

### CI

GitHub Actions workflow in `.github/workflows/test.yml` runs on every push and PR to `main`. Steps: install deps (`npm ci`), lint (`npm run lint`), test (`npm test`). Tests hit the real Neon DB via `DATABASE_URL` stored in GitHub repo secrets.

## Environment Variables

Required in `.env.local`:
- `DATABASE_URL` -- Neon Postgres connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` -- Clerk auth keys
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` (`/sign-in`) / `NEXT_PUBLIC_CLERK_SIGN_UP_URL` (`/sign-up`)
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` (`/dashboard`) / `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` (`/hackathon`)
- `ADMIN_USER_IDS` -- comma-separated Clerk user IDs granted admin access
- `DISCORD_WEBHOOK_SIGNUPS` -- Discord webhook URL for signup/project notification pings (optional, no-ops if unset)
- `DISCORD_WEBHOOK_MILESTONES` -- Discord webhook URL for milestone alerts (optional, no-ops if unset)

## Path Aliases

- `@/` maps to project root (components, lib, etc.)
