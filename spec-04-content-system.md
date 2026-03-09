# Content System — Updates, Tool Threads, Reactions & Comments

## Context

This is a fast-follow after the structural changes (spec-03) and submissions (spec-01) are shipped. It introduces the core content primitive that powers both project updates and tool discussions, and later becomes the home for CLI-generated build logs.

---

## The Post Primitive

A single content type that lives in different contexts. Same data shape, different presentation.

### Fields

| Field | Type | Notes |
|---|---|---|
| Body | Text, ~280 chars | Tweet-length. Required. |
| Image/screenshot | File attachment | Optional. Single image. |
| Link | URL | Optional. Renders as an embed preview if possible. |
| Context type | Enum: project \| tool | Where this post lives |
| Context ID | Reference | The project ID or tool ID it's anchored to |
| Author | User reference | Who posted it |
| Created at | Timestamp | |

### Contexts

**Project update** (context: project) — appears on the project page as a chronological timeline. Think build log entries. "Here's what I did today." This is where CLI-generated updates will land when the webhook pipeline ships.

**Tool thread starter** (context: tool) — appears on a tool page as a top-level post in a feed. Others can reply, creating a threaded conversation. Think Twitter-style: the tool page is a scoped feed, each top-level post is a conversation starter with its own reply chain underneath.

---

## Tool Pages (/tools)

The /tools route shows a browsable list of tools. Clicking into a tool (/tools/[slug]) reveals a feed of posts about that tool.

### Tool List

Curated and admin-managed. Seeded with the tools from the existing toolchain categories (planning, coding, code review, models). New tools added by admins over time.

Each tool has: name, category, optional description, optional icon/logo.

### Tool Detail Page (/tools/[slug])

A scrollable feed of top-level posts about this tool, newest first. Each post shows its reply thread inline (collapsed by default, expandable). Twitter-style — not a forum with separate thread pages.

Users can create a new top-level post from the tool page. This is a conversation starter, not a reply.

---

## Reactions

Available on both posts and replies (comments).

Emoji reactions — a curated set rather than the full emoji picker. Keep it small and meaningful. Something like: 🔥 (fire/great), 🚀 (shipped/launch), 💡 (insightful), 👏 (props), 🛠️ (building). Final set TBD but keep it under 6 options.

Each user can react once per emoji per post (toggle on/off). Show reaction counts.

---

## Comments / Replies

Full threaded replies on both project updates and tool posts.

A comment has:

| Field | Type | Notes |
|---|---|---|
| Body | Text, ~280 chars | Same length constraint as posts |
| Author | User reference | |
| Parent | Post or comment reference | Top-level comments reference the post, nested replies reference another comment |
| Created at | Timestamp | |

Comments also have emoji reactions (same set as posts).

### Threading

- Project updates: flat replies (one level deep, no nesting). Keeps the timeline clean.
- Tool threads: nested replies (at least 2 levels — reply to post, reply to reply). Enables conversation.

---

## Feeds

The post primitive feeds into multiple surfaces:

- **Project page** — timeline of that project's updates, chronological
- **Tool page** — feed of posts about that tool, newest first, with reply threads
- **Dashboard** — mixed feed showing recent activity across projects and tools the user follows or participates in (design TBD, can start simple)

---

## CLI Integration (Future)

When the webhook pipeline ships, CLI-generated build logs become project updates automatically. The post primitive is the same — body text (AI-generated from git diff), optional metadata. The only difference is the source (manual vs CLI) which should be stored as a field for future use (distinguishing human vs automated posts).

Add a `source` enum to the post: `manual` | `cli` | `webhook`. Default to `manual` for now.

---

## Not in Scope

- Notifications (when someone reacts to or comments on your post)
- Following tools or projects
- Feed algorithm (chronological is fine for now)
- Moderation tools
- Edit/delete posts (can add quickly as a fast-follow)
