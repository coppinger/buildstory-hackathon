import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/admin/get-admin-session";
import { getAdminUserDetail } from "@/lib/admin/queries";
import { isSuperAdmin } from "@/lib/admin";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ObfuscatedField } from "@/components/admin/obfuscated-field";
import { UserDetailActions } from "./user-detail-actions";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/");

  const { id } = await params;
  const user = await getAdminUserDetail(id);
  if (!user) notFound();

  const superAdmin = isSuperAdmin(user.clerkId);

  function getRoleBadge(role: string) {
    switch (role) {
      case "admin":
        return "text-purple-400 bg-purple-400/10";
      case "moderator":
        return "text-blue-400 bg-blue-400/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="ghost" size="icon-xs">
            <Icon name="arrow_back" size="5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-heading text-3xl break-words">{user.displayName}</h1>
          <p className="text-sm text-muted-foreground">
            {user.username ? `@${user.username}` : "No username"}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Badge
            variant="outline"
            className={`text-xs ${getRoleBadge(user.role)}`}
          >
            {user.role}
            {superAdmin && " (super)"}
          </Badge>
          {user.bannedAt && (
            <Badge
              variant="outline"
              className="text-xs text-red-400 bg-red-400/10"
            >
              Banned
            </Badge>
          )}
          {user.hiddenAt && !user.bannedAt && (
            <Badge
              variant="outline"
              className="text-xs text-yellow-400 bg-yellow-400/10"
            >
              Hidden
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <Card className="lg:col-span-2 p-6 space-y-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Profile Details
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Display Name</p>
              <ObfuscatedField value={user.displayName} type="text" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Clerk ID</p>
              <ObfuscatedField value={user.clerkId} type="id" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Username</p>
              <span className="font-mono text-sm">
                {user.username ?? "Not set"}
              </span>
            </div>
            {user.country && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Country</p>
                <span className="text-sm">{user.country}</span>
                {user.region && (
                  <span className="text-sm text-muted-foreground">
                    {" "}
                    / {user.region}
                  </span>
                )}
              </div>
            )}
            {user.experienceLevel && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Experience Level
                </p>
                <span className="text-sm">
                  {user.experienceLevel.replace(/_/g, " ")}
                </span>
              </div>
            )}
            {user.bio && (
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Bio</p>
                <p className="text-sm break-words">{user.bio}</p>
              </div>
            )}
          </div>

          {/* Social links */}
          {(user.githubHandle ||
            user.twitterHandle ||
            user.websiteUrl ||
            user.twitchUrl) && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Links</p>
              <div className="flex flex-wrap gap-3 text-sm">
                {user.githubHandle && (
                  <span className="text-muted-foreground">
                    GitHub: {user.githubHandle}
                  </span>
                )}
                {user.twitterHandle && (
                  <span className="text-muted-foreground">
                    Twitter: {user.twitterHandle}
                  </span>
                )}
                {user.websiteUrl && (
                  <span className="text-muted-foreground">
                    Web: {user.websiteUrl}
                  </span>
                )}
                {user.twitchUrl && (
                  <span className="text-muted-foreground">
                    Twitch: {user.twitchUrl}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground pt-2 border-t border-border">
            Joined {new Date(user.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </Card>

        {/* Status + Actions */}
        <div className="space-y-6">
          {/* Ban/Hide Status */}
          {(user.bannedAt || user.hiddenAt) && (
            <Card className="p-6 space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Moderation Status
              </p>
              {user.bannedAt && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-red-400">Banned</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(user.bannedAt).toLocaleString()}
                  </p>
                  {user.bannedByName && (
                    <p className="text-xs text-muted-foreground">
                      By: {user.bannedByName}
                    </p>
                  )}
                  {user.banReason && (
                    <p className="text-sm mt-2 break-words">
                      Reason: {user.banReason}
                    </p>
                  )}
                </div>
              )}
              {user.hiddenAt && !user.bannedAt && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-yellow-400">Hidden</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(user.hiddenAt).toLocaleString()}
                  </p>
                  {user.hiddenByName && (
                    <p className="text-xs text-muted-foreground">
                      By: {user.hiddenByName}
                    </p>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Actions */}
          <Card className="p-6 space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Actions
            </p>
            <UserDetailActions
              profileId={user.id}
              displayName={user.displayName}
              username={user.username}
              bannedAt={user.bannedAt?.toISOString() ?? null}
              hiddenAt={user.hiddenAt?.toISOString() ?? null}
              currentRole={session.role}
            />
          </Card>
        </div>
      </div>

      {/* Registrations */}
      {user.eventRegistrations.length > 0 && (
        <Card className="p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Event Registrations
          </p>
          <div className="space-y-3">
            {user.eventRegistrations.map((reg) => (
              <div key={reg.id} className="flex items-center gap-3">
                <Icon
                  name="event"
                  size="4"
                  className="text-muted-foreground"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{reg.event.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {reg.teamPreference.replace(/_/g, " ")}
                    {reg.commitmentLevel &&
                      ` \u00B7 ${reg.commitmentLevel.replace(/_/g, " ")}`}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(reg.registeredAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Projects */}
      {user.projects.length > 0 && (
        <Card className="p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Projects
          </p>
          <div className="space-y-3">
            {user.projects.map((project) => (
              <div key={project.id} className="flex items-center gap-3">
                <Icon
                  name="folder"
                  size="4"
                  className="text-muted-foreground"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{project.name}</p>
                  {project.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {project.description}
                    </p>
                  )}
                </div>
                {project.slug && (
                  <Link
                    href={`/projects/${project.slug}`}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    View
                  </Link>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
