import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { ensureProfile } from "@/lib/db/ensure-profile";
import { isModerator as checkIsModerator } from "@/lib/admin";
import { ogMeta } from "@/lib/metadata";
import { loadRoadmapParams } from "@/lib/search-params";
import {
  getFeatureBoardItems,
  getStatusCounts,
  getKanbanItems,
  getFeatureBoardCategories,
  getContributorLeaderboard,
} from "@/lib/roadmap/queries";
import { Button } from "@/components/ui/button";
import { PaginatedList } from "@/components/paginated-list";
import { RoadmapItemCard } from "@/components/roadmap/roadmap-item-card";
import { RoadmapStatusFilter } from "@/components/roadmap/roadmap-status-filter";
import { RoadmapSortBar } from "@/components/roadmap/roadmap-sort-bar";
import { RoadmapViewToggle } from "@/components/roadmap/roadmap-view-toggle";
import { RoadmapKanbanView } from "@/components/roadmap/roadmap-kanban-view";
import { ContributorLeaderboard } from "@/components/roadmap/contributor-leaderboard";
import { SubmitIdeaButton } from "./submit-idea-button";

export const metadata = ogMeta(
  "Roadmap",
  "See what we're building, vote on features, and suggest ideas for Buildstory."
);

export default async function RoadmapPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await loadRoadmapParams(searchParams);
  const { userId } = await auth();

  let profileId: string | null = null;
  let isAdmin = false;
  if (userId) {
    const profile = await ensureProfile(userId);
    profileId = profile?.id ?? null;
    isAdmin = await checkIsModerator(userId);
  }

  const [statusCounts, categories] = await Promise.all([
    getStatusCounts(isAdmin),
    getFeatureBoardCategories(),
  ]);

  return (
    <div className="p-6 md:p-8 lg:p-12 w-full max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl text-foreground">Roadmap</h1>
          <p className="mt-2 text-muted-foreground">
            See what we&apos;re building. Vote on what matters to you.
          </p>
        </div>
        {userId ? (
          <SubmitIdeaButton categories={categories} />
        ) : (
          <Button asChild>
            <Link href="/sign-in">Sign in to suggest</Link>
          </Button>
        )}
      </div>

      <RoadmapViewToggle />

      {params.view === "contributors" ? (
        <ContributorsSection />
      ) : params.view === "kanban" ? (
        <KanbanSection
          profileId={profileId}
          isAuthenticated={!!userId}
          isAdmin={isAdmin}
        />
      ) : (
        <>
          <RoadmapStatusFilter counts={statusCounts} isAdmin={isAdmin} />
          <RoadmapSortBar />
          <ListSection
            params={params}
            profileId={profileId}
            isAdmin={isAdmin}
            isAuthenticated={!!userId}
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
}: {
  profileId: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}) {
  const items = await getKanbanItems(profileId, isAdmin);
  return (
    <RoadmapKanbanView
      items={items}
      isAuthenticated={isAuthenticated}
      isAdmin={isAdmin}
    />
  );
}

async function ListSection({
  params,
  profileId,
  isAdmin,
  isAuthenticated,
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
}) {
  const result = await getFeatureBoardItems({
    page: params.page,
    search: params.q || undefined,
    sort: params.sort,
    status: params.status,
    profileId,
    isAdmin,
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
          />
        ))}
      </div>
    </PaginatedList>
  );
}

async function ContributorsSection() {
  const [allTimeEntries, monthlyEntries] = await Promise.all([
    getContributorLeaderboard("all"),
    getContributorLeaderboard("month"),
  ]);

  return (
    <ContributorLeaderboard
      allTimeEntries={allTimeEntries}
      monthlyEntries={monthlyEntries}
    />
  );
}
