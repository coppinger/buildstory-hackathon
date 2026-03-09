import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { ensureProfile } from "@/lib/db/ensure-profile";
import { isAdmin, canAccessAdmin } from "@/lib/admin";

const PROFILE_COOKIE = "bs_profile";

export const proxy = clerkMiddleware(async (auth, request) => {
  // Redirect /event/* to landing page
  if (request.nextUrl.pathname.startsWith("/event")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Redirect /profiles/* to /members/*
  if (request.nextUrl.pathname.startsWith("/profiles")) {
    const newPath = request.nextUrl.pathname.replace(/^\/profiles/, "/members");
    return NextResponse.redirect(new URL(newPath, request.url));
  }

  const { userId } = await auth();

  // Signed-in users visiting the landing page → dashboard
  if (userId && request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users from app routes to landing page
  const appRoutes = ["/dashboard", "/projects", "/members", "/streamers", "/settings", "/hackathon", "/invite"];
  if (!userId && appRoutes.some((r) => request.nextUrl.pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const cookie = request.cookies.get(PROFILE_COOKIE);
  const cookieMatchesUser = cookie?.value.startsWith(`${userId}:`);

  if (userId && !cookieMatchesUser) {
    try {
      const profile = await ensureProfile(userId);
      if (profile) {
        // Banned users get redirected
        if (profile.bannedAt) {
          return NextResponse.redirect(new URL("/banned", request.url));
        }

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
    if (!userId) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    // Studio: admin only. Admin panel: admin + moderator.
    const hasAccess = request.nextUrl.pathname.startsWith("/studio")
      ? await isAdmin(userId)
      : await canAccessAdmin(userId);
    if (!hasAccess) {
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
