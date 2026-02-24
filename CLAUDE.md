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
- **Animation**: Motion (Framer Motion), custom BlurFade component with scroll-triggered `inView` mode
- **Map**: Mapbox GL (`mapbox-gl`) for the Globe component
- **Shaders**: `@paper-design/shaders-react` for ShaderBackground
- **Auth**: Clerk (`@clerk/nextjs`) -- custom sign-in/sign-up forms (not Clerk pre-built components)
- **Database**: Neon Postgres via `@neondatabase/serverless` (HTTP adapter), Drizzle ORM
- **UI primitives**: Radix UI via `radix-ui` package
- **AI enrichment:** Anthropic API (future — build log processing)

## Commands

```
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
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
- `profiles` -- clerk_id (unique), display_name, bio, social links, experience_level enum
- `events` -- name, slug (unique), description, dates, status enum (draft/open/active/judging/complete)
- `eventRegistrations` -- links profile to event with team_preference enum, unique on (event_id, profile_id)
- `users` -- legacy table (id, name, email)

Enums: `experience_level`, `event_status`, `team_preference`

Type exports follow the pattern: `TableName` (select type) and `NewTableName` (insert type).

Config reads `DATABASE_URL` from `.env.local` (via dotenv in `drizzle.config.ts`; Next.js auto-loads it at runtime).

### Page Structure

`app/page.tsx` is a single server component composing all landing page sections. Client-side interactivity is isolated to individual components (countdown timer, globe, activity feed, FAQ accordion). Components use `BlurFade` wrapper for staggered scroll-triggered animations.

## Environment Variables

Required in `.env.local`:
- `DATABASE_URL` -- Neon Postgres connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` -- Clerk auth keys
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` (`/sign-in`) / `NEXT_PUBLIC_CLERK_SIGN_UP_URL` (`/sign-up`)
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` (`/`) / `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` (`/`)

## Path Aliases

- `@/` maps to project root (components, lib, etc.)
