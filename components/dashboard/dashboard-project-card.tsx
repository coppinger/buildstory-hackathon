import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DISCORD_INVITE_URL } from "@/lib/constants";
import type { Project } from "@/lib/db/schema";

const startingPointLabels: Record<string, string> = {
  new: "New",
  existing: "Existing",
};

export function DashboardProjectCard({
  project,
}: {
  project: Project | null;
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

  return (
    <Card className="w-full">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              your project
            </p>
            <h2 className="mt-2 font-heading text-lg text-foreground">
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
          {project.startingPoint && (
            <Badge variant="outline" className="shrink-0">
              {startingPointLabels[project.startingPoint] ??
                project.startingPoint}
            </Badge>
          )}
        </div>

        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.description}
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
          {project.slug && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/projects/${project.slug}/edit`}>Edit project</Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
