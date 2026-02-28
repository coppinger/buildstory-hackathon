import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SponsorApplyForm } from "./sponsor-apply-form";

export const metadata: Metadata = {
  title: "Become a Sponsor | Buildstory",
  description:
    "Support builders during Hackathon 00 with tool credits, resources, and more.",
};

export default function SponsorApplyPage() {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <div className="p-6">
        <Link href="/">
          <Image
            src="/buildstory-logo.svg"
            alt="BuildStory"
            width={140}
            height={28}
          />
        </Link>
      </div>

      <div className="mx-auto max-w-2xl px-6 py-12 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-heading text-4xl">Become a Sponsor</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Support builders with tool credits, resources, or anything that
            helps them ship. No strings attached.
          </p>
        </div>

        <SponsorApplyForm />
      </div>
    </div>
  );
}
