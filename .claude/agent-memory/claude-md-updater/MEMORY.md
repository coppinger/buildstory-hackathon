# CLAUDE.md Updater - Agent Memory

## Project: Buildstory (buildstory-hackathon)

### CLAUDE.md Structure
- Sections: Intro, Current Focus, Principles, Tech Stack, Development Workflow (env table, flow steps, rules), Commands, Architecture (Auth Flow, Profile Creation, Database, Constants & Queries, Page Structure, Hackathon Onboarding Flow, Discord Notifications, Error Handling, Testing, CI), Environment Variables, Path Aliases
- Style: Terse, high-signal bullet points. File paths are exact. Patterns described once, not per-file.
- Uses `--` as separator between item name and description (not colons or dashes).
- Bold for emphasis on key terms/file names in running text. Backticks for file paths, commands, env vars, code identifiers.
- Testing section describes the *pattern* (what gets mocked, how cleanup works) rather than listing individual test files.
- Error Handling section documents both Sentry patterns and DB constraint handling patterns.
- Environment Variables separates local dev vars from CI-only secrets (added 2026-02-26).

### Update Patterns Observed
- New architectural sections (Discord Notifications, Admin dashboard) get their own subsections under Architecture.
- New error handling patterns (isUniqueViolation) get documented as reusable guidance.
- Individual test files do NOT get listed -- the testing pattern description covers them.
- Minor additions to existing patterns (e.g., a new mock in tests) don't warrant updates if they follow the established pattern.
- Visual/styling changes (logo swaps, CSS) never warrant CLAUDE.md updates.
- CI workflow changes: update Tech Stack bullet (workflow file references), Development Workflow > Flow steps (deploy behavior), and CI subsection. Also check Environment Variables for new secrets.
- When a single workflow splits into multiple, all three sections (Tech Stack, Flow, CI) need updates.
- New config files (e.g., vercel.json) that change deploy behavior are worth mentioning in the CI section.
- CI-only secrets (not in .env.local) warranted a separate sub-group in Environment Variables.
- Schema changes (new tables, columns, enums): always update Database section.
- Function signature changes (sync->async): document when it affects callers (e.g., isAdmin becoming async affects middleware and layout code).
- Access control changes: update both Auth Flow and Page Structure sections.
- Public query filtering changes: update Queries section since it affects data contracts.

### Key Decisions Log
- 2026-02-27 (late): Clerk API rate limit error handling in admin actions. NO UPDATE needed — error handling via Sentry already documented in Error Handling section (line 176-180). Non-blocking external API pattern matches Discord notifications pattern. DB as source of truth is implicit in existing architecture. This was purely defensive/resilience improvement within existing admin feature.
- 2026-02-27: Admin panel expansion (roles, ban/hide, audit log). Updated 5 areas of CLAUDE.md:
  1. Auth Flow: rewrote admin access to document DB-based role system, async helpers, isSuperAdmin sync fallback, getAdminSession
  2. Database Schema: added role/ban/hide columns to profiles, adminAuditLog table, user_role enum
  3. Queries: noted all 5 public queries filter banned/hidden profiles via isProfileVisible
  4. Page Structure: expanded admin section with sub-pages, access tiers (moderator+ vs admin-only), shared components, /banned page
  5. Environment Variables: updated ADMIN_USER_IDS to clarify it's now super-admin fallback
- 2026-02-27 (earlier): Hardcoded Sanity config. Removed deprecated env vars from Environment Variables section.
- 2026-02-26 (evening): Discord and milestones mocking in event-actions tests. Updated Testing section.
- 2026-02-26: ESLint rule additions. Updated Tech Stack's Pre-commit bullet.
- 2026-02-26: CI workflow split. Updated Tech Stack, Flow steps, CI subsection, Environment Variables.
- 2026-02-25: No update needed for 38 integration tests (testing pattern already documented).
- 2026-02-25: Added isUniqueViolation pattern to Error Handling section.

### Test Files (for reference)
- `__tests__/integration/ensure-profile.test.ts` -- tests ensureProfile DB helper
- `__tests__/integration/event-actions.test.ts` -- tests event server actions
- `__tests__/integration/onboarding-actions.test.ts` -- tests all 6 onboarding server actions
- `__tests__/integration/proxy.test.ts` -- tests proxy/middleware behavior (updated for role-based access)

### Admin Architecture Notes
- Admin access is role-based (DB `profiles.role`) with env-var super-admin fallback (`ADMIN_USER_IDS`)
- `isAdmin`/`isModerator`/`canAccessAdmin` are async (DB lookups); only `isSuperAdmin` is sync
- Two access tiers in admin panel: moderator+ (users list) and admin-only (roles, audit)
- `getAdminSession()` is the standard cached helper for server components
- Banned users redirected to `/banned` by proxy.ts middleware
