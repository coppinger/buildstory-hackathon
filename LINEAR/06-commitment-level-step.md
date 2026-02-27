# Ticket 06: Commitment Level Onboarding Step

**Priority:** High | **Estimate:** Medium | **Labels:** onboarding, schema

## Summary

Add a new onboarding step that gently asks participants what level of commitment they're planning — "All-in", "Every day", "Nights & weekends", or "Not sure yet". This is a soft signal (not a contract) that helps us understand capacity and matches the language already used on the landing page's "When" section.

## Context

- The landing page "When" section (lines 224-326 of `app/page.tsx`) already shows four commitment cards: All-in, Daily, Nights & Weekends, Unsure — with intensity bars and descriptions
- No commitment-level data is captured during onboarding or stored in the database
- The new step slots naturally between `experience` and `team_preference` in the Register phase — it follows "what's your experience level?" with "how much time are you planning to put in?"
- The step should feel low-pressure: "This is just to help us understand — you can always change it later"
- The `eventRegistrations` table needs a new nullable column; the `completeRegistration` action needs to accept and write it

## Owned Files (write access)

- `lib/db/schema.ts` — add enum + column
- `app/(onboarding)/hackathon/actions.ts` — update `completeRegistration` to accept `commitmentLevel`
- `app/(onboarding)/hackathon/hackathon-onboarding.tsx` — add step to flow
- `components/onboarding/steps/commitment-level-step.tsx` — NEW step component

## File Conflict: Shared Ownership with Ticket 01

This ticket and Ticket 01 both modify `hackathon-onboarding.tsx`. **Sequence this ticket BEFORE Ticket 01**, or merge the orchestrator changes. The changes are in different areas (this ticket adds a step; Ticket 01 polishes existing steps) but touch the same arrays and switch statements.

If running after Ticket 01, the sub-step dot counts from Ticket 01 will need updating: the Register phase goes from 3 sub-steps to 4.

## Tasks

### 1. Schema Migration

**File:** `lib/db/schema.ts`

Add the enum and column:

```ts
export const commitmentLevelEnum = pgEnum("commitment_level", [
  "all_in",
  "daily",
  "nights_weekends",
  "not_sure",
]);
```

Add nullable column to `eventRegistrations`:

```ts
export const eventRegistrations = pgTable(
  "event_registrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id").notNull().references(() => events.id),
    profileId: uuid("profile_id").notNull().references(() => profiles.id),
    teamPreference: teamPreferenceEnum("team_preference").notNull(),
    commitmentLevel: commitmentLevelEnum("commitment_level"),  // NEW, nullable
    registeredAt: timestamp("registered_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.eventId, t.profileId)]
);
```

Nullable so existing registrations aren't broken and backfill isn't needed.

After editing, run:
```bash
npm run db:generate   # generates migration file
npm run db:migrate    # applies to dev DB
```

### 2. Update `completeRegistration` Action

**File:** `app/(onboarding)/hackathon/actions.ts`

Add `commitmentLevel` to the action's parameter type and pass it through to the `eventRegistrations` insert:

```ts
// In the parameter type:
commitmentLevel: "all_in" | "daily" | "nights_weekends" | "not_sure" | null;

// In the db.insert call:
await db.insert(eventRegistrations).values({
  eventId: eventId,
  profileId: profile.id,
  teamPreference: data.teamPreference,
  commitmentLevel: data.commitmentLevel,  // NEW
}).onConflictDoNothing();
```

### 3. New Step Component (`components/onboarding/steps/commitment-level-step.tsx`)

Follow the exact pattern of `experience-step.tsx` — a simple wrapper around `SectionRadioGroup`.

```tsx
"use client";

import { SectionRadioGroup } from "@/components/onboarding/section-radio-group";
import { Icon } from "@/components/ui/icon";

const commitmentOptions = [
  {
    value: "all_in",
    label: "All-in",
    description: "Full days, full week. Clearing the decks.",
    icon: <Icon name="local_fire_department" size="5" className="text-neutral-400" />,
  },
  {
    value: "daily",
    label: "Every day",
    description: "A few focused hours each day.",
    icon: <Icon name="routine" size="5" className="text-neutral-400" />,
  },
  {
    value: "nights_weekends",
    label: "Nights & weekends",
    description: "Building around a day job.",
    icon: <Icon name="dark_mode" size="5" className="text-neutral-400" />,
  },
  {
    value: "not_sure",
    label: "Not sure yet",
    description: "You'll figure it out as you go. That's fine, too.",
    icon: <Icon name="help" size="5" className="text-neutral-400" />,
  },
];

interface CommitmentLevelStepProps {
  value: string | null;
  onChange: (value: string) => void;
}

export function CommitmentLevelStep({ value, onChange }: CommitmentLevelStepProps) {
  return (
    <SectionRadioGroup
      options={commitmentOptions}
      value={value}
      onChange={onChange}
    />
  );
}
```

The labels and descriptions are lifted directly from the landing page's "When" section commitment cards to keep messaging consistent.

### 4. Orchestrator Changes (`hackathon-onboarding.tsx`)

**6 touch points:**

**a) `StepId` union — add `"commitment_level"`:**
```ts
type StepId =
  | "identity"
  | "experience"
  | "commitment_level"   // NEW
  | "team_preference"
  | "bridge"
  | ...
```

**b) `OnboardingState` — add field:**
```ts
type OnboardingState = {
  // Registration
  displayName: string;
  username: string;
  countryCode: string;
  region: string;
  experienceLevel: "getting_started" | "built_a_few" | "ships_constantly" | null;
  commitmentLevel: "all_in" | "daily" | "nights_weekends" | "not_sure" | null;  // NEW
  teamPreference: "solo" | "has_team" | "has_team_open" | "looking_for_team" | null;
  ...
};
```

And in `initialState`:
```ts
commitmentLevel: null,
```

**c) `ALL_STEPS` — insert between experience and team_preference:**
```ts
const ALL_STEPS: StepId[] = [
  "identity",
  "experience",
  "commitment_level",    // NEW
  "team_preference",
  "bridge",
  ...
];
```

**d) `getStepperIndex` — map to Register phase (0):**
```ts
case "commitment_level":
  return 0;
```

**e) `navigateNext` / `navigateBack` — update chain:**

Forward: `experience` → `commitment_level` → `team_preference`
Back: `commitment_level` → `experience`, `team_preference` → `commitment_level`

In `navigateNext`:
```ts
case "experience":
  setCurrentStep("commitment_level");  // was "team_preference"
  break;
case "commitment_level":               // NEW
  setCurrentStep("team_preference");
  break;
```

In `navigateBack`:
```ts
case "commitment_level":               // NEW
  setCurrentStep("experience");
  break;
case "team_preference":
  setCurrentStep("commitment_level");  // was "experience"
  break;
```

**f) `isPrimaryDisabled` — add guard:**
```ts
case "commitment_level":
  return !state.commitmentLevel;
```

**g) `handleRegistrationSubmit` — pass to action:**
```ts
const result = await completeRegistration({
  ...existing fields,
  commitmentLevel: state.commitmentLevel,  // NEW
});
```

**h) JSX — render the step:**

Add a new block following the same WizardCard pattern as the experience and team_preference steps:

```tsx
{currentStep === "commitment_level" && (
  <WizardCard
    label="Register"
    title="What's your availability?"
    description="No pressure — this is just a rough sense. You can always adjust."
    primaryLabel="Continue"
    onPrimary={navigateNext}
    primaryDisabled={isPrimaryDisabled}
    secondaryLabel="Back"
    onSecondary={navigateBack}
  >
    <CommitmentLevelStep
      value={state.commitmentLevel}
      onChange={(value) =>
        setState((prev) => ({ ...prev, commitmentLevel: value }))
      }
    />
  </WizardCard>
)}
```

### 5. Update `STEP_LABELS` (if it exists)

The orchestrator has a `STEP_LABELS` map for dev toolbar display. Add:
```ts
commitment_level: "Commitment",
```

## Verification

1. Run `npm run db:generate` — verify a migration file is created with the new enum and column
2. Run `npm run db:migrate` — verify it applies cleanly to the dev DB
3. Walk through the onboarding flow — after experience level, verify the commitment step appears
4. Select each option — verify the Continue button enables and advances to team preference
5. Click Back — verify it returns to experience level
6. Complete registration — verify `commitment_level` is written to `event_registrations` (check via Drizzle Studio: `npm run db:studio`)
7. Verify existing registrations (with null `commitment_level`) still work — no breakage
8. Run `npm run lint` and `npm test`
