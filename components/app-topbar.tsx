"use client";

import Image from "next/image";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function AppTopbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center border-b border-border bg-background">
      {/* Logo area — matches sidebar width */}
      <div className="flex h-full w-60 shrink-0 items-center px-5">
        <Link href="/">
          <Image
            src="/buildstory-logo.svg"
            alt="BuildStory"
            width={120}
            height={24}
            priority
          />
        </Link>
      </div>

      {/* Vertical border from sidebar column */}
      <div className="h-full w-px bg-border" />

      {/* Right section */}
      <div className="flex flex-1 items-center justify-end px-5">
        <SignedOut>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-border text-foreground hover:bg-white/10 hover:text-white"
          >
            <Link href="/sign-in">sign in</Link>
          </Button>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </header>
  );
}
