import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Badge } from "@/components/ui/badge";
import { getToolBySlug, getPostsByContext, getReactionSummaries, getUserReactions } from "@/lib/content/queries";
import { ensureProfile } from "@/lib/db/ensure-profile";
import { ogMeta, notFoundMeta } from "@/lib/metadata";
import { PostFeed } from "@/components/posts/post-feed";
import { CreatePostForm } from "@/components/posts/create-post-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) return notFoundMeta;
  return ogMeta(tool.name, tool.description ?? `${tool.name} — AI tool used by the community`);
}

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);

  if (!tool) notFound();

  // Auth check
  let currentUserProfileId: string | null = null;
  const { userId } = await auth();
  if (userId) {
    const profile = await ensureProfile(userId);
    if (profile) {
      currentUserProfileId = profile.id;
    }
  }

  // Fetch posts for this tool
  const postData = await getPostsByContext("tool", tool.id);
  const postIds = postData.items.map((p) => p.id);
  const [reactionSummaries, userReactionsMap] = await Promise.all([
    postIds.length > 0
      ? getReactionSummaries("post", postIds)
      : Promise.resolve(new Map<string, Record<string, number>>()),
    currentUserProfileId && postIds.length > 0
      ? getUserReactions(currentUserProfileId, "post", postIds)
      : Promise.resolve(new Map<string, string[]>()),
  ]);

  return (
    <div className="p-6 md:p-8 lg:p-12 w-full max-w-3xl">
      <Link
        href="/tools"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors font-mono"
      >
        &larr; Back to tools
      </Link>

      <div className="mt-6 flex items-start gap-4">
        <div className="min-w-0">
          <h1 className="font-heading text-3xl md:text-4xl text-foreground break-words">
            {tool.name}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline">{tool.category}</Badge>
            <span className="text-sm text-muted-foreground font-mono">
              {tool.usageCount} {tool.usageCount === 1 ? "project" : "projects"}
            </span>
          </div>
        </div>
      </div>

      {tool.description && (
        <p className="mt-4 text-base text-muted-foreground leading-relaxed">
          {tool.description}
        </p>
      )}

      {/* Projects using this tool */}
      {tool.projects.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono mb-4">
            Projects using {tool.name}
          </h2>
          <div className="grid gap-2">
            {tool.projects.map((project) => (
              <Link
                key={project.id}
                href={project.slug ? `/projects/${project.slug}` : "#"}
                className="block border border-border p-4 hover:border-foreground/20 transition-colors"
              >
                <p className="font-medium text-foreground">{project.name}</p>
                {project.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  by {project.owner.displayName}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Discussion */}
      <section className="mt-10">
        <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono mb-4">
          Discussion
        </h2>
        {currentUserProfileId && (
          <div className="mb-3">
            <CreatePostForm contextType="tool" contextId={tool.id} />
          </div>
        )}
        <PostFeed
          posts={postData.items}
          reactionSummaries={reactionSummaries}
          userReactionsMap={userReactionsMap}
          currentUserProfileId={currentUserProfileId}
          contextType="tool"
        />
      </section>
    </div>
  );
}
