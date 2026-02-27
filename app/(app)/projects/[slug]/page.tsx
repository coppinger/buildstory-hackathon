import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProjectBySlug, getProjectPendingInvites } from "@/lib/queries";
import { ensureProfile } from "@/lib/db/ensure-profile";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { TeamSection } from "@/components/projects/team-section";

const startingPointLabels: Record<string, string> = {
  new: "Starting from scratch",
  existing: "Building on something existing",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) notFound();

  // Check ownership
  let isOwner = false;
  let currentUserProfileId: string | null = null;
  const { userId } = await auth();
  if (userId) {
    const profile = await ensureProfile(userId);
    if (profile) {
      currentUserProfileId = profile.id;
      if (profile.id === project.profile.id) {
        isOwner = true;
      }
    }
  }

  const pendingInvites = isOwner
    ? await getProjectPendingInvites(project.id)
    : [];

  return (
    <div className="p-8 lg:p-12 w-full max-w-3xl">
      <div className="flex items-center justify-between">
        <Link
          href="/projects"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors font-mono"
        >
          &larr; Back to projects
        </Link>

        {isOwner && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/projects/${slug}/edit`}>Edit</Link>
            </Button>
            <DeleteProjectDialog
              projectId={project.id}
              projectName={project.name}
              trigger={
                <Button variant="destructive" size="sm">
                  Delete
                </Button>
              }
            />
          </div>
        )}
      </div>

      <h1 className="mt-6 font-heading text-4xl text-foreground">
        {project.name}
      </h1>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {project.startingPoint && (
          <Badge variant="outline">
            {startingPointLabels[project.startingPoint] ?? project.startingPoint}
          </Badge>
        )}
        {project.eventProjects.map((ep) => (
          <Badge key={ep.id} variant="secondary">
            {ep.event.name}
          </Badge>
        ))}
      </div>

      {project.description && (
        <p className="mt-6 text-base text-muted-foreground leading-relaxed">
          {project.description}
        </p>
      )}

      {project.goalText && (
        <div className="mt-6 border border-border p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
            Goal
          </p>
          <p className="text-foreground">{project.goalText}</p>
        </div>
      )}

      <div className="mt-6 flex items-center gap-4">
        {project.githubUrl && (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-mono text-foreground hover:text-buildstory-500 transition-colors"
          >
            GitHub &rarr;
          </a>
        )}
        {project.liveUrl && (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-mono text-foreground hover:text-buildstory-500 transition-colors"
          >
            Live site &rarr;
          </a>
        )}
      </div>

      {/* Team */}
      <TeamSection
        projectId={project.id}
        isOwner={isOwner}
        ownerProfile={project.profile}
        members={project.members}
        pendingInvites={pendingInvites}
        currentUserProfileId={currentUserProfileId}
      />
    </div>
  );
}
