import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { ensureProfile } from "@/lib/db/ensure-profile";
import { isModerator as checkIsModerator } from "@/lib/admin";
import { ogMeta, notFoundMeta } from "@/lib/metadata";
import {
  getFeatureBoardItemBySlug,
  getCommentsForItem,
} from "@/lib/roadmap/queries";
import { StatusBadge } from "@/components/roadmap/status-badge";
import { UpvoteButton } from "@/components/roadmap/upvote-button";
import { AdminItemControls } from "@/components/roadmap/admin-item-controls";
import { CommentSection } from "@/components/roadmap/comment-section";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Badge } from "@/components/ui/badge";
import { MarkdownText } from "@/components/ui/markdown-text";
import { Icon } from "@/components/ui/icon";
import { timeAgo } from "@/lib/time";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await getFeatureBoardItemBySlug(slug);
  if (!item) return notFoundMeta;
  if (item.status === "inbox" || item.status === "closed" || item.status === "archived") {
    return notFoundMeta;
  }
  return ogMeta(
    item.title,
    item.description ?? "Feature request on Buildstory"
  );
}

export default async function RoadmapItemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { userId } = await auth();

  let profileId: string | null = null;
  let isAdmin = false;
  if (userId) {
    const profile = await ensureProfile(userId);
    profileId = profile?.id ?? null;
    isAdmin = await checkIsModerator(userId);
  }

  const item = await getFeatureBoardItemBySlug(slug, profileId);
  if (!item) notFound();

  // Hide inbox/closed/archived items from non-admins
  if (
    (item.status === "inbox" || item.status === "closed" || item.status === "archived") &&
    !isAdmin
  ) {
    notFound();
  }

  const comments = await getCommentsForItem(item.id);

  return (
    <div className="p-6 md:p-8 lg:p-12 w-full max-w-3xl">
      <Link
        href="/roadmap"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors font-mono"
      >
        <Icon name="arrow_back" size="3.5" />
        Back to roadmap
      </Link>

      <div className="mt-6 flex items-start gap-4">
        <UpvoteButton
          itemId={item.id}
          count={item.upvoteCount}
          hasUpvoted={item.hasUpvoted}
          isAuthenticated={!!userId}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={item.status} />
            {item.category && (
              <Badge variant="outline" className="text-xs">
                {item.category.name}
              </Badge>
            )}
          </div>
          <h1 className="mt-2 font-heading text-3xl text-foreground">
            {item.title}
          </h1>
        </div>
      </div>

      {item.description && (
        <div className="mt-6">
          <MarkdownText text={item.description} />
        </div>
      )}

      <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
        <UserAvatar
          avatarUrl={item.author.avatarUrl}
          displayName={item.author.displayName}
          size="xs"
        />
        <span>{item.author.displayName}</span>
        <span>&middot;</span>
        <span>{timeAgo(item.createdAt)}</span>
        {item.commentCount > 0 && (
          <>
            <span>&middot;</span>
            <span className="flex items-center gap-0.5">
              <Icon name="chat_bubble" size="3.5" />
              {item.commentCount} comments
            </span>
          </>
        )}
      </div>

      {item.shippedAt && (
        <div className="mt-4 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <Icon name="check_circle" size="4" />
          Shipped {timeAgo(item.shippedAt)}
          <span className="text-muted-foreground">&middot;</span>
          <span className="text-muted-foreground">
            Suggested by{" "}
            <Link
              href={
                item.author.username
                  ? `/profiles/${item.author.username}`
                  : "#"
              }
              className="text-foreground hover:underline"
            >
              {item.author.displayName}
            </Link>
          </span>
        </div>
      )}

      {isAdmin && (
        <AdminItemControls
          item={{
            id: item.id,
            status: item.status,
            internalNotes: item.internalNotes,
            linearIssueId: item.linearIssueId,
            linearIssueUrl: item.linearIssueUrl,
            title: item.title,
            description: item.description,
            slug: item.slug,
            upvoteCount: item.upvoteCount,
            commentCount: item.commentCount,
            authorDisplayName: item.author.displayName,
          }}
        />
      )}

      <CommentSection
        comments={comments}
        itemId={item.id}
        currentProfileId={profileId}
        isAdmin={isAdmin}
        isAuthenticated={!!userId}
        serverNow={comments.fetchedAt}
      />
    </div>
  );
}
