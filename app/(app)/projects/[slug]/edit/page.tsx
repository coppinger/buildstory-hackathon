import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ensureProfile } from "@/lib/db/ensure-profile";
import { getProjectBySlug } from "@/lib/queries";
import { ProjectForm } from "@/components/projects/project-form";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const profile = await ensureProfile(userId);
  if (!profile) redirect("/sign-in");

  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  // Ownership check
  if (project.profile.id !== profile.id) {
    redirect(`/projects/${slug}`);
  }

  return (
    <div className="p-6 md:p-8 lg:p-12 w-full max-w-2xl">
      <Link
        href={`/projects/${slug}`}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors font-mono"
      >
        &larr; Back to project
      </Link>

      <h1 className="mt-6 font-heading text-3xl text-foreground">
        Edit project
      </h1>
      <p className="mt-2 text-muted-foreground">
        Update your project details.
      </p>

      <div className="mt-8">
        <ProjectForm
          mode="edit"
          project={{
            id: project.id,
            name: project.name,
            slug: project.slug,
            description: project.description,
            startingPoint: project.startingPoint,
            goalText: project.goalText,
            githubUrl: project.githubUrl,
            liveUrl: project.liveUrl,
          }}
        />
      </div>
    </div>
  );
}
