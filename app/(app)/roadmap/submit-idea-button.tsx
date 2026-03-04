"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { SubmitIdeaDialog } from "@/components/roadmap/submit-idea-dialog";
import type { FeatureBoardCategoryOption } from "@/lib/roadmap/queries";

interface SubmitIdeaButtonProps {
  categories: FeatureBoardCategoryOption[];
  /** Optional project ID for project-scoped ideas */
  projectId?: string;
}

export function SubmitIdeaButton({ categories, projectId }: SubmitIdeaButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-1.5">
        <Icon name="add" size="4" />
        Suggest idea
      </Button>
      <SubmitIdeaDialog
        open={open}
        onOpenChange={setOpen}
        categories={categories}
        projectId={projectId}
      />
    </>
  );
}
