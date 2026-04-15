import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { HighlightCtaCard } from "@/components/dashboard/highlight-cta-card";
import { DISCORD_INVITE_URL } from "@/lib/constants";
import { stripMarkdown } from "@/lib/markdown";
import type { Project } from "@/lib/db/schema";

const startingPointLabels: Record<string, string> = {
  new: "New",
  existing: "Existing",
};

export function DashboardProjectCard({
  project,
  hasSubmission,
  submissionOpen = false,
}: {
  project: Project | null;
  hasSubmission?: boolean;
  submissionOpen?: boolean;
}) {
  if (!project) {
    return (
      <HighlightCtaCard
        title="Add your project"
        description={
          <>
            Show the community what you&apos;re building. Add a project to get
            started, or{" "}
            <a
              href={DISCORD_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white"
            >
              find a team
            </a>
            .
          </>
        }
        ctaHref="/projects/new"
        ctaLabel="Add a project"
      />
    );
  }

  const isPastDeadline = !submissionOpen;

  return (
    <Card className="w-full">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <SectionLabel>your project</SectionLabel>
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
