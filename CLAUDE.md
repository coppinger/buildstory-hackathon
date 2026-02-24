# Buildstory Hackathon

Landing page for the Buildstory hackathon -- a global, remote, one-week hackathon for builders. Single-page marketing site with sections: Hero, Why, What, When, Where, Who, FAQ, CTA, Footer.

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19, TypeScript)
- **Styling**: Tailwind CSS v4, shadcn/ui (new-york style), tw-animate-css
- **Fonts**: DM Sans (body), Instrument Serif (headings), DM Mono (mono)
- **Animation**: Motion (Framer Motion), custom BlurFade component with scroll-triggered `inView` mode
- **Map**: Mapbox GL (`mapbox-gl`) for the Globe component
- **Shaders**: `@paper-design/shaders-react` for ShaderBackground
- **Auth**: Clerk (`@clerk/nextjs`) -- ClerkProvider wraps root layout, `proxy.ts` middleware
- **Database**: Neon Postgres via `@neondatabase/serverless`, Drizzle ORM
- **UI primitives**: Radix UI via `radix-ui` package

## Commands

```
npm run dev      # Start dev server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
npx drizzle-kit generate   # Generate migrations from schema
npx drizzle-kit migrate    # Apply migrations to database
npx drizzle-kit studio     # Open Drizzle Studio (DB browser)
```

## Project Structure

```
proxy.ts              # Clerk middleware (Next.js 16 proxy convention)
app/
  layout.tsx          # Root layout (ClerkProvider, dark mode, font variables)
  page.tsx            # Single landing page with all sections
  globals.css
  (auth)/             # Route group for auth pages (two-column layout)
    layout.tsx        # Two-column auth layout (logo + content left, dark panel right)
    sign-in/page.tsx       # Custom sign-in form (useSignIn hook)
    sign-in/sso-callback/page.tsx  # OAuth redirect callback
    sign-up/page.tsx       # Custom sign-up form (useSignUp hook, email verification)
    sign-up/sso-callback/page.tsx  # OAuth redirect callback
components/
  header.tsx          # Site header/nav (SignedOut/SignedIn/UserButton from Clerk)
  countdown-timer.tsx # Countdown to hackathon start
  globe.tsx           # Mapbox GL globe visualization
  activity-feed.tsx   # Mock activity feed (uses data/mock-activity.json)
  faq.tsx             # FAQ accordion
  blur-fade.tsx       # BlurFade animation wrapper (delay, inView props)
  shader-background.tsx
  icons.tsx           # OAuth brand icons (Google, GitHub)
  ui/                 # shadcn/ui primitives (button, badge, input, label, card, separator)
data/
  mock-activity.json  # Static mock data for activity feed
lib/
  utils.ts            # cn() classname merge utility
  db/
    index.ts          # Drizzle client (Neon HTTP adapter), exports `db`
    schema.ts         # Drizzle schema definitions, currently: users table
drizzle/              # Migration files (managed by drizzle-kit)
drizzle.config.ts     # Drizzle Kit config (reads DATABASE_URL from .env.local)
```

## Database

Neon Postgres with Drizzle ORM. Client created in `lib/db/index.ts` using the Neon HTTP (serverless) adapter.

**Schema** (`lib/db/schema.ts`):
- `users` -- id (serial PK), name (text), email (text, unique), created_at (timestamp)

Type exports: `User` (select), `NewUser` (insert).

Config reads `DATABASE_URL` from `.env.local` (via dotenv in `drizzle.config.ts`; Next.js auto-loads it at runtime).

## Environment Variables

- `DATABASE_URL` -- Neon Postgres connection string (in `.env.local`)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` -- Clerk publishable key
- `CLERK_SECRET_KEY` -- Clerk secret key
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` -- Sign-in page URL (set to `/sign-in`)
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` -- Sign-up page URL (set to `/sign-up`)
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` -- Post-login redirect (set to `/`)
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` -- Post-signup redirect (set to `/`)

## Path Aliases

- `@/` maps to project root (components, lib, etc.)
