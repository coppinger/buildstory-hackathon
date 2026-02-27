# Ticket 03: Project CRUD

**Priority:** High | **Estimate:** Large | **Labels:** projects, feature

## Summary

Add the ability for users to create, edit, and delete their own projects from the app shell. Currently projects can only be created during onboarding — there's no way to add more projects later, edit existing ones, or remove them.

## Context

- Projects are created during onboarding via `createOnboardingProject` in `app/(onboarding)/hackathon/actions.ts`
- The project detail page (`app/(app)/projects/[slug]/page.tsx`) is read-only with no edit/delete UI
- The project list page (`app/(app)/projects/page.tsx`) has no "New project" button
- Server action patterns are well-established in `app/event/[slug]/actions.ts` — follow those conventions
- The `projects` table schema: `id`, `profileId` (FK, NOT NULL), `name` (NOT NULL), `slug` (unique, nullable), `description`, `startingPoint` (enum), `goalText`, `githubUrl`, `liveUrl`, `createdAt`, `updatedAt`

## Owned Files (write access — all NEW)

- `app/(app)/projects/actions.ts` — server actions for project CRUD
- `app/(app)/projects/new/page.tsx` — create project page
- `app/(app)/projects/[slug]/edit/page.tsx` — edit project page
- `components/projects/project-form.tsx` — shared form component
- `components/projects/delete-project-dialog.tsx` — delete confirmation dialog

**Reads from (no changes):**
- `app/(app)/projects/[slug]/page.tsx` — add edit/delete buttons (owner only)
- `app/(app)/projects/page.tsx` — add "New project" button
- `lib/db/schema.ts` — project table definition
- `app/(onboarding)/hackathon/actions.ts` — reference for patterns (validateUrl, slug validation, NeonDbError handling)

**Important:** This ticket modifies the existing project detail and list pages to add navigation buttons, but those pages are currently read-only server components. The edit/delete buttons are additions, not rewrites.

## Tasks

### 1. Server Actions (`app/(app)/projects/actions.ts`)

Create a new `"use server"` file with these actions, following the established patterns:

**`createProject(formData: FormData): Promise<ActionResult<{ slug: string }>>`**
- Auth via `auth()` → `ensureProfile()` → get `profileId`
- Extract fields: `name`, `slug`, `description`, `startingPoint`, `goalText`, `githubUrl`, `liveUrl`
- Validate: `name` required, `slug` format (reuse or replicate the slugify pattern from `project-basics-step.tsx`)
- `validateUrl()` for `githubUrl` and `liveUrl`
- Insert into `projects` table
- Link to hackathon event via `eventProjects` (look up event ID from `HACKATHON_SLUG`)
- Handle unique violation on `projects_slug_unique`
- `revalidatePath("/projects")`
- Return `{ success: true, data: { slug } }` for redirect

**`updateProject(projectId: string, formData: FormData): Promise<ActionResult>`**
- Auth + ownership check (`projects.profileId === profileId`)
- Same field extraction and validation as create
- `UPDATE projects SET ... WHERE id = projectId`
- Handle unique violation on slug
- `revalidatePath("/projects")` and `revalidatePath(\`/projects/${slug}\`)`

**`deleteProject(projectId: string): Promise<ActionResult>`**
- Auth + ownership check
- Delete from `eventProjects` where `projectId` (cascade or explicit delete)
- Delete from `projects` where `id = projectId`
- `revalidatePath("/projects")`

**Helper functions to include:**
```ts
// Reuse from onboarding actions pattern
function validateUrl(url: string | null): string | null { ... }
function isUniqueViolation(error: unknown, constraintName: string): boolean { ... }

// Auth + profile helper
async function getProfileId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const profile = await ensureProfile(userId);
  return profile.id;
}
```

### 2. Shared Project Form (`components/projects/project-form.tsx`)

A `"use client"` form component used by both create and edit pages.

**Props:**
```ts
interface ProjectFormProps {
  mode: "create" | "edit";
  initialData?: {
    name: string;
    slug: string;
    description: string;
    startingPoint: "new" | "existing" | null;
    goalText: string;
    githubUrl: string;
    liveUrl: string;
  };
  onSubmit: (formData: FormData) => Promise<ActionResult<{ slug?: string }>>;
}
```

**Fields (matching the `projects` schema):**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Project name | `<Input>` | Yes | `autoFocus` on create mode |
| URL slug | `<Input>` | No | Auto-generated from name (slugify), editable. Show `buildstory.com/projects/{slug}` preview. Debounced availability check via `checkProjectSlugAvailability` |
| Description | `<Textarea>` | No | 3 rows |
| Starting point | Radio group | No | "New project" / "Existing project" — use `SectionRadioGroup` from `components/onboarding/section-radio-group.tsx` |
| Goal | `<Textarea>` | No | "What do you want to build/ship?" |
| GitHub URL | `<Input>` | No | `type="url"`, `font-mono` |
| Live URL | `<Input>` | No | `type="url"`, `font-mono` |

**Submission flow:**
- Build `FormData` from state
- Call `onSubmit(formData)` (which is the bound server action)
- On success in create mode: `router.push(\`/projects/${data.slug}\`)`
- On error: display error message inline (e.g., "Slug already taken")
- Use `useTransition` for loading state on the submit button

### 3. Create Project Page (`app/(app)/projects/new/page.tsx`)

Server component page that renders the form:
```tsx
import { ProjectForm } from "@/components/projects/project-form";
import { createProject } from "../actions";

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-2xl py-8 px-4">
      <h1 className="text-3xl font-heading font-bold mb-8">New project</h1>
      <ProjectForm mode="create" onSubmit={createProject} />
    </div>
  );
}
```

Note: Since `onSubmit` is a server action and `ProjectForm` is a client component, the server action can be passed as a prop directly.

### 4. Edit Project Page (`app/(app)/projects/[slug]/edit/page.tsx`)

Server component that loads the project, verifies ownership, and renders the form pre-filled:

```tsx
export default async function EditProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Fetch project and verify ownership
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const profile = await ensureProfile(userId);
  if (project.profileId !== profile.id) redirect(`/projects/${slug}`);

  return (
    <div className="mx-auto max-w-2xl py-8 px-4">
      <h1 className="text-3xl font-heading font-bold mb-8">Edit project</h1>
      <ProjectForm
        mode="edit"
        initialData={{
          name: project.name,
          slug: project.slug ?? "",
          description: project.description ?? "",
          startingPoint: project.startingPoint,
          goalText: project.goalText ?? "",
          githubUrl: project.githubUrl ?? "",
          liveUrl: project.liveUrl ?? "",
        }}
        onSubmit={updateProject.bind(null, project.id)}
      />
    </div>
  );
}
```

### 5. Delete Project Dialog (`components/projects/delete-project-dialog.tsx`)

A `"use client"` confirmation dialog using the existing `AlertDialog` from shadcn/ui (or `Dialog` if AlertDialog isn't available — check `components/ui/`).

- Triggered by a "Delete" button on the project detail page
- Shows project name and warns "This action cannot be undone"
- "Cancel" closes the dialog
- "Delete" calls `deleteProject(projectId)` server action
- On success: `router.push("/projects")`
- Loading state on the delete button during action

### 6. Update Project Detail Page (`app/(app)/projects/[slug]/page.tsx`)

Add edit/delete controls visible only to the project owner:

```tsx
// After fetching the project, check ownership
const { userId } = await auth();
let isOwner = false;
if (userId) {
  const profile = await ensureProfile(userId);
  isOwner = project.profileId === profile.id;
}

// In the JSX, next to the project title or in a toolbar:
{isOwner && (
  <div className="flex gap-2">
    <Button variant="outline" size="sm" asChild>
      <Link href={`/projects/${project.slug}/edit`}>Edit</Link>
    </Button>
    <DeleteProjectDialog projectId={project.id} projectName={project.name} />
  </div>
)}
```

### 7. Update Project List Page (`app/(app)/projects/page.tsx`)

Add a "New project" button in the page header, visible to all authenticated users:

```tsx
<div className="flex items-center justify-between mb-8">
  <h1 className="text-3xl font-heading font-bold">Projects</h1>
  <Button asChild>
    <Link href="/projects/new">New project</Link>
  </Button>
</div>
```

## Verification

1. Navigate to `/projects` — verify "New project" button appears
2. Click "New project" → fill out form → submit → verify redirect to project detail page
3. On your own project detail page, verify "Edit" and "Delete" buttons appear
4. On someone else's project, verify no edit/delete buttons
5. Click "Edit" → modify fields → submit → verify changes persist
6. Try creating a project with a duplicate slug → verify error message
7. Click "Delete" → confirm in dialog → verify redirect to `/projects` and project is gone
8. Run `npm run lint` and `npm test`
