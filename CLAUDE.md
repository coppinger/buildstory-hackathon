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

- `proxy.ts` -- Clerk middleware using Next.js 16's proxy convention (replaces traditional `middleware.ts`)
- `app/(auth)/` -- Route group with a two-column layout (form left, dark panel right)
- `app/(auth)/sign-in/` and `sign-up/` -- Custom forms with SSO callback pages for OAuth redirects

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

### Hackathon Onboarding Flow

Multi-step registration at `/hackathon` (`app/(onboarding)/hackathon/`). Four steps: registration (identity + experience + team preference), bridge (add project / skip / join team), project creation (name, slug, description, starting point, goal), and celebration (confetti, countdown, share).

- Server page checks auth, ensures profile, detects existing registration
- Client component (`hackathon-onboarding.tsx`) manages step state
- 6 server actions in `actions.ts`: `checkUsernameAvailability`, `completeRegistration`, `createOnboardingProject`, `searchUsers`, `searchProjects`, `checkProjectSlugAvailability`
- Reusable onboarding components in `components/onboarding/` (predictive search, section radio group, live preview badge, step transitions)
- **Dev mode**: `?dev=true` query param (dev only) enables a floating toolbar that skips DB writes for frontend iteration

### Error Handling

Sentry is configured for server (`sentry.server.config.ts`), edge (`sentry.edge.config.ts`), and client (`instrumentation-client.ts`) runtimes. Server actions catch errors and report via `Sentry.captureException` with `tags: { component: "server-action", action }` and relevant `extra` context before returning `{ success: false, error }`.

### Testing

Integration tests in `__tests__/integration/` run against the real Neon database via Vitest. Tests mock Clerk auth (`vi.mock("@clerk/nextjs/server")`), `next/cache`, and Sentry, then exercise server actions and DB helpers directly. Each test file manages its own cleanup in `afterAll`. Config in `vitest.config.ts`.

### CI

GitHub Actions workflow in `.github/workflows/test.yml` runs on every push and PR to `main`. Steps: install deps (`npm ci`), lint (`npm run lint`), test (`npm test`). Tests hit the real Neon DB via `DATABASE_URL` stored in GitHub repo secrets.

## Environment Variables

Required in `.env.local`:
- `DATABASE_URL` -- Neon Postgres connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` -- Clerk auth keys
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` (`/sign-in`) / `NEXT_PUBLIC_CLERK_SIGN_UP_URL` (`/sign-up`)
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` (`/`) / `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` (`/`)

## Path Aliases

- `@/` maps to project root (components, lib, etc.)
