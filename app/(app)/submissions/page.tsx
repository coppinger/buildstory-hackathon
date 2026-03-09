import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { HACKATHON_SLUG } from "@/lib/constants";
import { getEventSubmissions } from "@/lib/queries";
import { SubmissionCard } from "@/components/submissions/submission-card";

export const metadata: Metadata = {
  title: "Submissions",
};

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const event = await db.query.events.findFirst({
    where: eq(events.slug, HACKATHON_SLUG),
  });

  if (!event) {
    return (
      <div className="p-6 md:p-8 lg:p-12 w-full">
        <p className="text-muted-foreground">No event found.</p>
      </div>
    );
  }

  const result = await getEventSubmissions(event.id, page);

  return (
    <div className="p-6 md:p-8 lg:p-12 w-full">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono mb-2">
          Hackathon 00
        </p>
        <h1 className="font-heading text-3xl md:text-4xl text-foreground">
          Submissions
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {result.totalCount}{" "}
          {result.totalCount === 1 ? "project" : "projects"} submitted
        </p>
      </div>

      {result.items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-sm text-muted-foreground font-mono">
            No submissions yet. Be the first!
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {result.items.map((item) => (
              <SubmissionCard
                key={item.submission.id}
                submission={item.submission}
                profile={item.profile}
                project={item.project}
                tools={item.tools}
              />
            ))}
          </div>

          {/* Pagination */}
          {result.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              {result.page > 1 && (
                <a
                  href={`/submissions?page=${result.page - 1}`}
                  className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
                >
                  &larr; Previous
                </a>
              )}
              <span className="text-xs font-mono text-muted-foreground">
                Page {result.page} of {result.totalPages}
              </span>
              {result.page < result.totalPages && (
                <a
                  href={`/submissions?page=${result.page + 1}`}
                  className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
                >
                  Next &rarr;
                </a>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
