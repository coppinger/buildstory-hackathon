# Buildstory

A community platform for AI builders. The core thesis: **"what have you built?"** is the ultimate signal of credibility in a landscape full of noise.

Buildstory combines profiles, project showcases, automated build logs, and a reputation system where verified building experience earns authority. Projects are tagged with the tools used to build them, and those tags double as permanent discussion threads — so conversations about a tool are anchored to real usage, not speculation.

## Tech Stack

- **Framework:** Next.js 16 (App Router, React 19, TypeScript)
- **Styling:** Tailwind CSS v4, shadcn/ui
- **Auth:** Clerk (custom sign-in/sign-up forms)
- **Database:** Neon Postgres (serverless), Drizzle ORM
- **CMS:** Sanity (embedded studio)
- **Monitoring:** Sentry
- **Testing:** Vitest
- **CI/CD:** GitHub Actions, deployed on Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- A [Neon](https://neon.tech) database (dev branch)
- [Clerk](https://clerk.com) test API keys

### Environment Variables

Copy `.env.example` or create `.env.local` with:

```
DATABASE_URL=              # Neon Postgres connection string (dev branch)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=  # Clerk publishable key (pk_test_)
CLERK_SECRET_KEY=                    # Clerk secret key (sk_test_)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/hackathon
ADMIN_USER_IDS=            # Comma-separated Clerk user IDs for super-admin access
```

Optional:

```
DISCORD_WEBHOOK_SIGNUPS=   # Discord webhook for signup/project notifications
DISCORD_WEBHOOK_MILESTONES= # Discord webhook for milestone alerts
```

### Installation

```bash
npm install
```

### Database Setup

Run pending migrations against your dev database:

```bash
npm run db:migrate
```

Optionally seed with sample data:

```bash
npm run db:seed
```

### Development Server

```bash
npm run dev
```

If [Portless](https://github.com/nickcernis/portless) is installed globally, the app is served at `http://bs.localhost:1355`. Otherwise, it falls back to the default Next.js port. You can bypass Portless with `PORTLESS=0 npm run dev`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run all tests (unit + integration) |
| `npm run test:unit` | Unit tests only (no DB required) |
| `npm run test:integration` | Integration tests (requires `DATABASE_URL`) |
| `npm run test:watch` | Tests in watch mode |
| `npm run db:generate` | Generate migrations from schema changes |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:push` | Push schema directly (dev/prototyping only) |
| `npm run db:studio` | Open Drizzle Studio (DB browser) |
| `npm run db:seed` | Seed dev DB with sample data |

## Project Structure

```
app/
├── (auth)/            # Sign-in / sign-up pages (custom Clerk UI)
├── (app)/             # Authenticated app shell (sidebar + topbar)
│   ├── dashboard/     # User dashboard
│   ├── projects/      # Project CRUD and detail pages
│   ├── profiles/      # Public profile pages
│   ├── settings/      # User settings
│   └── invite/        # Team invite acceptance
├── (onboarding)/      # Hackathon registration flow
├── admin/             # Admin area (roles, users, mentors, audit log)
├── mentor-apply/      # Public mentor application form
├── studio/            # Embedded Sanity Studio (admin-only)
└── banned/            # Banned user landing page

components/            # Shared UI components
lib/
├── db/                # Drizzle schema, client, migrations
├── sanity/            # Sanity config, schemas, queries
├── admin/             # Admin queries and session helpers
├── queries.ts         # Public-facing data queries
├── constants.ts       # Shared constants (slugs, URLs)
├── countries.ts       # ISO 3166 country lookup
├── regions.ts         # ISO 3166 region/subdivision lookup
└── discord.ts         # Discord webhook helpers
```

## Development Workflow

1. Create a feature branch off `main`
2. Work locally against the Neon `dev` branch and Clerk test keys
3. Run `npm run db:generate` if schema changed, then `npm run db:migrate`
4. Push and open a PR into `main`
5. CI runs lint and tests; Vercel creates a preview deployment
6. Merge — CI migrates the production DB, then triggers the Vercel production deploy

**Never push directly to `main`.** The branch is protected and requires a pull request.

## License

Private — all rights reserved.
