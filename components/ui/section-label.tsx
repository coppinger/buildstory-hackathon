import * as React from "react";

import { cn } from "@/lib/utils";

function SectionLabel({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="section-label"
      className={cn(
        "text-xs uppercase tracking-[0.2em] font-semibold text-foreground/60",
        className
      )}
      {...props}
    />
  );
}

export { SectionLabel };
