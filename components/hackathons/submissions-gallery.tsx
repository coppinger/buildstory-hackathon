import { SubmissionCard } from "@/components/submissions/submission-card";

interface SubmissionsGalleryProps {
  items: {
    submission: {
      whatBuilt: string;
      demoUrl: string | null;
      demoMediaUrl: string | null;
      demoMediaType: string | null;
      lessonLearned: string | null;
    };
    profile: {
      displayName: string;
      username: string | null;
      avatarUrl: string | null;
      country: string | null;
    };
    project: {
      name: string;
      slug: string | null;
    };
    tools: { id: string; name: string }[];
  }[];
  totalCount: number;
  page: number;
  totalPages: number;
  basePath: string;
}

export function SubmissionsGallery({
  items,
  totalCount,
  page,
  totalPages,
  basePath,
}: SubmissionsGalleryProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground font-mono">
          No submissions yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        {totalCount} {totalCount === 1 ? "submission" : "submissions"}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {items.map((item, i) => (
          <SubmissionCard
            key={item.project.slug ?? i}
            submission={item.submission}
            profile={item.profile}
            project={item.project}
            tools={item.tools}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          {page > 1 && (
            <a
              href={`${basePath}?page=${page - 1}`}
              className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
            >
              &larr; Previous
            </a>
          )}
          <span className="text-xs font-mono text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`${basePath}?page=${page + 1}`}
              className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
            >
              Next &rarr;
            </a>
          )}
        </div>
      )}
    </div>
  );
}
