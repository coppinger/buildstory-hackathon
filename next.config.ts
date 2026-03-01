import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "img.clerk.com" },
      { hostname: "images.clerk.dev" },
      { hostname: "cdn.sanity.io" },
    ],
  },
  experimental: {
    // Propagate tracing headers for pageload performance monitoring
    clientTraceMetadata: ["sentry-trace", "baggage"],
  },
  // Sanity Studio ships ESM-only packages
  transpilePackages: ["sanity", "next-sanity", "@sanity/vision"],
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Route client-side Sentry events through your server to avoid ad-blockers
  tunnelRoute: "/monitoring",

  silent: !process.env.CI,
  widenClientFileUpload: true,

  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Exclude Sanity Studio from Sentry's server-side wrapping
  excludeServerRoutes: ["/studio", "/studio/(.*)"],
});
