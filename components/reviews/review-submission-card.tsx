"use client";

import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCountryName } from "@/lib/countries";

interface ReviewSubmissionCardProps {
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
    description: string | null;
    githubUrl: string | null;
    liveUrl: string | null;
  };
  tools: { id: string; name: string }[];
}

export function ReviewSubmissionCard({
  submission,
  profile,
  project,
  tools,
}: ReviewSubmissionCardProps) {
  return (
    <Card className="w-full flex flex-col gap-4">
      {/* Builder info */}
      <div className="flex items-center gap-3">
        {profile.avatarUrl ? (
          <Image
            src={profile.avatarUrl}
            alt={profile.displayName}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
            {profile.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          {profile.username ? (
            <Link
              href={`/members/${profile.username}`}
              className="text-sm font-medium text-foreground hover:text-buildstory-500 transition-colors truncate block"
            >
              {profile.displayName}
            </Link>
          ) : (
            <span className="text-sm font-medium text-foreground truncate block">
              {profile.displayName}
            </span>
          )}
          {profile.country && (
            <p className="text-xs text-muted-foreground">
              {getCountryName(profile.country)}
            </p>
          )}
        </div>
      </div>

      {/* Project name */}
      <p className="text-lg font-heading text-foreground break-words">
        {project.name}
      </p>

      {/* What they built */}
      <p className="text-sm text-muted-foreground">{submission.whatBuilt}</p>

      {/* Project description */}
      {project.description && (
        <p className="text-sm text-muted-foreground/80 line-clamp-3">
          {project.description}
        </p>
      )}

      {/* Demo media */}
      {submission.demoMediaUrl && submission.demoMediaType === "image" && (
        <div className="relative w-full aspect-video bg-muted overflow-hidden">
          <Image
            src={submission.demoMediaUrl}
            alt={`${project.name} demo`}
            fill
            className="object-cover"
          />
        </div>
      )}
      {submission.demoMediaUrl && submission.demoMediaType === "video" && (
        <video
          src={submission.demoMediaUrl}
          controls
          className="w-full aspect-video bg-muted"
        />
      )}

      {/* Tools */}
      {tools.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tools.map((tool) => (
            <Badge key={tool.id} variant="secondary" className="text-xs">
              {tool.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Lesson learned */}
      {submission.lessonLearned && (
        <div>
          <p className="text-xs font-mono text-muted-foreground mb-1">Lesson learned</p>
          <p className="text-sm text-foreground/90 italic">
            &ldquo;{submission.lessonLearned}&rdquo;
          </p>
        </div>
      )}

      {/* Links */}
      <div className="flex items-center gap-3 pt-1">
        {submission.demoUrl && (
          <a
            href={submission.demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-buildstory-500 hover:text-foreground transition-colors"
          >
            Demo &rarr;
          </a>
        )}
        {project.githubUrl && (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            GitHub &rarr;
          </a>
        )}
        {project.liveUrl && (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            Live &rarr;
          </a>
        )}
        {project.slug && (
          <Link
            href={`/projects/${project.slug}`}
            className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            Project &rarr;
          </Link>
        )}
      </div>
    </Card>
  );
}
