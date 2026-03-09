import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { ToolWithUsage } from "@/lib/content/queries";

export function ToolCard({ tool }: { tool: ToolWithUsage }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group block border border-border p-4 hover:border-foreground/20 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium text-foreground group-hover:text-buildstory-500 transition-colors truncate">
            {tool.name}
          </h3>
          {tool.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {tool.description}
            </p>
          )}
        </div>
        <Badge variant="outline" className="shrink-0 text-xs">
          {tool.category}
        </Badge>
      </div>
      <p className="mt-2 text-xs text-muted-foreground font-mono">
        {tool.usageCount} {tool.usageCount === 1 ? "project" : "projects"}
      </p>
    </Link>
  );
}
