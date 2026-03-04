import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { ensureProfile } from "@/lib/db/ensure-profile";
import { getProjectBySlug } from "@/lib/queries";
import { ogMeta, notFoundMeta } from "@/lib/metadata";
import { loadRoadmapParams } from "@/lib/search-params";
import {
  getFeatureBoardItems,
  getStatusCounts,
  getKanbanItems,
  getFeatureBoardCategories,
  getContributorLeaderboard,
  isProjectAdmin,
} from "@/lib/roadmap/queries";
import { roadmapBasePath } from "@/lib/roadmap/paths";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { PaginatedList } from "@/components/paginated-list";
import { RoadmapItemCard } from "@/components/roadmap/roadmap-item-card";
import { RoadmapStatusFilter } from "@/components/roadmap/roadmap-status-filter";
import { RoadmapSortBar } from "@/components/roadmap/roadmap-sort-bar";
import { RoadmapViewToggle } from "@/components/roadmap/roadmap-view-toggle";
import { RoadmapKanbanView } from "@/components/roadmap/roadmap-kanban-view";
import { ContributorLeaderboard } from "@/components/roadmap/contributor-leaderboard";
import { CategoryManager } from "@/components/roadmap/category-manager";
import { SubmitIdeaButton } from "@/app/(app)/roadmap/submit-idea-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return notFoundMeta;
  return ogMeta(
    `${project.name} — Roadmap`,
    `Feature board and roadmap for ${project.name}`
  );
}

export default async function ProjectRoadmapPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const roadmapParams = await loadRoadmapParams(searchParams);
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const { userId } = await auth();
  const basePath = roadmapBasePath(slug);

  let profileId: string | null = null;
  let isAdmin = false;
  if (userId) {
    const profile = await ensureProfile(userId);
    profileId = profile?.id ?? null;
    if (profileId) {
      isAdmin = await isProjectAdmin(profileId, project.id);
    }
  }

  const [statusCounts, categories] = await Promise.all([
    getStatusCounts(isAdmin, project.id),
    getFeatureBoardCategories(project.id),
  ]);

  return (
    <div className="p-6 md:p-8 lg:p-12 w-full max-w-4xl">
      <Link
        href={`/projects/${slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors font-mono"
      >
        <Icon name="arrow_back" size="3.5" />
        Back to project
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl text-foreground">
            {project.name} Roadmap
          </h1>
          <p className="mt-2 text-muted-foreground">
            Vote on features and suggest ideas for this project.
          </p>
        </div>
        {userId ? (
          <SubmitIdeaButton categories={categories} projectId={project.id} />
        ) : (
          <Button asChild>
            <Link href="/sign-in">Sign in to suggest</Link>
          </Button>
        )}
      </div>

      {isAdmin && (
        <CategoryManager projectId={project.id} categories={categories} />
      )}

      <RoadmapViewToggle />

      {roadmapParams.view === "contributors" ? (
        <ContributorsSection projectId={project.id} />
      ) : roadmapParams.view === "kanban" ? (
        <KanbanSection
          profileId={profileId}
          isAuthenticated={!!userId}
          isAdmin={isAdmin}
          projectId={project.id}
          basePath={basePath}
        />
      ) : (
        <>
          <RoadmapStatusFilter counts={statusCounts} isAdmin={isAdmin} />
          <RoadmapSortBar />
          <ListSection
            params={roadmapParams}
            profileId={profileId}
            isAdmin={isAdmin}
            isAuthenticated={!!userId}
            projectId={project.id}
            basePath={basePath}
          />
        </>
      )}
    </div>
  );
}

async function KanbanSection({
  profileId,
  isAuthenticated,
  isAdmin,
  projectId,
  basePath,
}: {
  profileId: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  projectId: string;
  basePath: string;
}) {
  const items = await getKanbanItems(profileId, isAdmin, projectId);
  return (
    <RoadmapKanbanView
      items={items}
      isAuthenticated={isAuthenticated}
      isAdmin={isAdmin}
      basePath={basePath}
    />
  );
}

async function ListSection({
  params,
  profileId,
  isAdmin,
  isAuthenticated,
  projectId,
  basePath,
}: {
  params: {
    page: number;
    q: string;
    sort: "most_upvoted" | "newest";
    status: string;
  };
  profileId: string | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  projectId: string;
  basePath: string;
}) {
  const result = await getFeatureBoardItems({
    page: params.page,
    search: params.q || undefined,
    sort: params.sort,
    status: params.status,
    profileId,
    isAdmin,
    projectId,
  });

  if (result.items.length === 0) {
    return (
      <div className="mt-12 text-center">
        <p className="text-muted-foreground">No items found.</p>
      </div>
    );
  }

  return (
    <PaginatedList
      totalCount={result.totalCount}
      page={result.page}
      pageSize={result.pageSize}
      totalPages={result.totalPages}
    >
      <div className="mt-6 space-y-3">
        {result.items.map((item) => (
          <RoadmapItemCard
            key={item.id}
            item={item}
            isAdmin={isAdmin}
            isAuthenticated={isAuthenticated}
            basePath={basePath}
            projectId={projectId}
          />
        ))}
      </div>
    </PaginatedList>
  );
}

async function ContributorsSection({ projectId }: { projectId: string }) {
  const [allTimeEntries, monthlyEntries] = await Promise.all([
    getContributorLeaderboard("all", projectId),
    getContributorLeaderboard("month", projectId),
  ]);

  return (
    <ContributorLeaderboard
      allTimeEntries={allTimeEntries}
      monthlyEntries={monthlyEntries}
    />
  );
}
