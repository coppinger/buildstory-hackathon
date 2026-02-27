"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DISCORD_INVITE_URL } from "@/lib/constants";
import { submitMentorApplication } from "./actions";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const MENTOR_TYPES = [
  { value: "design", label: "Design" },
  { value: "technical", label: "Technical" },
  { value: "growth", label: "Growth" },
] as const;

export function MentorApplyForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [discordHandle, setDiscordHandle] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [githubHandle, setGithubHandle] = useState("");
  const [mentorTypes, setMentorTypes] = useState<string[]>([]);
  const [background, setBackground] = useState("");
  const [availability, setAvailability] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggleType(type: string) {
    setMentorTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  function validate(): string | null {
    if (!name.trim()) return "Name is required";
    if (!email.trim() || !EMAIL_RE.test(email.trim()))
      return "Valid email is required";
    if (!discordHandle.trim()) return "Discord handle is required";
    if (mentorTypes.length === 0) return "Select at least one mentor type";
    if (!background.trim()) return "Background is required";
    if (!availability.trim()) return "Availability is required";
    if (websiteUrl.trim() && !/^https?:\/\//i.test(websiteUrl.trim()))
      return "Website URL must start with http:// or https://";
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    startTransition(async () => {
      const result = await submitMentorApplication({
        name,
        email,
        discordHandle,
        twitterHandle,
        websiteUrl,
        githubHandle,
        mentorTypes,
        background,
        availability,
      });

      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error);
      }
    });
  }

  if (submitted) {
    return (
      <Card className="mx-auto max-w-lg p-8 text-center space-y-4">
        <h2 className="font-heading text-2xl">Thank you!</h2>
        <p className="text-muted-foreground">
          Your mentor application has been received. We&apos;ll review it and
          get back to you soon.
        </p>
        <p className="text-muted-foreground">
          In the meantime, join the community on Discord:
        </p>
        <Button asChild>
          <Link href={DISCORD_INVITE_URL} target="_blank" rel="noopener">
            Join Discord
          </Link>
        </Button>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6">
      <fieldset disabled={isPending} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              maxLength={320}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discord">Discord handle *</Label>
            <Input
              id="discord"
              value={discordHandle}
              onChange={(e) => setDiscordHandle(e.target.value)}
              placeholder="username"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitter">Twitter / X</Label>
            <Input
              id="twitter"
              value={twitterHandle}
              onChange={(e) => setTwitterHandle(e.target.value)}
              placeholder="@handle"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Portfolio / Website</Label>
            <Input
              id="website"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yoursite.com"
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="github">GitHub</Label>
            <Input
              id="github"
              value={githubHandle}
              onChange={(e) => setGithubHandle(e.target.value)}
              placeholder="username"
              maxLength={100}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>How can you help? *</Label>
          <div className="flex gap-2">
            {MENTOR_TYPES.map((type) => {
              const active = mentorTypes.includes(type.value);
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => toggleType(type.value)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    active
                      ? "bg-buildstory-500 text-black"
                      : "bg-muted border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="background">
            Tell us about your background *
          </Label>
          <Textarea
            id="background"
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            placeholder="What's your experience? What tools/technologies are you comfortable helping with?"
            className="min-h-24"
            maxLength={5000}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="availability">Availability *</Label>
          <Input
            id="availability"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            placeholder="e.g. Evenings EST, weekends only, etc."
            maxLength={500}
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Submitting..." : "Submit Application"}
        </Button>
      </fieldset>
    </form>
  );
}
