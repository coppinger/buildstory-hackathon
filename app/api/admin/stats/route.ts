import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import {
  getDashboardStats,
  getSignupsOverTime,
  getRecentActivity,
} from "@/lib/admin/queries";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId || !isAdmin(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const eventId = request.nextUrl.searchParams.get("eventId");
  if (!eventId) {
    return NextResponse.json(
      { error: "eventId is required" },
      { status: 400 }
    );
  }

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
}
