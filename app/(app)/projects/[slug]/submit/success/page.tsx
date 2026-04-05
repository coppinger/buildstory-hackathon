import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { eventProjects, projects, projectMembers } from "@/lib/db/schema";
import { ensureProfile } from "@/lib/db/ensure-profile";
import { getFeaturedEvent } from "@/lib/queries";
import { getSubmissionForProjectEvent } from "@/lib/queries";
import { SubmissionCelebration } from "@/components/submissions/submission-celebration";

export const metadata: Metadata = {
  title: "Submitted!",
};

export default async function SubmissionSuccessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Parallelize independent lookups
  const [profile, project, event] = await Promise.all([
    ensureProfile(userId),
    db.query.projects.findFirst({ where: eq(projects.slug, slug) }),
    getFeaturedEvent(),
  ]);
  if (!profile) redirect("/hackathon");
  if (!project) notFound();
  if (!event) notFound();

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

  // Verify event link and get submission in parallel
  const [eventProject, submission] = await Promise.all([
    db.query.eventProjects.findFirst({
      where: and(
        eq(eventProjects.projectId, project.id),
        eq(eventProjects.eventId, event.id)
      ),
    }),
    getSubmissionForProjectEvent(project.id, event.id),
  ]);
  if (!eventProject) notFound();
  if (!submission) {
    redirect(`/projects/${slug}/submit`);
  }

  const ogImageUrl = `/api/og/submission?slug=${slug}`;

  return (
    <div className="p-6 md:p-8 lg:p-12 w-full">
      <SubmissionCelebration
        projectName={project.name}
        projectSlug={slug}
        whatBuilt={submission.whatBuilt}
        ogImageUrl={ogImageUrl}
      />
    </div>
  );
}
