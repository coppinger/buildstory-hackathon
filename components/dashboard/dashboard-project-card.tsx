import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DISCORD_INVITE_URL, SUBMISSION_DEADLINE } from "@/lib/constants";
import { stripMarkdown } from "@/lib/markdown";
import type { Project } from "@/lib/db/schema";

const startingPointLabels: Record<string, string> = {
  new: "New",
  existing: "Existing",
};

export function DashboardProjectCard({
  project,
  hasSubmission,
}: {
  project: Project | null;
  hasSubmission?: boolean;
}) {
  if (!project) {
    return (
      <Card className="w-full border-buildstory-500/30 bg-buildstory-900/20">
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              your project
            </p>
            <h2 className="mt-2 text-lg font-semibold text-foreground">
              Add your project
            </h2>
            <p className="mt-1 text-muted-foreground">
              Show the community what you&apos;re building. Add a project to get
              started.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              asChild
              className="shrink-0 w-fit bg-buildstory-500 text-background text-sm"
              size="lg"
            >
              <Link href="/projects/new">Add a project</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Find a team
              </a>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const isPastDeadline = new Date() > SUBMISSION_DEADLINE;

  return (
    <Card className="w-full">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              your project
            </p>
            <h2 className="mt-2 font-heading text-lg text-foreground break-words">
              {project.slug ? (
                <Link
                  href={`/projects/${project.slug}`}
                  className="hover:text-buildstory-500 transition-colors"
                >
                  {project.name}
                </Link>
              ) : (
                project.name
              )}
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {hasSubmission && (
              <Badge className="bg-green-500/15 text-green-500 border-green-500/30">
                Submitted
              </Badge>
            )}
            {project.startingPoint && (
              <Badge variant="outline">
                {startingPointLabels[project.startingPoint] ??
                  project.startingPoint}
              </Badge>
            )}
          </div>
        </div>

        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {stripMarkdown(project.description)}
          </p>
        )}

        {/* Submission CTA */}
        {project.slug && !hasSubmission && !isPastDeadline && (
          <div className="border border-buildstory-500/30 bg-buildstory-500/5 p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Submit your project
              </p>
              <p className="text-xs text-muted-foreground">
                Hackathon 00 has ended &mdash; submit by March 10
              </p>
            </div>
            <Button
              asChild
              className="shrink-0 bg-buildstory-500 text-background text-sm"
            >
              <Link href={`/projects/${project.slug}/submit`}>Submit</Link>
            </Button>
          </div>
        )}

        {!hasSubmission && isPastDeadline && (
          <p className="text-xs font-mono text-muted-foreground">
            Submission window closed
          </p>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
              >
                GitHub
              </a>
            )}
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
              >
                Live
              </a>
            )}
          </div>
          <div className="flex items-center gap-2">
            {project.slug && hasSubmission && (
              <Button variant="outline" asChild>
                <Link href={`/projects/${project.slug}/submit`}>
                  Edit submission
                </Link>
              </Button>
            )}
            {project.slug && (
              <Button variant="outline" asChild>
                <Link href={`/projects/${project.slug}/edit`}>
                  Edit project
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
