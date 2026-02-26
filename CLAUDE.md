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
- **Pre-commit**: Husky + lint-staged -- runs ESLint on staged `.ts/.tsx/.js/.jsx` files before each commit (`.husky/pre-commit`). Config in `eslint.config.mjs` enforces: `no-console` (warn, allows `warn`/`error`), `prefer-const` (flag unreassigned `let`), `eqeqeq` with `== null` exception, `@next/next/no-img-element` off (local SVGs only)
- **CI**: GitHub Actions -- three workflows: `lint.yml` (PR), `test.yml` (PR), `deploy.yml` (push to main)
- **AI enrichment:** Anthropic API (future — build log processing)

## Development Workflow

**Never push directly to `main`.** The `main` branch is protected and requires a pull request.

### Environment Setup

| Scope | Database | Auth |
|---|---|---|
| Local (`.env.local`) | Neon `dev` branch | Clerk test keys (`pk_test_`, `sk_test_`) |
| Vercel Preview | Neon `dev` branch | Clerk test keys |
| Vercel Production | Neon `main` branch | Clerk live keys (`pk_live_`, `sk_live_`) |

### Flow

1. Create a feature branch (`git checkout -b feat/thing`)
2. Work locally against the dev environment
3. Run `npm run db:generate` if schema changed, then `npm run db:migrate` against dev
4. Push the feature branch and open a PR into `main`
5. CI runs lint and tests on the PR; Vercel creates a preview deployment
6. Verify in the preview environment
7. Merge the PR — `deploy.yml` runs lint + tests, migrates production Neon DB, then triggers a Vercel deploy hook (Vercel auto-deploy on `main` is disabled via `vercel.json`, so the build only starts after migrations complete)

### Rules

- All schema changes go through migration files (`db:generate` → `db:migrate`), never `db:push` in production
- Test migrations against the dev branch before merging
- Production migrations are automated via CI on merge to `main`
- Pre-commit hook runs ESLint on staged files via husky + lint-staged; fix lint errors before committing (run `npm run lint` to check, or `npx lint-staged` to lint only staged files)

## Commands

```
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run integration tests (Vitest, hits real DB)
npm run test:watch   # Run tests in watch mode
npm run db:generate  # Generate migrations from schema changes
npm run db:migrate   # Run pending migrations against current DATABASE_URL
npm run db:push      # Push schema changes directly to database (dev/prototyping only)
npm run db:studio    # Open Drizzle Studio (DB browser)
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
- `profiles` -- clerk_id (unique), username (unique, nullable), display_name, bio, social links, country (uppercase ISO 3166-1 alpha-2 code), region (ISO 3166-2 subdivision code, nullable), experience_level enum
- `events` -- name, slug (unique), description, dates, status enum (draft/open/active/judging/complete)
- `eventRegistrations` -- links profile to event with team_preference enum, unique on (event_id, profile_id)
- `projects` -- profile_id (FK), name, slug (unique, nullable), description, starting_point enum, goal_text, github_url, live_url
- `eventProjects` -- junction linking projects to events, unique on (event_id, project_id)
- `users` -- legacy table (id, name, email)

Enums: `experience_level`, `event_status`, `team_preference`, `starting_point`

Type exports follow the pattern: `TableName` (select type) and `NewTableName` (insert type).

Config reads `DATABASE_URL` from `.env.local` (via dotenv in `drizzle.config.ts`; Next.js auto-loads it at runtime). Neon uses branch-based isolation: `dev` branch for local/preview, `main` branch for production.

### Constants & Queries

`lib/constants.ts` centralizes shared values: `HACKATHON_SLUG`, `DISCORD_INVITE_URL`, and placeholder URLs (`VOLUNTEER_URL`, `SPONSOR_URL`, `SPONSOR_CREDITS_URL`, `DOCS_URL`). Import from here instead of hardcoding slugs or URLs.

`lib/countries.ts` and `lib/regions.ts` are static ISO 3166 lookup tables (countries with alpha-2 codes and flag emoji; regions/subdivisions keyed by country code). Used by the onboarding comboboxes and profile display pages. Profile display resolves stored ISO codes to human-readable names via `getCountryName()` / `getRegionName()` helpers.

Two query modules:
- `lib/admin/queries.ts` -- admin dashboard queries (growth stats, activity feed)
- `lib/queries.ts` -- public-facing queries scoped to the hackathon event: `getHackathonProjects`, `getProjectBySlug`, `getHackathonProfiles`, `getProfileByUsername`, `getPublicStats`. Detail queries enforce visibility rules (projects must be linked to an event, profiles must be registered for the hackathon).

### Page Structure

`app/page.tsx` is an async server component composing all landing page sections. It fetches real DB stats via `getPublicStats` and uses constants for external links. Client-side interactivity is isolated to individual components (countdown timer, globe, activity feed, FAQ accordion). Components use `BlurFade` wrapper for staggered scroll-triggered animations.

`app/(app)/` -- Authenticated app shell with `AppTopbar` + `AppSidebar` layout (see `components/app-topbar.tsx`, `components/app-sidebar.tsx`). Sidebar nav: Dashboard, Hackathon, Projects, Profiles. The dashboard (`app/(app)/dashboard/page.tsx`) is a server component that queries hackathon data, registration status, and real stats via `getPublicStats`, with client components in `components/dashboard/` (countdown timer, activity feed). Dynamic detail routes: `app/(app)/projects/[slug]/page.tsx` and `app/(app)/profiles/[username]/page.tsx`.

`app/(onboarding)/` -- Minimal-chrome layout (logo + centered content, no sidebar) for guided flows. Currently contains the hackathon registration flow at `/hackathon`.

`app/admin/` -- Admin-only area (Clerk auth + `isAdmin` guard in both middleware and layout). Contains the growth dashboard at `/admin/dashboard` with stat cards, signups-over-time chart (Recharts), and live activity feed. Polling API at `app/api/admin/stats/route.ts` refreshes data every 30s. DB queries in `lib/admin/queries.ts`.

### Hackathon Onboarding Flow

Multi-step registration at `/hackathon` (`app/(onboarding)/hackathon/`). Eight isolated steps identified by string `StepId`: `identity`, `experience`, `team_preference`, `bridge`, `project_basics`, `starting_point`, `project_goal`, `celebration`. Steps map to three high-level stepper phases (Register, Build, Done).

- Server page checks auth, ensures profile, detects existing registration
- Orchestrator (`hackathon-onboarding.tsx`) owns all state (`OnboardingState`), navigation, and server action calls -- individual step components are pure presentation receiving props/callbacks
- Each step is a separate component in `components/onboarding/steps/` (e.g., `identity-step.tsx`, `experience-step.tsx`, `project-basics-step.tsx`). Old monolithic `registration-step.tsx` and `project-step.tsx` were removed.
- `WizardCard` wraps most steps with a consistent card layout (label, title, description, primary/secondary buttons)
- 6 server actions in `actions.ts`: `checkUsernameAvailability`, `completeRegistration`, `createOnboardingProject`, `searchUsers`, `searchProjects`, `checkProjectSlugAvailability`
- Reusable onboarding components in `components/onboarding/` (predictive search, section radio group with optional icon support, live preview badge, step transitions, country/region comboboxes with virtualized lists via `@tanstack/react-virtual`)
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

Integration tests in `__tests__/integration/` run against the real Neon database via Vitest. Tests mock Clerk auth (`vi.mock("@clerk/nextjs/server")`), `next/cache`, Sentry, Discord webhooks (`@/lib/discord`), and milestone checkers (`@/lib/milestones`) to prevent side effects and external calls during test runs. This allows tests to exercise server actions and DB helpers directly against a real test DB without triggering notifications. Each test file manages its own cleanup in `afterAll`. Config in `vitest.config.ts`.

### CI

Five GitHub Actions workflows in `.github/workflows/`:

- **`lint.yml`** -- runs on PRs to `main`. Lints only (fast feedback).
- **`test.yml`** -- runs on PRs to `main`. Runs `db:migrate` against the dev/test Neon DB, then `npm test`. The migration step ensures the test database schema stays in sync with pending migrations before tests run. Tests hit the real Neon DB via `DATABASE_URL` stored in GitHub repo secrets.
- **`deploy.yml`** -- runs on push to `main` (i.e., after PR merge). Runs lint + test in parallel, then a `deploy` job (gated on both passing) that migrates the **production** Neon DB (`PRODUCTION_DATABASE_URL`) and triggers a Vercel deploy hook (`VERCEL_DEPLOY_HOOK`). `vercel.json` disables Vercel's automatic git-triggered deploy on `main` so the build only starts after production migrations complete. Preview deployments on PR branches are unaffected.
- **`claude.yml`** -- Claude Code PR assistant. Triggers when `@claude` is mentioned in issue/PR comments, review comments, or issue bodies. Uses `anthropics/claude-code-action@v1`.
- **`claude-code-review.yml`** -- automated Claude Code review on every PR (opened, synchronized, reopened). Runs the `code-review` plugin via `anthropics/claude-code-action@v1`.

## Environment Variables

Required in `.env.local` (local dev uses Neon `dev` branch + Clerk test keys):
- `DATABASE_URL` -- Neon Postgres connection string (dev branch locally, main branch in production)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` -- Clerk auth keys (`pk_test_`/`sk_test_` locally, `pk_live_`/`sk_live_` in production)
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` (`/sign-in`) / `NEXT_PUBLIC_CLERK_SIGN_UP_URL` (`/sign-up`)
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` (`/dashboard`) / `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` (`/hackathon`)
- `ADMIN_USER_IDS` -- comma-separated Clerk user IDs granted admin access
- `DISCORD_WEBHOOK_SIGNUPS` -- Discord webhook URL for signup/project notification pings (optional, no-ops if unset)
- `DISCORD_WEBHOOK_MILESTONES` -- Discord webhook URL for milestone alerts (optional, no-ops if unset)

CI-only secrets (GitHub Actions, not in `.env.local`):
- `PRODUCTION_DATABASE_URL` -- Neon production connection string (used by `deploy.yml` to migrate prod DB on merge to main)
- `VERCEL_DEPLOY_HOOK` -- Vercel deploy hook URL (used by `deploy.yml` to trigger production build after migrations)

## Path Aliases

- `@/` maps to project root (components, lib, etc.)
