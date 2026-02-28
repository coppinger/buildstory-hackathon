"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DISCORD_INVITE_URL } from "@/lib/constants";
import { submitSponsorInquiry } from "./actions";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function SponsorApplyForm() {
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [offerDescription, setOfferDescription] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  function validate(): string | null {
    if (!companyName.trim()) return "Company name is required";
    if (!contactName.trim()) return "Contact name is required";
    if (!email.trim() || !EMAIL_RE.test(email.trim()))
      return "Valid email is required";
    if (!offerDescription.trim()) return "Offer description is required";
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
      const result = await submitSponsorInquiry({
        companyName,
        contactName,
        email,
        websiteUrl,
        offerDescription,
        additionalNotes,
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
          Your sponsorship inquiry has been received. We&apos;ll review it and
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
            <Label htmlFor="companyName">Company / Organization name *</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Inc."
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactName">Contact name *</Label>
            <Input
              id="contactName"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
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
              placeholder="you@company.com"
              maxLength={320}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="websiteUrl">Website</Label>
            <Input
              id="websiteUrl"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yourcompany.com"
              maxLength={500}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="offerDescription">
            What would you like to offer? *
          </Label>
          <Textarea
            id="offerDescription"
            value={offerDescription}
            onChange={(e) => setOfferDescription(e.target.value)}
            placeholder="e.g. API credits, tool licenses, cloud hosting, mentorship time, prizes..."
            className="min-h-24"
            maxLength={5000}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="additionalNotes">Additional notes</Label>
          <Textarea
            id="additionalNotes"
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Anything else you'd like us to know?"
            className="min-h-20"
            maxLength={2000}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Submitting..." : "Submit Inquiry"}
        </Button>
      </fieldset>
    </form>
  );
}
