import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getFeaturedEventId } from "@/lib/queries";
import { ProjectForm } from "@/components/projects/project-form";

export const metadata: Metadata = {
  title: "New Project",
};

export default async function NewProjectPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const eventId = await getFeaturedEventId();

  return (
    <div className="p-6 md:p-8 lg:p-12 w-full max-w-2xl">
      <Link
        href="/projects"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors font-mono"
      >
        &larr; Back to projects
      </Link>

      <h1 className="mt-6 font-heading text-3xl text-foreground">
        New project
      </h1>
      <p className="mt-2 text-muted-foreground">
        Add a new project to your portfolio.
      </p>

      <div className="mt-8">
        <ProjectForm mode="create" eventId={eventId ?? undefined} />
      </div>
    </div>
  );
}
