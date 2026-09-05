"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

const DEPLOYMENT_SKEW_PATTERN = /failed to find server action/i;

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isDeploymentSkew =
    DEPLOYMENT_SKEW_PATTERN.test(error.message) ||
    DEPLOYMENT_SKEW_PATTERN.test(error.digest ?? "");

  useEffect(() => {
    if (isDeploymentSkew) {
      window.location.reload();
      return;
    }
    Sentry.captureException(error);
  }, [error, isDeploymentSkew]);

  if (isDeploymentSkew) {
    return null;
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-4">
        <h2 className="font-heading text-2xl">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="text-sm underline underline-offset-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
