"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { CountryCombobox } from "@/components/settings/country-combobox";
import { RegionCombobox } from "@/components/settings/region-combobox";
import { updateProfile } from "@/app/(app)/settings/actions";
import { checkUsernameAvailability } from "@/app/(onboarding)/hackathon/actions";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/db/schema";

interface ProfileFormProps {
  profile: Profile;
}

const USERNAME_REGEX = /^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$/;

const experienceOptions = [
  {
    value: "getting_started",
    label: "Just getting started",
    description: "New to building with AI",
  },
  {
    value: "built_a_few",
    label: "Built a few things",
    description: "Shipped a project or two",
  },
  {
    value: "ships_constantly",
    label: "Ships constantly",
    description: "Building with AI daily",
  },
] as const;

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [username, setUsername] = useState(profile.username ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [country, setCountry] = useState(profile.country ?? "");
  const [region, setRegion] = useState(profile.region ?? "");
  const [experienceLevel, setExperienceLevel] = useState<string | null>(
    profile.experienceLevel
  );
  const [websiteUrl, setWebsiteUrl] = useState(profile.websiteUrl ?? "");
  const [twitterHandle, setTwitterHandle] = useState(
    profile.twitterHandle ?? ""
  );
  const [githubHandle, setGithubHandle] = useState(
    profile.githubHandle ?? ""
  );
  const [twitchUrl, setTwitchUrl] = useState(profile.twitchUrl ?? "");
  const [streamUrl, setStreamUrl] = useState(profile.streamUrl ?? "");
  const [allowInvites, setAllowInvites] = useState(profile.allowInvites);

  // Username availability
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");

  // Form feedback
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Debounced username check
  const checkUsername = useCallback(
    (value: string) => {
      const trimmed = value.trim().toLowerCase();

      if (!trimmed) {
        setUsernameStatus("idle");
        return;
      }

      if (!USERNAME_REGEX.test(trimmed)) {
        setUsernameStatus("invalid");
        return;
      }

      // If username hasn't changed from current, it's fine
      if (trimmed === profile.username) {
        setUsernameStatus("available");
        return;
      }

      setUsernameStatus("checking");

      checkUsernameAvailability(trimmed).then((result) => {
        if (result.success && result.data) {
          setUsernameStatus(result.data.available ? "available" : "taken");
        } else {
          setUsernameStatus("idle");
        }
      });
    },
    [profile.username]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      checkUsername(username);
    }, 400);
    return () => clearTimeout(timer);
  }, [username, checkUsername]);

  // Clear region when country changes
  useEffect(() => {
    if (country !== profile.country) {
      setRegion("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]);

  // Clear success message after a delay
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!displayName.trim()) {
      setError("Display name is required");
      return;
    }

    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    if (usernameStatus === "taken") {
      setError("Username is already taken");
      return;
    }

    if (usernameStatus === "invalid") {
      setError("Username format is invalid");
      return;
    }

    startTransition(async () => {
      const result = await updateProfile({
        displayName,
        username,
        bio: bio || null,
        websiteUrl: websiteUrl || null,
        twitterHandle: twitterHandle || null,
        githubHandle: githubHandle || null,
        twitchUrl: twitchUrl || null,
        streamUrl: streamUrl || null,
        country: country || null,
        region: region || null,
        experienceLevel: experienceLevel as
          | "getting_started"
          | "built_a_few"
          | "ships_constantly"
          | null,
        allowInvites,
      });

      if (result.success) {
        setSuccess(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Identity section */}
      <section className="space-y-4">
        <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Identity
        </h2>

        <div className="space-y-1.5">
          <Label htmlFor="displayName" className="text-sm font-medium">
            Display name
          </Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="username" className="text-sm font-medium">
            Username
          </Label>
          <div className="relative">
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="your-username"
              required
            />
            {usernameStatus !== "idle" && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameStatus === "checking" && (
                  <Icon
                    name="progress_activity"
                    size="3.5"
                    className="text-muted-foreground animate-spin"
                  />
                )}
                {usernameStatus === "available" && (
                  <Icon
                    name="check_circle"
                    size="3.5"
                    className="text-green-600"
                  />
                )}
                {usernameStatus === "taken" && (
                  <Icon
                    name="cancel"
                    size="3.5"
                    className="text-destructive"
                  />
                )}
                {usernameStatus === "invalid" && (
                  <Icon
                    name="error"
                    size="3.5"
                    className="text-destructive"
                  />
                )}
              </div>
            )}
          </div>
          {usernameStatus === "taken" && (
            <p className="text-xs text-destructive">
              This username is already taken
            </p>
          )}
          {usernameStatus === "invalid" && (
            <p className="text-xs text-destructive">
              3-30 characters, lowercase letters, numbers, hyphens, and
              underscores. Must start and end with a letter or number.
            </p>
          )}
          {usernameStatus === "available" &&
            username !== profile.username && (
              <p className="text-xs text-green-600">Username is available</p>
            )}
        </div>
      </section>

      {/* About section */}
      <section className="space-y-4">
        <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          About
        </h2>

        <div className="space-y-1.5">
          <Label htmlFor="bio" className="text-sm font-medium">
            Bio
          </Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell others about yourself..."
            rows={3}
          />
        </div>
      </section>

      {/* Location section */}
      <section className="space-y-4">
        <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Location
        </h2>

        <CountryCombobox value={country} onChange={setCountry} />
        {country && (
          <RegionCombobox
            countryCode={country}
            value={region}
            onChange={setRegion}
          />
        )}
      </section>

      {/* Experience section */}
      <section className="space-y-4">
        <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Experience
        </h2>

        <div className="grid gap-3">
          {experienceOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setExperienceLevel(option.value)}
              className={cn(
                "border p-4 text-left transition-colors cursor-pointer",
                experienceLevel === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-foreground/20"
              )}
            >
              <p className="text-base font-medium text-foreground">
                {option.label}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {option.description}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Privacy section */}
      <section className="space-y-4">
        <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Privacy
        </h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">
              Allow team invites
            </p>
            <p className="text-sm text-muted-foreground">
              Other builders can send you invites to join their projects
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={allowInvites}
            onClick={() => setAllowInvites(!allowInvites)}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
              allowInvites ? "bg-primary" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-sm transition-transform",
                allowInvites ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>
      </section>

      {/* Social links section */}
      <section className="space-y-4">
        <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Social links
        </h2>

        <div className="space-y-1.5">
          <Label htmlFor="websiteUrl" className="text-sm font-medium">
            Website
          </Label>
          <Input
            id="websiteUrl"
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://yoursite.com"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="twitterHandle" className="text-sm font-medium">
            X / Twitter
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              @
            </span>
            <Input
              id="twitterHandle"
              value={twitterHandle}
              onChange={(e) =>
                setTwitterHandle(e.target.value.replace(/^@/, ""))
              }
              placeholder="handle"
              className="pl-7"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="githubHandle" className="text-sm font-medium">
            GitHub
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">
              github.com/
            </span>
            <Input
              id="githubHandle"
              value={githubHandle}
              onChange={(e) => setGithubHandle(e.target.value)}
              placeholder="username"
              className="pl-[6.5rem]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="twitchUrl" className="text-sm font-medium">
            Twitch
          </Label>
          <Input
            id="twitchUrl"
            type="url"
            value={twitchUrl}
            onChange={(e) => setTwitchUrl(e.target.value)}
            placeholder="https://twitch.tv/yourchannel"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="streamUrl" className="text-sm font-medium">
            Stream URL
          </Label>
          <Input
            id="streamUrl"
            type="url"
            value={streamUrl}
            onChange={(e) => setStreamUrl(e.target.value)}
            placeholder="https://youtube.com/live/..."
          />
        </div>
      </section>

      {/* Feedback and submit */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <Icon name="error" size="4" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <Icon name="check_circle" size="4" />
          <span>Profile updated successfully</span>
        </div>
      )}

      <Button
        type="submit"
        disabled={
          isPending ||
          usernameStatus === "taken" ||
          usernameStatus === "invalid" ||
          usernameStatus === "checking"
        }
        className="w-full h-11"
      >
        {isPending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
