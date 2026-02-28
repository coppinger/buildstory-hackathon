"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/ui/icon";
import { LivePreviewBadge } from "@/components/onboarding/live-preview-badge";
import { CountryCombobox } from "@/components/onboarding/country-combobox";
import { RegionCombobox } from "@/components/onboarding/region-combobox";
import { checkUsernameAvailability } from "@/app/(onboarding)/hackathon/actions";
import { USERNAME_REGEX } from "@/lib/constants";

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

interface IdentityStepProps {
  displayName: string;
  username: string;
  countryCode: string;
  region: string;
  onUpdate: (partial: { displayName?: string; username?: string; countryCode?: string; region?: string }) => void;
  onUsernameStatusChange: (status: UsernameStatus) => void;
  initialDisplayName: string;
  existingUsername?: string;
}

export function IdentityStep({
  displayName,
  username,
  countryCode,
  region,
  onUpdate,
  onUsernameStatusChange,
  initialDisplayName,
  existingUsername,
}: IdentityStepProps) {
  const displayNameRef = useRef<HTMLInputElement>(null);

  // Auto-focus display name input on mount
  useEffect(() => {
    displayNameRef.current?.focus();
  }, []);

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
    // User's own existing username is always available
    if (existingUsername && trimmed === existingUsername.toLowerCase()) return "available";
    if (checkResult?.username === trimmed) return checkResult.status;
    return "checking";
  }, [username, checkResult, existingUsername]);

  // Report status to parent whenever it changes
  useEffect(() => {
    onUsernameStatusChange(usernameStatus);
  }, [usernameStatus, onUsernameStatusChange]);

  useEffect(() => {
    if (!displayName && initialDisplayName && initialDisplayName !== "User") {
      onUpdate({ displayName: initialDisplayName });
    }
  }, [initialDisplayName, displayName, onUpdate]);

  // Debounced async availability check — skip for user's own existing username
  useEffect(() => {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed || !USERNAME_REGEX.test(trimmed)) return;
    if (existingUsername && trimmed === existingUsername.toLowerCase()) return;

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
  }, [username, existingUsername]);

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
            ref={displayNameRef}
            id="displayName"
            value={displayName}
            onChange={(e) => onUpdate({ displayName: e.target.value })}
            placeholder="What should we call you?"
            className="mt-1.5 bg-white/5 border-neutral-700 text-white placeholder:text-neutral-600"
          />
        </div>

        {/* Show username field only if not already set (e.g. OAuth users) */}
        {!existingUsername && (
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
                3-30 characters: letters, numbers, hyphens, underscores
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
        )}

        <CountryCombobox
          value={countryCode}
          onChange={(code) => {
            onUpdate({ countryCode: code });
            if (!code) onUpdate({ countryCode: code, region: "" });
          }}
        />

        {countryCode && (
          <RegionCombobox
            countryCode={countryCode}
            value={region}
            onChange={(code) => onUpdate({ region: code })}
          />
        )}
      </div>
    </div>
  );
}
