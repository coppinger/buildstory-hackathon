# Platform Structural Changes — Hackathon Decoupling, Navigation & Remaining Submission Surfaces

## Context

Hackathon 00 has run. The submission form and post-submission share experience (celebration screen, branded image, share-to-X) are already shipped and working. The platform now needs to evolve from a hackathon-first experience into a builders community platform where projects exist independently and hackathons are one feature among several.

This spec covers: navigation changes, hackathon list and detail pages, the hackathon state machine, project page independence, the submissions gallery and dashboard feed that weren't built in the first pass, the location prompt, and Hackathon 01 registration.

---

## Navigation

Add two new top-level nav items alongside the existing ones (Dashboard, Projects, Members, Live Streams, Roadmap, Settings):

- **Hackathons** — links to /hackathons
- **Tools** — links to /tools (placeholder "coming soon" page for now; content system spec covers what lives here)

---

## Hackathon List Page (/hackathons)

Vertical column layout organized into temporal sections:

- **Current** — any hackathon in Active or Judging state
- **Upcoming** — hackathons in Upcoming state
- **Previous** — hackathons in Complete state

Each entry shows: name, dates, state badge, participant count. Entries link to their detail page.

### Initial Data

| Event | Dates | State |
|---|---|---|
| Hackathon 00 | March 1–8, 2026 | Special case: retroactive submission window ends March 10 EOD, then Judging for 48hrs, then Complete |
| Hackathon 01 | March 28 – April 4, 2026 | Upcoming, registration open immediately |

Future cadence: roughly monthly, first-to-last Saturday. Events created manually.

---

## Hackathon State Machine

Four states, fully date-driven with automatic transitions:

**Upcoming → Active → Judging → Complete**

| State | Trigger | What's available |
|---|---|---|
| Upcoming | Created with a future start date | Sign-up CTA, event details, participant count |
| Active | Start date reached | Submissions open throughout, participants can submit/update anytime. Sign-up still open. |
| Judging | End date reached | Submissions close, peer review opens for 48 hours |
| Complete | End date + 48hrs | Results visible, gallery permanent, no more submissions or reviews |

Submissions are open throughout the Active period — no separate submissions state.

### Hackathon 00 Exception

Hackathon 00 ran before this system existed. It's in a retroactive submissions window (ends March 10 EOD), then transitions to Judging for 48hrs, then Complete. Handle with a one-time date adjustment so it flows through the same state machine going forward.

---

## Hackathon Detail Page (/hackathons/[slug])

Contains all existing hackathon details from the current codebase. Page adapts based on current state:

- **Upcoming:** event description, dates, sign-up CTA, participant count
- **Active:** everything above + submissions gallery building in real-time, submission CTA for participants
- **Judging:** submissions gallery (final), peer review interface (separate spec), countdown to results
- **Complete:** final gallery with highlights/results, permanent archive

---

## Submissions Gallery (not yet built)

A public grid view on the hackathon detail page showing all submitted projects. Visible to anyone (not just participants). Persists permanently after the event completes.

### Card Content

Each card shows:

- Builder name + avatar
- Project title + "what I built" blurb
- AI tools used (as tags/pills)
- Location stamp (if set)

Cards link through to the full project page.

---

## Dashboard Submissions Feed (not yet built)

A live feed on the dashboard showing submissions as they come in. Creates social proof and energy during the active/submission window.

### Feed Entry Content

Each entry shows:

- Builder name + avatar
- Project title + blurb
- AI tools used
- Location stamp (if set)
- Relative timestamp (e.g. "submitted 5m ago")

Chronological, newest first.

---

## Location Prompt (not yet built)

On the existing submission form, if the user's profile has no location set, show an inline prompt (not a modal, not a separate step). City/country autocomplete search. Frame it around the stamps — "Add your location to get your hackathon stamp." Saves to their profile. Skippable.

---

## Project Pages (/projects/[slug])

Projects exist independently of hackathons. The project page works as a standalone showcase regardless of event participation.

### Hackathon History Section

Add a dedicated section on the project page showing event participation. For each hackathon the project was entered in, show:

- Hackathon name + link to event page
- Submission details (what I built blurb, demo link, tools used, etc.)
- State of that event

A project can be entered into multiple events, each with its own submission record.

---

## Project–Hackathon Relationship

Many-to-many. A project can participate in multiple hackathons. Each participation has its own submission record. The join captures:

- Which project
- Which hackathon
- Submission data (all fields from the existing submission form)
- Timestamps for entry and submission

Projects already live in their own table. This may just require a join table and updating how submissions reference both entities.

---

## Hackathon 01 Details

| Field | Value |
|---|---|
| Name | Hackathon 01 |
| Dates | March 28 – April 4, 2026 |
| Format | 7-day open build, ship something with AI |
| Registration | Open immediately |
| Submissions | Open throughout the active period |
| Judging | 48 hours after end date (April 4–6) |

---

## Not in Scope

- Updates / build logs (spec-04, content system)
- Tool pages and threads (spec-04, content system)
- Peer review / judging mechanics (separate spec)
- Post-submission share experience (already shipped)
- Submission form fields (already shipped)
