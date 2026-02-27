# Ticket 07: Landing Page Rules & Guidelines

**Priority:** Medium | **Estimate:** Small | **Labels:** landing-page, content

## Summary

Add a "Rules" section to the landing page that clearly communicates the hackathon's guidelines, spirit, and themes. Visitors need to understand what's expected and what's encouraged before they sign up. This section should feel inviting, not legalistic.

## Context

- The landing page (`app/page.tsx`) is a single async server component with all sections as inline JSX
- Current section order: Hero → Why → What → When → Where → Who → FAQ → CTA → Footer
- The "What" section covers format, judging, categories, recognition, and prizes — but not rules or guidelines
- The header nav (`components/header.tsx`) has anchors: `what`, `why`, `where`, `who`, `faq`
- All sections use the same layout pattern: `<section>` → `max-w-8xl` container → `border-x` → 2-column grid (copy left, cards right) → `BlurFade inView` wrappers
- Content is static/hardcoded — no CMS needed for rules (they don't change per-event for v1)

## Owned Files (write access)

- `app/page.tsx` — add the rules section
- `components/header.tsx` — add "rules" to nav (optional, see below)

No other ticket touches these files — fully parallelizable with all 6 other tickets.

## Tasks

### 1. Add Rules Section to Landing Page

**File:** `app/page.tsx`

Insert a new section between "What" (line 222) and "When" (line 224). This puts rules right after the format/judging info and before the commitment-level cards — the natural reading flow is "here's what it is" → "here are the ground rules" → "here's when it happens."

**Section structure** — follow the existing 2-column pattern:

```tsx
{/* Rules */}
<section id="rules" className="relative z-10 px-6 border-b border-border bg-neutral-950">
  <div className="mx-auto grid max-w-8xl gap-16 md:grid-cols-2 md:gap-20 items-stretch border-x border-border px-6 md:px-12 lg:px-24">
    {/* Left — copy */}
    <div className="py-16 md:py-40">
      <BlurFade inView>
        <span className="text-xs uppercase tracking-[0.25em] text-white/30">
          rules
        </span>
      </BlurFade>

      <BlurFade inView delay={0.1}>
        <h2 className="mt-12 font-heading italic text-3xl md:text-5xl text-[#e8e4de]">
          Keep it simple.
        </h2>
      </BlurFade>
      <BlurFade inView delay={0.15}>
        <h2 className="mt-2 font-heading italic text-2xl md:text-3xl text-neutral-500">
          Build something real. Be good to each other.
        </h2>
      </BlurFade>

      <BlurFade inView delay={0.25}>
        <p className="mt-10 font-mono text-base text-neutral-500 leading-relaxed">
          There are very few rules. The ones we have exist to keep things fair
          and fun for everyone.
        </p>
      </BlurFade>
    </div>

    {/* Right — rule cards */}
    <div className="py-16 md:py-40 flex items-start">
      <div className="w-full flex flex-col gap-3">
        {/* ... rule cards here ... */}
      </div>
    </div>
  </div>
</section>
```

### 2. Rule Cards Content

Use the same card style as the "What" section's info cards (`border border-white/10 px-6 py-5`). Each card has a bold label and a description.

**Rules to include:**

| Label | Description |
|-------|-------------|
| **Ship something** | Your project must be demoable by the end of the week. A landing page, a prototype, a CLI tool — anything that works. |
| **Start or continue** | New projects and existing projects are both welcome. If you're building on something existing, tell us what you're adding this week. |
| **Use any tools** | There are no required languages, frameworks, or AI tools. Use whatever helps you build. |
| **AI is encouraged** | This is an AI-first hackathon. Using AI assistants, code generators, and AI APIs is not just allowed — it's the point. |
| **Be honest** | Attribute your tools, your teammates, and your inspirations. Don't misrepresent someone else's work as your own. |
| **Be kind** | Zero tolerance for harassment, spam, or toxicity. We're all here to build and learn. |

Render as stacked cards, each with `BlurFade inView` and staggered delays (0.1, 0.2, 0.3, etc.):

```tsx
<BlurFade inView delay={0.1}>
  <div className="border border-white/10 px-6 py-5">
    <span className="text-sm font-semibold text-white/50 uppercase tracking-wide">
      Ship something
    </span>
    <p className="text-white/85 mt-1">
      Your project must be demoable by the end of the week. A landing page, a
      prototype, a CLI tool — anything that works.
    </p>
  </div>
</BlurFade>
```

### 3. Optional: Themes / Tracks

If the hackathon has specific themes or tracks beyond the judging categories (Creativity, Business Case, Technical Challenge, Impact, Design), they can be added as a sub-section within the rules section or as a highlighted card at the top.

If no specific themes exist yet, skip this — the categories in the "What" section already serve as loose themes.

### 4. Update Header Nav (Optional)

**File:** `components/header.tsx`

Add `"rules"` to the `navItems` array so visitors can jump directly to it:

```ts
const navItems = ["what", "rules", "why", "where", "who", "faq"];
```

**Consider:** The nav is already 5 items. Adding a 6th is fine on desktop but may crowd the mobile menu. If it feels too much, omit "rules" from the nav — users will encounter it naturally while scrolling between "What" and "When". Use your judgement.

If adding it, the section needs `id="rules"` on the `<section>` tag (already included in the template above).

### 5. Copy Review

The rule card copy above is a starting point. Before merging, review the tone:
- Should feel encouraging, not restrictive
- Short sentences, plain language
- Match the voice of other sections (casual, direct, warm)
- The "Be kind" rule should be clear but not heavy-handed

If the copy needs refinement, adjust before merging. The structure and layout are the main deliverable; exact wording can be iterated.

## Verification

1. Load the landing page — verify the rules section appears between "What" and "When"
2. Scroll through — verify cards animate in with BlurFade (staggered)
3. Check mobile layout — verify cards stack vertically and are readable
4. If nav was updated: click "rules" in the header — verify it scrolls to the section
5. Check that the section matches the visual style of surrounding sections (same border, padding, max-width)
6. Run `npm run lint`
