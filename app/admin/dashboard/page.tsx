import {
  getHackathonEvent,
  getDashboardStats,
  getSignupsOverTime,
  getRecentActivity,
} from "@/lib/admin/queries";
import { AdminDashboardClient } from "./admin-dashboard-client";

export default async function AdminDashboardPage() {
  const event = await getHackathonEvent();
  if (!event) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-lg">No hackathon event found.</p>
        <p className="text-sm mt-1">
          Create an event with slug &quot;hackathon-00&quot; to get started.
        </p>
      </div>
    );
  }

  const [stats, signupsOverTime, recentActivity] = await Promise.all([
    getDashboardStats(event.id),
    getSignupsOverTime(event.id),
    getRecentActivity(event.id, 20),
  ]);

  const serializedActivity = recentActivity.map((a) => ({
    ...a,
    timestamp: a.timestamp.toISOString(),
  }));

  return (
    <AdminDashboardClient
      eventId={event.id}
      eventName={event.name}
      initialStats={stats}
      initialSignupsOverTime={signupsOverTime}
      initialRecentActivity={serializedActivity}
    />
  );
}
