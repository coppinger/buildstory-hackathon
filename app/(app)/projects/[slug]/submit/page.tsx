import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, projectMembers } from "@/lib/db/schema";
import { ensureProfile } from "@/lib/db/ensure-profile";
import { getFeaturedEvent, getSubmissionForProjectEvent } from "@/lib/queries";
import { isSubmissionOpen } from "@/lib/events";
import { SubmissionForm } from "@/components/submissions/submission-form";

export const metadata: Metadata = {
  title: "Submit Project",
};

export default async function SubmitPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const profile = await ensureProfile(userId);
  if (!profile) redirect("/hackathon");

  // Fetch project by slug
  const project = await db.query.projects.findFirst({
    where: eq(projects.slug, slug),
  });
  if (!project) notFound();

  // Check ownership or membership
  const isOwner = project.profileId === profile.id;
  if (!isOwner) {
    const membership = await db.query.projectMembers.findFirst({
      where: and(
        eq(projectMembers.projectId, project.id),
        eq(projectMembers.profileId, profile.id)
      ),
    });
    if (!membership) notFound();
  }

  // Fetch event and tools in parallel (independent queries)
  const [event, allTools] = await Promise.all([
    getFeaturedEvent(),
    db.query.aiTools.findMany({
      orderBy: (t, { asc }) => [asc(t.category), asc(t.name)],
    }),
  ]);
  if (!event) notFound();

  // Check existing submission. The event link (eventProjects row) is enforced
  // inside the submitProject server action — older projects created before the
  // event-link flow was reliable can still be submitted, the action will
  // create the link as long as the event is open.
  const existingSubmission = await getSubmissionForProjectEvent(
    project.id,
    event.id
  );

  // Deadline check
  if (!isSubmissionOpen(event)) {
    return (
      <div className="p-6 md:p-8 lg:p-12 w-full max-w-2xl mx-auto">
        <div className="text-center py-20">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono mb-4">
            Submissions closed
          </p>
          <h1 className="font-heading text-3xl text-foreground italic mb-3">
            The submission window has ended.
          </h1>
          <p className="text-sm font-mono text-muted-foreground">
            The deadline was March 10, 2026 at midnight UTC.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 lg:p-12 w-full">
      <SubmissionForm
        project={project}
        eventId={event.id}
        tools={allTools}
        profile={profile}
        existingSubmission={
          existingSubmission
            ? {
                submission: existingSubmission,
                toolIds: existingSubmission.tools.map((t) => t.toolId),
              }
            : null
        }
      />
    </div>
  );
}
