# Ticket 01: Onboarding Flow Polish

**Priority:** High | **Estimate:** Medium | **Labels:** onboarding, UX

## Summary

Polish the 8-step hackathon onboarding flow. Add missing back navigation on the bridge step, add sub-step progress indicators within stepper phases, auto-focus key inputs, and add contextual enhancements (preset goals, conditional repo URL) to reduce friction.

## Context

The onboarding flow at `/hackathon` is functional but has UX gaps:
- The bridge step (step 4) has no back button — users can't return to team preference
- The stepper shows 3 phases (Register / Build / Done) but no indication of sub-step progress within each phase
- Text inputs don't auto-focus, adding an extra click on every step
- The project goal step always shows the repo URL field, even for beginners who may not have one
- No preset goal suggestions to reduce blank-page anxiety

## Owned Files (write access)

- `app/(onboarding)/hackathon/hackathon-onboarding.tsx` — orchestrator
- `components/onboarding/stepper.tsx` — phase stepper
- `components/onboarding/wizard-card.tsx` — step card wrapper
- `components/onboarding/steps/identity-step.tsx`
- `components/onboarding/steps/experience-step.tsx`
- `components/onboarding/steps/team-preference-step.tsx`
- `components/onboarding/steps/bridge-step.tsx`
- `components/onboarding/steps/project-basics-step.tsx`
- `components/onboarding/steps/starting-point-step.tsx`
- `components/onboarding/steps/project-goal-step.tsx`

**Do NOT modify:** `celebration-step.tsx` (owned by Ticket 02), `lib/db/schema.ts` or `app/(onboarding)/hackathon/actions.ts` (owned by Ticket 06)

## Sequencing Note: Ticket 06 Conflict

Ticket 06 (Commitment Level Step) also modifies `hackathon-onboarding.tsx` to add a new step. **Run Ticket 06 before this ticket**, or merge the changes. If Ticket 06 runs first, this ticket's sub-step dot counts for the Register phase change from 3 to 4 (identity, experience, commitment_level, team_preference). The `navigateBack` chain also changes: `team_preference` goes back to `commitment_level` instead of `experience`.

## Coordination Contract (Ticket 01 → Ticket 02)

When `currentStep === "celebration"`, hide the stepper component. Pass `username` in the state prop to the celebration step:

```ts
// In hackathon-onboarding.tsx, the state prop passed to CelebrationStep:
state: {
  displayName, username, experienceLevel, teamPreference,
  projectName, projectGoalText, projectSlug
}
```

Ticket 02 will update `CelebrationStepProps` to accept `username` in its state type.

## Tasks

### 1. Bridge Step Back Button

**Problem:** `bridge-step.tsx` is rendered standalone (not in WizardCard) and has no back button. The `navigateBack()` function in the orchestrator has no case for `"bridge"`.

**Fix — orchestrator** (`hackathon-onboarding.tsx`):

Add the missing case to `navigateBack()`:
```ts
case "bridge":
  setCurrentStep("team_preference");
  break;
```

**Fix — bridge step** (`bridge-step.tsx`):

Add an `onBack` prop and render a back button at the top or bottom of the step:
```ts
interface BridgeStepProps {
  onChoose: (choice: "add_project" | "no_project") => void;
  onJoinTeam: (leadId: string, projectId: string) => void;
  onBack: () => void;  // NEW
}
```

Render a text button (e.g., `"← Back"`) above the option cards or at the bottom of the component. Keep it visually light since this step doesn't use WizardCard — a `variant="ghost"` or `variant="link"` button works well. Match the `max-w-lg` container width.

**Update orchestrator** to pass `onBack={navigateBack}` to BridgeStep.

### 2. Sub-Step Progress Dots

**Problem:** The stepper shows 3 phases but users don't know they're on step 2 of 3 within "Register". Add small dot indicators below each phase label.

**Stepper data model change** (`stepper.tsx`):

Update the `StepConfig` interface and component to accept sub-step info:
```ts
interface StepConfig {
  label: string;
  icon: React.ReactNode;
  totalSubSteps?: number;   // NEW: how many sub-steps in this phase
  currentSubStep?: number;  // NEW: which sub-step is active (0-indexed)
}
```

Render dots below each phase label. Active phase shows filled/amber dots for completed sub-steps and outlined dots for remaining. Completed phases show all dots filled. Future phases show all dots as muted outlines.

**Orchestrator update** (`hackathon-onboarding.tsx`):

Compute sub-step info and pass it to stepper steps. The mapping:

| Phase | Steps in phase | Sub-step indices |
|-------|---------------|-----------------|
| Register (0) | identity, experience, team_preference | 0, 1, 2 |
| Build (1) | bridge, project_basics, starting_point, project_goal | 0, 1, 2, 3 |
| Done (2) | celebration | 0 |

Create a helper like `getSubStepInfo(currentStep)` that returns `{ phaseIndex, totalSubSteps, currentSubStep }`.

### 3. Auto-Focus Key Inputs

Add `autoFocus` to the primary input on steps where users start typing immediately:

- **`identity-step.tsx`**: Add `autoFocus` to the "Display name" `<Input>` element
- **`project-basics-step.tsx`**: Add `autoFocus` to the "Project name" `<Input>` element

These are the two steps where users need to type a name as the first action. Other steps use radio/card selection which doesn't benefit from auto-focus.

### 4. Preset Goals on Project Goal Step

**File:** `project-goal-step.tsx`

Add a row of clickable suggestion chips above the goal textarea. Clicking one populates the field (user can still edit). Suggestions:

```ts
const GOAL_PRESETS = [
  "Ship a working MVP",
  "Launch on Product Hunt",
  "Get 10 beta users",
  "Learn a new AI framework",
  "Build a portfolio piece",
];
```

Render as small `variant="outline"` buttons/badges in a flex-wrap row. On click, call `onUpdate({ projectGoalText: preset })`. If the field already has text matching a preset, show that chip as active/filled.

### 5. Conditional Repo URL for Beginners

**File:** `project-goal-step.tsx`

The step needs access to the user's experience level to conditionally show the repo URL field.

**Option A (preferred — no prop change):** Add `experienceLevel` to the step's props from the orchestrator. If `experienceLevel === "getting_started"`, hide the repo URL field entirely (beginners unlikely to have a repo yet — reduces cognitive load).

**Option B:** Always show the field but collapse it behind an "Add repo URL" link for `getting_started` users.

Either way, the orchestrator must pass `experienceLevel` as a new prop to the project goal step.

### 6. Hide Stepper on Celebration Step

**File:** `hackathon-onboarding.tsx`

When `currentStep === "celebration"`, don't render the `<Stepper>` component. The celebration screen is a full-page layout that doesn't benefit from the phase indicator. Simple conditional:

```tsx
{currentStep !== "celebration" && (
  <Stepper steps={stepperSteps} currentStep={getStepperIndex(currentStep)} />
)}
```

### 7. Pass `username` to Celebration Step

**File:** `hackathon-onboarding.tsx`

Update the state object passed to CelebrationStep to include `username`:

```ts
state={{
  displayName: state.displayName,
  username: state.username,  // NEW
  experienceLevel: state.experienceLevel,
  teamPreference: state.teamPreference,
  projectName: state.projectName,
  projectGoalText: state.projectGoalText,
  projectSlug: state.projectSlug,
}}
```

## Verification

1. Walk through all 8 steps end-to-end
2. On the bridge step, verify the back button navigates to team preference
3. Check sub-step dots progress correctly through each phase
4. Confirm auto-focus fires on identity step (display name) and project basics step (project name)
5. Verify preset goal chips appear and populate the textarea on click
6. Register as a `getting_started` user — confirm repo URL field is hidden on project goal step
7. Register as a `ships_constantly` user — confirm repo URL field is visible
8. Confirm stepper is hidden on the celebration screen
9. Run `npm run lint` and `npm test`
