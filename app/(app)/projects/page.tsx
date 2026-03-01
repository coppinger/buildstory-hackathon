import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getHackathonProjects } from "@/lib/queries";

const startingPointLabels: Record<string, string> = {
  new: "New",
  existing: "Existing",
};

export default async function ProjectsPage() {
  const projects = await getHackathonProjects();

  return (
    <div className="p-6 md:p-8 lg:p-12 w-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl text-foreground">Projects</h1>
          <p className="mt-2 text-muted-foreground">
            See what people are building for Hackathon 00.
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">New project</Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <p className="mt-12 text-muted-foreground text-center">
          No projects submitted yet.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="border border-border p-6 flex flex-col gap-3 h-full"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-heading text-lg text-foreground">
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
                {project.startingPoint && (
                  <Badge variant="outline" className="shrink-0">
                    {startingPointLabels[project.startingPoint] ?? project.startingPoint}
                  </Badge>
                )}
              </div>

              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {project.description}
                </p>
              )}

              <div className="mt-auto pt-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-mono">
                  by{" "}
                  {project.profile.username ? (
                    <Link
                      href={`/members/${project.profile.username}`}
                      className="text-foreground hover:text-buildstory-500 transition-colors"
                    >
                      @{project.profile.username}
                    </Link>
                  ) : (
                    project.profile.displayName
                  )}
                  {project.members.length > 0 && (
                    <span className="text-muted-foreground">
                      {" "}+ {project.members.length} other{project.members.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </span>

                <div className="flex items-center gap-3">
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      GitHub
                    </a>
                  )}
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Live
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
