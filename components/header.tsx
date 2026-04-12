"use client";

import Image from "next/image";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-8xl items-center justify-between px-6">
        <Link href="/" className="shrink-0">
          <Image
            src="/buildstory-logo.svg"
            alt="BuildStory"
            width={140}
            height={28}
            priority
          />
        </Link>

        <div className="flex items-center gap-3">
          <SignedOut>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-border text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/sign-in">login</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="bg-buildstory-500 text-black hover:bg-buildstory-400"
            >
              <Link href="/sign-up">register</Link>
            </Button>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
