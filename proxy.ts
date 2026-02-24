import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ensureProfile } from "@/lib/db/ensure-profile";

const PROFILE_COOKIE = "bs_profile";

export const proxy = clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();

  if (userId && !request.cookies.get(PROFILE_COOKIE)) {
    const profile = await ensureProfile(userId);
    if (profile) {
      const response = NextResponse.next();
      response.cookies.set(PROFILE_COOKIE, profile.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
      return response;
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
