"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

const DEPLOYMENT_SKEW_PATTERN = /failed to find server action/i;

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
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
    return (
      <html>
        <body />
      </html>
    );
  }

  return (
    <html>
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
