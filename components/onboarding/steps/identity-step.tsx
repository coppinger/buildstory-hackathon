"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/ui/icon";
import { LivePreviewBadge } from "@/components/onboarding/live-preview-badge";
import { checkUsernameAvailability } from "@/app/(onboarding)/hackathon/actions";

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

const USERNAME_REGEX = /^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$/;

interface IdentityStepProps {
  displayName: string;
  username: string;
  country: string;
  onUpdate: (partial: { displayName?: string; username?: string; country?: string }) => void;
  onUsernameStatusChange: (status: UsernameStatus) => void;
  initialDisplayName: string;
}

export function IdentityStep({
  displayName,
  username,
  country,
  onUpdate,
  onUsernameStatusChange,
  initialDisplayName,
}: IdentityStepProps) {
  // Store the result of the last async availability check
  const [checkResult, setCheckResult] = useState<{
    username: string;
    status: "available" | "taken";
  } | null>(null);

  // Derive username status from current value + last check result (no setState needed)
  const usernameStatus: UsernameStatus = useMemo(() => {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed) return "idle";
    if (!USERNAME_REGEX.test(trimmed)) return "invalid";
    if (checkResult?.username === trimmed) return checkResult.status;
    return "checking";
  }, [username, checkResult]);

  // Report status to parent whenever it changes
  useEffect(() => {
    onUsernameStatusChange(usernameStatus);
  }, [usernameStatus, onUsernameStatusChange]);

  useEffect(() => {
    if (!displayName && initialDisplayName && initialDisplayName !== "User") {
      onUpdate({ displayName: initialDisplayName });
    }
  }, [initialDisplayName, displayName, onUpdate]);

  // Debounced async availability check
  useEffect(() => {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed || !USERNAME_REGEX.test(trimmed)) return;

    const timer = setTimeout(async () => {
      const result = await checkUsernameAvailability(trimmed);
      if (result.success && result.data) {
        setCheckResult({
          username: trimmed,
          status: result.data.available ? "available" : "taken",
        });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username]);

  const usernameIcon =
    usernameStatus === "checking" ? (
      <Icon name="progress_activity" size="3.5" className="animate-spin text-neutral-500" />
    ) : usernameStatus === "available" ? (
      <Icon name="check_circle" size="3.5" className="text-green-400" />
    ) : usernameStatus === "taken" ? (
      <Icon name="cancel" size="3.5" className="text-red-400" />
    ) : usernameStatus === "invalid" ? (
      <Icon name="error" size="3.5" className="text-amber-400" />
    ) : null;

  return (
    <div className="space-y-5">
      <LivePreviewBadge displayName={displayName} username={username} />

      <div className="space-y-4">
        <div>
          <Label htmlFor="displayName" className="text-neutral-400 text-sm">
            Display name <span className="text-amber-400">*</span>
          </Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => onUpdate({ displayName: e.target.value })}
            placeholder="What should we call you?"
            className="mt-1.5 bg-white/5 border-neutral-700 text-white placeholder:text-neutral-600"
          />
        </div>

        <div>
          <Label htmlFor="username" className="text-neutral-400 text-sm">
            Username <span className="text-amber-400">*</span>
          </Label>
          <div className="relative mt-1.5">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-base">
              @
            </span>
            <Input
              id="username"
              value={username}
              onChange={(e) =>
                onUpdate({
                  username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
                })
              }
              placeholder="username"
              className="bg-white/5 border-neutral-700 text-white placeholder:text-neutral-600 pl-8 pr-9"
            />
            {usernameIcon && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameIcon}
              </div>
            )}
          </div>
          {usernameStatus === "invalid" && username.length > 0 && (
            <p className="mt-1 text-sm text-amber-400">
              3–30 characters: letters, numbers, hyphens, underscores
            </p>
          )}
          {usernameStatus === "taken" && (
            <p className="mt-1 text-sm text-red-400">
              This username is taken
            </p>
          )}
          {usernameStatus === "available" && (
            <p className="mt-1 text-sm text-neutral-500">
              buildstory.com/@{username}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="country" className="text-neutral-400 text-sm">
            Country
          </Label>
          <Input
            id="country"
            value={country}
            onChange={(e) => onUpdate({ country: e.target.value })}
            placeholder="Where are you building from?"
            className="mt-1.5 bg-white/5 border-neutral-700 text-white placeholder:text-neutral-600"
          />
        </div>
      </div>
    </div>
  );
}
