import type { Metadata } from "next";
import { getAllToolsWithUsage } from "@/lib/content/queries";
import { ToolCard } from "@/components/tools/tool-card";

export const metadata: Metadata = {
  title: "Tools",
};

export default async function ToolsPage() {
  const tools = await getAllToolsWithUsage();

  // Group by category
  const grouped = new Map<string, typeof tools>();
  for (const tool of tools) {
    const list = grouped.get(tool.category) ?? [];
    list.push(tool);
    grouped.set(tool.category, list);
  }

  const categories = [...grouped.keys()].sort();

  return (
    <div className="p-6 md:p-8 lg:p-12 w-full max-w-3xl">
      <h1 className="font-heading text-3xl md:text-4xl text-foreground">
        Tools
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        AI tools used by the community, tagged from real hackathon projects.
      </p>

      {tools.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono mb-3">
            No tools yet
          </p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Tools will appear here once projects start submitting.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {categories.map((category) => (
            <section key={category}>
              <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono mb-3">
                {category}
              </h2>
              <div className="grid gap-2">
                {grouped.get(category)!.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
