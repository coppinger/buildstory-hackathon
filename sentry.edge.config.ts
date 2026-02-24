import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance: sample 100% in dev, 10% in prod
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  debug: false,
});
