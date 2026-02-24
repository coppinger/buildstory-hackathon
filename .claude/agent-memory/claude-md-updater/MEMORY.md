# CLAUDE.md Update Memory - Buildstory Hackathon

## Project Overview
Single-page Next.js 16 marketing site with Clerk auth integration and Neon Postgres backend.

## Key Structure Patterns
- Uses route groups `(auth)` for organizing auth-related pages
- Clerk integration: ClerkProvider in root layout, proxy.ts middleware, appearance config in lib/
- Database: Neon HTTP adapter via Drizzle ORM in `lib/db/`
- Component organization: reusable components in `components/`, shadcn/ui in `components/ui/`

## What Triggers CLAUDE.md Updates
✓ New routes (especially route groups like `(auth)`)
✓ New major files: new pages, new lib utilities, new schema
✓ New environment variables
✓ Changes to existing documented files (e.g., header.tsx getting Clerk components)
✓ Changes to auth flow or middleware

✗ Minor internal refactors without architectural changes
✗ Styling-only updates
✗ Copy/content changes

## Recent Update (Auth Pages)
Added sign-in/sign-up pages with two-column layout:
- `app/(auth)/layout.tsx` - route group layout
- `app/(auth)/sign-in` & `app/(auth)/sign-up` - Clerk pages
- `lib/clerk-appearance.ts` - shared theme config
- Updated `components/header.tsx` to use Clerk components
- Added 4 new environment variables for Clerk URL routing

Updated sections:
1. Project Structure - added (auth) route group and its contents
2. Project Structure - added clerk-appearance.ts to lib/
3. Environment Variables - added NEXT_PUBLIC_CLERK_SIGN_IN_URL, SIGN_UP_URL, AFTER_SIGN_IN_URL, AFTER_SIGN_UP_URL
4. Project Structure header.tsx note - updated to mention Clerk components

Maintained existing style: terse comments, organized by directory, focused on high-level purpose.
