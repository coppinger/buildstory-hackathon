import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface HighlightCtaCardProps {
  title: string;
  description: ReactNode;
  ctaHref: string;
  ctaLabel: string;
}

export function HighlightCtaCard({
  title,
  description,
  ctaHref,
  ctaLabel,
}: HighlightCtaCardProps) {
  return (
    <Card className="relative w-full p-0! min-h-64 flex flex-col justify-end">
      <Image
        src="/highlight-card-bg.jpg"
        alt=""
        fill
        sizes="(min-width: 1280px) 66vw, 100vw"
        className="object-cover"
      />
      <div className="relative backdrop-blur-md bg-background/30 px-6 py-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm text-white/80">{description}</p>
        </div>
        <Button
          asChild
          className="shrink-0 bg-white text-black hover:bg-white/90 text-sm"
          size="lg"
        >
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      </div>
    </Card>
  );
}
