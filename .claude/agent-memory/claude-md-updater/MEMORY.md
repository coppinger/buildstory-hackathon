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

### Key Decisions Log
- 2026-02-26 (evening): Discord and milestones mocking in event-actions tests (commit `42ce4a1`). Updated Testing section to explicitly list Discord and milestones in the mocks list. Rationale: onboarding-actions already mocked these, making it a consistent pattern across test files, and documentation needed to reflect this pattern change. The mocks prevent real webhook notifications during test runs.
- 2026-02-26: ESLint rule additions (no-console, prefer-const, eqeqeq, no-img-element off). Updated Tech Stack's Pre-commit bullet to document the 4 key rules with their implications. Unused variable removals across 3 files did NOT warrant CLAUDE.md updates (follow existing patterns, not architecture changes).
- 2026-02-26: CI workflow split (test.yml -> lint.yml + test.yml + deploy.yml). Updated Tech Stack bullet, Flow steps 5+7, entire CI subsection, and added CI-only secrets to Environment Variables. Also documented vercel.json disabling auto-deploy on main.
- 2026-02-25: No update needed for commit `9ef9042` (38 integration tests for onboarding actions). Testing section already describes the exact pattern.
- 2026-02-25: Added `isUniqueViolation` pattern to Error Handling section (commit `84143bc`).
- Earlier: Auth pages, admin dashboard, Discord notifications, onboarding refactor all warranted CLAUDE.md section additions.

### Test Files (for reference)
- `__tests__/integration/ensure-profile.test.ts` -- tests ensureProfile DB helper
- `__tests__/integration/event-actions.test.ts` -- tests event server actions
- `__tests__/integration/onboarding-actions.test.ts` -- tests all 6 onboarding server actions (38 tests)
