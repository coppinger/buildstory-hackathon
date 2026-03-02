import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { PaginatedList } from "@/components/paginated-list";
import { SearchSortBar } from "@/components/search-sort-bar";
import { UserAvatar } from "@/components/ui/user-avatar";
import { getHackathonProjects, getUserHackathonProjects } from "@/lib/queries";
import { loadSearchSortParams, DEFAULT_PAGE_SIZE } from "@/lib/search-params";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

const startingPointLabels: Record<string, string> = {
  new: "New",
  existing: "Existing",
};

type HackathonProject = Awaited<ReturnType<typeof getUserHackathonProjects>>[number];

function ProjectCard({ project, pinned = false }: { project: HackathonProject; pinned?: boolean }) {
  return (
    <div
      className={`border p-6 flex flex-col gap-3 h-full ${
        pinned
          ? "border-buildstory-500/40 bg-buildstory-500/[0.03]"
          : "border-border"
      }`}
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
        <div className="flex items-center gap-1.5 shrink-0">
          {pinned && (
            <Badge variant="outline" className="text-buildstory-500 border-buildstory-500/30">
              <Icon name="push_pin" size="3" className="mr-0.5" />
              Yours
            </Badge>
          )}
          {project.startingPoint && (
            <Badge variant="outline">
              {startingPointLabels[project.startingPoint] ?? project.startingPoint}
            </Badge>
          )}
        </div>
      </div>

      {project.description && (
        <p className="text-sm text-muted-foreground line-clamp-3">
          {project.description}
        </p>
      )}

      <div className="mt-auto pt-3 flex items-center justify-between text-sm">
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <UserAvatar
            avatarUrl={project.profile.avatarUrl}
            displayName={project.profile.displayName}
            size="sm"
          />
          <div className="min-w-0">
            <p className="text-foreground font-medium truncate">
              {project.profile.displayName}
            </p>
            {project.profile.username ? (
              <Link
                href={`/members/${project.profile.username}`}
                className="text-muted-foreground hover:text-buildstory-500 transition-colors font-mono truncate block"
              >
                @{project.profile.username}
              </Link>
            ) : null}
          </div>
          {project.members.length > 0 && (
            <div className="flex items-center -space-x-2 ml-auto">
              {project.members.slice(0, 3).map((member) => (
                <UserAvatar
                  key={member.profile.id}
                  avatarUrl={member.profile.avatarUrl}
                  displayName={member.profile.displayName}
                  size="xs"
                  className="ring-2 ring-background"
                />
              ))}
              {project.members.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-foreground ring-2 ring-background shrink-0">
                  +{project.members.length - 3}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
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
  );
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { page, q, sort } = await loadSearchSortParams(searchParams);
  const result = await getHackathonProjects({
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    search: q || undefined,
    sort,
  });

  if (!("items" in result)) return null;

  const { items: projects, ...pagination } = result;

  // Fetch pinned projects for the authenticated user
  let pinnedProjects: HackathonProject[] = [];
  const { userId } = await auth();
  if (userId) {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.clerkId, userId),
      columns: { id: true },
    });
    if (profile) {
      pinnedProjects = await getUserHackathonProjects(profile.id);
    }
  }

  const isSearching = !!q;

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

      {/* Pinned projects (always shown, not affected by search/sort) */}
      {pinnedProjects.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Your projects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pinnedProjects.map((project) => (
              <ProjectCard key={project.id} project={project} pinned />
            ))}
          </div>
        </div>
      )}

      <SearchSortBar placeholder="Search projects by name..." />

      {projects.length === 0 ? (
        <div className="mt-12 text-center">
          <Icon name="search_off" size="8" className="text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">
            {isSearching
              ? `No projects found matching "${q}".`
              : "No projects submitted yet."}
          </p>
        </div>
      ) : (
        <PaginatedList {...pagination}>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </PaginatedList>
      )}
    </div>
  );
}
