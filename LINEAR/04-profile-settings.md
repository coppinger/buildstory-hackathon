# Ticket 04: Profile Settings Page

**Priority:** High | **Estimate:** Medium | **Labels:** profile, feature

## Summary

Create a `/settings` page where authenticated users can edit their profile information (display name, username, bio, social links, country/region, experience level). No profile edit page exists today — the celebration screen's "Edit your profile" link is currently dead.

## Context

- Profile data lives in the `profiles` table: `displayName`, `username`, `bio`, `websiteUrl`, `twitterHandle`, `githubHandle`, `twitchUrl`, `streamUrl`, `country`, `region`, `experienceLevel`
- No `/settings` route exists in the app
- The country/region comboboxes in `components/onboarding/` use hardcoded dark-theme classes (`neutral-700`, `neutral-900`, `bg-white/5`, `text-white`) — they need to be adapted or duplicated for the light app shell
- Username validation pattern exists in `app/(onboarding)/hackathon/actions.ts` — reuse `checkUsernameAvailability` and `USERNAME_REGEX`
- The profile detail page (`app/(app)/profiles/[username]/page.tsx`) displays all these fields read-only

## Owned Files (write access — all NEW)

- `app/(app)/settings/page.tsx` — settings page (server component)
- `components/settings/profile-form.tsx` — profile edit form (client component)
- `app/(app)/settings/actions.ts` — server actions for profile update

**Reads from (no changes):**
- `lib/db/schema.ts` — profiles table definition
- `components/onboarding/country-combobox.tsx` — reference for country picker pattern
- `components/onboarding/region-combobox.tsx` — reference for region picker pattern
- `app/(onboarding)/hackathon/actions.ts` — reference for username validation, `isUniqueViolation` pattern

## Coordination Contracts

- **Ticket 04 → Ticket 02:** Ticket 02's celebration screen links to `/settings`. This ticket creates that page.
- **Ticket 04 → Ticket 05:** Ticket 05 adds "Settings" to the sidebar nav. This ticket creates the page it links to.

## Tasks

### 1. Server Actions (`app/(app)/settings/actions.ts`)

**`updateProfile(formData: FormData): Promise<ActionResult>`**

```ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ensureProfile } from "@/lib/db/ensure-profile";
import { NeonDbError } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
```

Flow:
- Auth via `auth()` → `ensureProfile()` → get profile
- Extract fields from `formData`: `displayName`, `username`, `bio`, `websiteUrl`, `twitterHandle`, `githubHandle`, `twitchUrl`, `streamUrl`, `country`, `region`, `experienceLevel`
- Validate `displayName` is not empty
- Validate `username` with `USERNAME_REGEX = /^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$/`
- Validate URLs with `validateUrl()` helper for `websiteUrl`, `twitchUrl`, `streamUrl`
- Strip `@` prefix from `twitterHandle` and `githubHandle` if present
- Uppercase `country` code (consistent with onboarding action)
- `UPDATE profiles SET ... WHERE id = profile.id`
- Handle `isUniqueViolation(error, "profiles_username_unique")` → `"Username is already taken"`
- `revalidatePath("/settings")` and `revalidatePath(\`/profiles/${username}\`)`
- Sentry on failure with `tags: { component: "server-action", action: "updateProfile" }`

### 2. Settings Page (`app/(app)/settings/page.tsx`)

Async server component that loads the current profile and passes it to the form:

```tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ensureProfile } from "@/lib/db/ensure-profile";
import { ProfileForm } from "@/components/settings/profile-form";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const profile = await ensureProfile(userId);

  return (
    <div className="mx-auto max-w-2xl py-8 px-4">
      <h1 className="text-3xl font-heading font-bold mb-8">Settings</h1>
      <ProfileForm profile={profile} />
    </div>
  );
}
```

### 3. Profile Form (`components/settings/profile-form.tsx`)

A `"use client"` form component. This is the bulk of the work.

**Props:**
```ts
interface ProfileFormProps {
  profile: {
    displayName: string;
    username: string | null;
    bio: string | null;
    websiteUrl: string | null;
    twitterHandle: string | null;
    githubHandle: string | null;
    twitchUrl: string | null;
    streamUrl: string | null;
    country: string | null;
    region: string | null;
    experienceLevel: "getting_started" | "built_a_few" | "ships_constantly" | null;
  };
}
```

**Form sections and fields:**

**Identity section:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Display name | `<Input>` | Yes | Pre-filled from profile |
| Username | `<Input>` | No | `@` prefix shown inline, lowercase only, debounced availability check. Show `buildstory.com/@{username}` preview when valid. Reuse the same validation pattern from `identity-step.tsx` |

**Location section:**
| Field | Type | Notes |
|-------|------|-------|
| Country | Combobox | Searchable ISO country picker. **See note below about combobox theming.** |
| Region | Combobox | Depends on country. Only shows when country has regions. |

**About section:**
| Field | Type | Notes |
|-------|------|-------|
| Bio | `<Textarea>` | 4 rows |
| Experience level | Radio group | Three options matching the enum. Use `SectionRadioGroup` or simple radio buttons. |

**Social links section:**
| Field | Type | Placeholder |
|-------|------|-------------|
| Website | `<Input type="url">` | `https://yoursite.com` |
| GitHub | `<Input>` | `username` (just the handle, no URL) |
| X (Twitter) | `<Input>` | `username` (just the handle) |
| Twitch | `<Input type="url">` | `https://twitch.tv/username` |
| Stream URL | `<Input type="url">` | `https://...` |

**Submission:**
- Use `useTransition` for loading state
- Call `updateProfile(formData)` server action
- On success: show a brief success message (e.g., "Profile updated" text that fades after 3s)
- On error: show inline error message

### 4. Country/Region Combobox Theming

The existing comboboxes in `components/onboarding/` use hardcoded dark theme classes. You have two options:

**Option A (recommended): Create light-themed versions**
Create `components/settings/country-combobox.tsx` and `components/settings/region-combobox.tsx` that duplicate the logic from the onboarding versions but use the app shell's design tokens (`border-border`, `bg-background`, `text-foreground`, `bg-muted`, etc.). This avoids touching onboarding files (owned by Ticket 01).

**Option B: Make the originals theme-aware**
Add a `variant` or `theme` prop to the originals. This is cleaner long-term but modifies files owned by Ticket 01, creating a merge conflict risk.

Go with Option A for now — a future ticket can consolidate the duplicates.

### 5. Add "Edit profile" Link to Profile Detail Page

In `app/(app)/profiles/[username]/page.tsx`, add an "Edit" button visible only to the profile owner:

```tsx
const { userId } = await auth();
const isOwner = userId && profile.clerkId === userId;

// Near the profile header:
{isOwner && (
  <Button variant="outline" size="sm" asChild>
    <Link href="/settings">Edit profile</Link>
  </Button>
)}
```

This is a small addition to an existing page — just the button, no structural changes.

## Verification

1. Navigate to `/settings` — verify the form loads with current profile data pre-filled
2. Update display name → submit → verify change appears on profile page
3. Update username → submit → verify the profile URL changes
4. Try a taken username → verify "Username is already taken" error
5. Try an invalid username (too short, special chars) → verify client-side validation
6. Change country → verify region dropdown resets and shows regions for new country
7. Add/edit social links → submit → verify they appear on public profile page
8. Visit your own profile page → verify "Edit profile" button appears and links to `/settings`
9. Visit someone else's profile → verify no edit button
10. Run `npm run lint` and `npm test`
