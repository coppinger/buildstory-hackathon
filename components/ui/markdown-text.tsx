import { renderMarkdown } from "@/lib/markdown";
import { cn } from "@/lib/utils";

interface MarkdownTextProps {
  text: string;
  className?: string;
}

export function MarkdownText({ text, className }: MarkdownTextProps) {
  return (
    <div
      className={cn("markdown-content", className)}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
    />
  );
}
