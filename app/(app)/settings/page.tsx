import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ensureProfile } from "@/lib/db/ensure-profile";
import { ProfileForm } from "@/components/settings/profile-form";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const profile = await ensureProfile(userId);
  if (!profile) redirect("/sign-in");

  return (
    <div className="p-8 lg:p-12 w-full max-w-2xl">
      <h1 className="font-heading text-3xl text-foreground">Settings</h1>
      <p className="mt-2 text-muted-foreground text-sm">
        Update your profile information.
      </p>

      <div className="mt-8">
        <ProfileForm profile={profile} />
      </div>
    </div>
  );
}
