# CLAUDE.md Updater - Agent Memory

## Project: Buildstory (buildstory-hackathon)

### CLAUDE.md Structure
- Sections: Intro, Current Focus, Principles, Tech Stack, Commands, Architecture (Auth Flow, Profile Creation, Database, Page Structure, Hackathon Onboarding Flow, Discord Notifications, Error Handling, Testing, CI), Environment Variables, Path Aliases
- Style: Terse, high-signal bullet points. File paths are exact. Patterns described once, not per-file.
- Testing section describes the *pattern* (what gets mocked, how cleanup works) rather than listing individual test files.
- Error Handling section documents both Sentry patterns and DB constraint handling patterns.

### Update Patterns Observed
- New architectural sections (Discord Notifications, Admin dashboard) get their own subsections under Architecture.
- New error handling patterns (isUniqueViolation) get documented as reusable guidance.
- Individual test files do NOT get listed -- the testing pattern description covers them.
- Minor additions to existing patterns (e.g., a new mock in tests) don't warrant updates if they follow the established pattern.
- Visual/styling changes (logo swaps, CSS) never warrant CLAUDE.md updates.

### Key Decisions Log
- 2026-02-25: No update needed for commit `9ef9042` (38 integration tests for onboarding actions). Testing section already describes the exact pattern. Error Handling already documents `isUniqueViolation` from commit `84143bc`. Both reflected in uncommitted CLAUDE.md changes from a prior session.
- 2026-02-25: Added `isUniqueViolation` pattern to Error Handling section (commit `84143bc`). Important because it prevents future devs from using fragile string-matching on error messages.
- Earlier: Auth pages, admin dashboard, Discord notifications, onboarding refactor all warranted CLAUDE.md section additions.

### Test Files (for reference)
- `__tests__/integration/ensure-profile.test.ts` -- tests ensureProfile DB helper
- `__tests__/integration/event-actions.test.ts` -- tests event server actions
- `__tests__/integration/onboarding-actions.test.ts` -- tests all 6 onboarding server actions (38 tests)
