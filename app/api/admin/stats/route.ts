import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { canAccessAdmin } from "@/lib/admin";
import {
  getDashboardStats,
  getSignupsOverTime,
  getRecentActivity,
} from "@/lib/admin/queries";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId || !(await canAccessAdmin(userId))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const eventId = request.nextUrl.searchParams.get("eventId");
  if (!eventId) {
    return NextResponse.json(
      { error: "eventId is required" },
      { status: 400 }
    );
  }

  try {
    const [stats, signupsOverTime, recentActivity] = await Promise.all([
      getDashboardStats(eventId),
      getSignupsOverTime(eventId),
      getRecentActivity(eventId, 20),
    ]);

    const serializedActivity = recentActivity.map((a) => ({
      ...a,
      timestamp: a.timestamp.toISOString(),
    }));

    return NextResponse.json({
      stats,
      signupsOverTime,
      recentActivity: serializedActivity,
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "api-route", action: "admin-stats" },
      extra: { eventId },
    });
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
