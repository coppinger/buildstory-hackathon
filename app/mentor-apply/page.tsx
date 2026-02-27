import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MentorApplyForm } from "./mentor-apply-form";

export const metadata: Metadata = {
  title: "Mentor Application | Buildstory",
  description:
    "Volunteer to mentor builders during Hackathon 00. Help participants get unstuck with design, technical, or growth guidance.",
};

export default function MentorApplyPage() {
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
          <h1 className="font-heading text-4xl">Volunteer to Mentor</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Help hackathon participants get unstuck. Share what you know — no
            authority required, just willingness to help.
          </p>
        </div>

        <MentorApplyForm />
      </div>
    </div>
  );
}
