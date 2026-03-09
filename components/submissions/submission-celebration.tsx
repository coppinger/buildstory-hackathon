"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { fireConfetti } from "@/components/ui/confetti";

interface SubmissionCelebrationProps {
  projectName: string;
  projectSlug: string;
  whatBuilt: string;
  ogImageUrl: string;
}

export function SubmissionCelebration({
  projectName,
  projectSlug,
  whatBuilt,
  ogImageUrl,
}: SubmissionCelebrationProps) {
  useEffect(() => {
    fireConfetti();
    const timer = setTimeout(fireConfetti, 500);
    return () => clearTimeout(timer);
  }, []);

  const projectUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/projects/${projectSlug}`;
  const tweetText = `I just shipped ${projectName} for Hackathon 00!\n\n${whatBuilt}\n\n#Buildstory\n${projectUrl}`;

  const handleDownload = async () => {
    try {
      const res = await fetch(ogImageUrl);
      if (!res.ok) throw new Error("Failed to fetch image");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectSlug}-submission.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(ogImageUrl, "_blank");
    }
  };

  const handleShareX = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-mono">
          Submitted
        </p>
        <h1 className="font-heading text-4xl sm:text-5xl text-foreground italic">
          You shipped it.
        </h1>
      </div>

      {/* Share image preview */}
      <div className="border border-border overflow-hidden">
        <img
          src={ogImageUrl}
          alt={`${projectName} submission card`}
          className="w-full aspect-[1200/675] object-cover"
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 h-11 font-mono text-sm"
          onClick={handleDownload}
        >
          <Icon name="download" size="4" />
          Download image
        </Button>
        <Button
          className="flex-1 h-11 font-mono text-sm bg-foreground text-background hover:bg-buildstory-500"
          onClick={handleShareX}
        >
          Share on X
        </Button>
      </div>

      {/* View project link */}
      <div className="text-center">
        <Link
          href={`/projects/${projectSlug}`}
          className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          View your project &rarr;
        </Link>
      </div>
    </div>
  );
}
