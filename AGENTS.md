# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Buildstory is a Next.js 16 app (App Router, React 19, TypeScript) with Neon Postgres, Clerk auth, and Sanity CMS. All external services are SaaS — no Docker or local database required.

### Running services

| Service | Command | Notes |
|---|---|---|
| Dev server | `npm run dev` | Starts on `localhost:3000` with Turbopack |
| Lint | `npm run lint` | ESLint; 0 errors expected (warnings from `@tanstack/react-virtual` are known) |
| Tests | `npm test` | Vitest integration tests hit real Neon DB; mocks Clerk, Sentry, Discord |
| DB Studio | `npm run db:studio` | Drizzle Studio for browsing the database |

See `CLAUDE.md` for the full command reference, architecture, schema, and workflow documentation.

### Environment variables

All secrets are injected as environment variables by the Cloud Agent VM. A `.env.local` file must be generated from these env vars for Next.js and Vitest to pick them up (Next.js auto-loads `.env.local`; Vitest uses dotenv via `vitest.setup.ts`). The update script handles this automatically.

Required secrets: `DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`. The Clerk URL variables (`NEXT_PUBLIC_CLERK_SIGN_IN_URL`, etc.) and `ADMIN_USER_IDS` are also injected. Optional: Sentry, Discord, Sanity, Mapbox tokens (all degrade gracefully if absent).

### Gotchas

- **Sentry deprecation warning**: `excludeServerRoutes` in `next.config.ts` emits a deprecation warning on dev server start. This is cosmetic and does not affect functionality.
- **Sanity image-url warning**: `@sanity/image-url` default export deprecation warning appears during first page compile. Harmless.
- **Tests require real DB**: Integration tests run against the Neon dev database (not mocked). They create and clean up test data in `afterAll`. Do not run tests in parallel with other agents that may be modifying the same dev DB.
- **No `.husky/` directory on this branch**: Pre-commit hooks are documented in `CLAUDE.md` but the `.husky/` directory may not exist on feature branches. Lint manually with `npm run lint` before committing.
- **`.env.local` is gitignored**: The file is listed under `.env*` in `.gitignore`. Never commit it.
