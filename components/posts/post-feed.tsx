import type { PostWithAuthor } from "@/lib/content/queries";
import { PostCard } from "@/components/posts/post-card";

export function PostFeed({
  posts,
  reactionSummaries,
  userReactionsMap,
  currentUserProfileId,
  contextType,
}: {
  posts: PostWithAuthor[];
  reactionSummaries: Map<string, Record<string, number>>;
  userReactionsMap: Map<string, string[]>;
  currentUserProfileId: string | null;
  contextType: "project" | "tool";
}) {
  if (posts.length === 0) {
    return (
      <div className="border border-dashed border-border/40 py-10 text-center">
        <p className="text-sm text-muted-foreground/60">
          No posts yet. Be the first to share an update.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          reactionSummary={reactionSummaries.get(post.id)}
          userReactions={userReactionsMap.get(post.id)}
          currentUserProfileId={currentUserProfileId}
          contextType={contextType}
        />
      ))}
    </div>
  );
}
