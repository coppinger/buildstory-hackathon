import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { ensureProfile } from "@/lib/db/ensure-profile";
import { isAdmin } from "@/lib/admin";

const PROFILE_COOKIE = "bs_profile";

export const proxy = clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();

  // Signed-in users visiting the landing page → dashboard
  if (userId && request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const cookie = request.cookies.get(PROFILE_COOKIE);
  const cookieMatchesUser = cookie?.value.startsWith(`${userId}:`);

  if (userId && !cookieMatchesUser) {
    try {
      const profile = await ensureProfile(userId);
      if (profile) {
        const response = NextResponse.next();
        response.cookies.set(PROFILE_COOKIE, `${userId}:${profile.id}`, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 365, // 1 year
        });
        return response;
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: "middleware", action: "ensure-profile" },
        extra: { clerkId: userId },
      });
      // Don't block the request — profile will be retried on next page load
      // since the cookie was not set
    }
  }

  // Admin route protection
  if (
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/studio")
  ) {
    if (!userId || !isAdmin(userId)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals, static files, and Sentry tunnel
    "/((?!_next|monitoring|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
