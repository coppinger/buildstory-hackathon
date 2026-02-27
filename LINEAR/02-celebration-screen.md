# Ticket 02: Celebration Screen

**Priority:** High | **Estimate:** Medium | **Labels:** onboarding, UX, social

## Summary

Redesign the celebration step into a compelling bento-grid layout with shareable content, sticky navigation buttons, and a streaming nudge card. Fix the dead `/profile/edit` link and add a pseudo-tweet for social sharing.

## Context

The current celebration step (`celebration-step.tsx`) works but is a simple vertical stack: confetti, header, countdown card, Discord card, share card, and two buttons. It needs to become a moment of delight that encourages sharing and next actions. The dead `/profile/edit` link needs to point to `/settings` (created by Ticket 04).

## Owned Files (write access)

- `components/onboarding/steps/celebration-step.tsx`

**Reads from (no changes):** orchestrator props from Ticket 01

## Coordination Dependencies

- **From Ticket 01:** The orchestrator will pass `username` in the state prop. Update the component's state type to accept it:
  ```ts
  state: {
    displayName: string;
    username: string;  // NEW — from Ticket 01
    experienceLevel: string | null;
    teamPreference: string | null;
    projectName: string;
    projectGoalText: string;
    projectSlug: string;
  }
  ```
- **From Ticket 04:** The "Edit your profile" link should point to `/settings` (Ticket 04 creates this page). Use `/settings` as the href.
- **From Ticket 01:** The stepper is hidden on this step (handled in Ticket 01's orchestrator changes).

## Tasks

### 1. Update State Type to Accept `username`

Add `username: string` to the state type in the component's props interface. This enables the pseudo-tweet to display `@username`.

### 2. Fix Dead Profile Edit Link

**Current (broken):**
```tsx
<Link href="/profile/edit">Edit your profile →</Link>
```

**Replace with:**
```tsx
<Link href="/settings">Edit your profile →</Link>
```

### 3. Bento Grid Layout

Replace the current vertical stack with a responsive bento grid. The grid should feel like a dashboard of "what you just accomplished" and "what's next."

**Desktop layout (2 columns):**
```
┌──────────────────┬──────────────────┐
│  Header / Hero   │  Pseudo-Tweet    │
│  (name, badges)  │  (share card)    │
├──────────────────┼──────────────────┤
│  Countdown       │  Discord         │
│  (to March 1)    │  (invite card)   │
├──────────────────┴──────────────────┤
│  Streaming Nudge (full width)       │
└─────────────────────────────────────┘
```

**Mobile layout:** Single column, natural stack order: Header → Pseudo-Tweet → Countdown → Discord → Streaming Nudge.

Use CSS grid with `grid-cols-1 md:grid-cols-2` and `gap-4`. Each card should be a bordered card with `rounded-xl border border-neutral-800 bg-neutral-900/50 p-6` (matching the dark onboarding theme).

### 4. Pseudo-Tweet Share Card

Create a card that looks like a tweet/post preview, pre-filled with the user's registration info. This is the primary sharing mechanism.

**Content template:**
```
I just registered for Hackathon 00 on @buildstory!

{variant === "with_project" ? `Building: ${projectName}` : "Ready to build something."}

Join us → buildstory.com
```

**UI elements:**
- Card styled to resemble a social post (avatar, display name, @username, post body, timestamp)
- "Copy" button — copies the text to clipboard using `navigator.clipboard.writeText()`
- "Share on X" button — opens `https://x.com/intent/tweet?text={encodeURIComponent(tweetText)}` in a new tab
- Show a brief "Copied!" toast/feedback when copy succeeds (use a local `useState` with a timeout, or the existing toast system if one exists)

The `username` from state (provided by Ticket 01's coordination contract) is used in the `@username` display within the pseudo-tweet.

### 5. Sticky Footer Buttons

The two CTA buttons ("Go to dashboard" and "Edit your profile") should be sticky at the bottom of the viewport so they're always accessible as the user scrolls through the bento content.

```tsx
<div className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-800 bg-neutral-950/90 backdrop-blur-sm p-4">
  <div className="mx-auto max-w-lg space-y-2">
    <Button asChild className="w-full h-12 ...">
      <Link href="/dashboard">Go to dashboard →</Link>
    </Button>
    <Button variant="outline" asChild className="w-full h-11">
      <Link href="/settings">Edit your profile →</Link>
    </Button>
  </div>
</div>
```

Add `pb-32` (or similar) to the main content container to prevent the sticky footer from overlapping the last card.

### 6. Streaming Nudge Card

Add a new full-width card at the bottom of the bento grid that encourages participants to stream their build process.

**Content:**
- Icon: `<Icon name="videocam" />` or `<Icon name="live_tv" />`
- Headline: "Stream your build"
- Body: "Working live? Add your Twitch or stream URL to your profile so others can watch and learn. Bonus points for building in public."
- CTA: "Add stream URL →" linking to `/settings`

Style as a subtle card, not as prominent as the countdown or share cards. Use `text-neutral-400` for body text and an amber accent for the CTA link.

### 7. Confetti Enhancement

The current confetti fires once on mount. Keep this behavior but consider making it slightly more celebratory:
- Fire a second burst after a 500ms delay for a cascading effect
- Use `canvas-confetti` (already installed) with `particleCount: 100, spread: 70, origin: { y: 0.6 }`

This is low priority — skip if it adds complexity.

## Verification

1. Complete onboarding to reach the celebration step
2. Verify bento layout renders correctly on mobile (single column) and desktop (2 columns)
3. Click "Copy" on the pseudo-tweet — paste in a text editor and verify content is correct
4. Click "Share on X" — verify it opens the correct tweet intent URL in a new tab
5. Scroll down — verify sticky buttons remain visible at the bottom
6. Verify the streaming nudge card renders with correct copy and links to `/settings`
7. Click "Edit your profile" — verify it navigates to `/settings` (requires Ticket 04 to be complete for the page to exist; just verify the link href is correct)
8. Run `npm run lint`
