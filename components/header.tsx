"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

const navItems = ["what", "rules", "why", "where", "who", "faq"];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        <nav className="hidden items-center gap-8 lg:gap-16 md:flex">
          {navItems.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="rounded-md px-3 py-1.5 text-sm text-neutral-500 transition-colors hover:text-white font-mono"
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <SignedOut>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="hidden md:inline-flex border-border text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/sign-in">login</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="hidden md:inline-flex bg-buildstory-500 text-black hover:bg-buildstory-400"
            >
              <Link href="/sign-up">register</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="md:hidden border-border text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/sign-in">login</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="md:hidden bg-buildstory-500 text-black hover:bg-buildstory-400"
            >
              <Link href="/sign-up">register</Link>
            </Button>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>

          {/* Hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5"
            aria-label="Toggle menu"
          >
            <span
              className={`block w-5 h-px bg-white transition-all duration-200 ${
                mobileMenuOpen ? "rotate-45 translate-y-[3.5px]" : ""
              }`}
            />
            <span
              className={`block w-5 h-px bg-white transition-all duration-200 ${
                mobileMenuOpen ? "-rotate-45 -translate-y-[3.5px]" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-border bg-neutral-950/95 backdrop-blur-xl">
          <div className="flex flex-col px-6 py-4">
            {navItems.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={() => setMobileMenuOpen(false)}
                className="py-3 text-base text-neutral-500 transition-colors hover:text-white font-mono border-b border-border last:border-b-0"
              >
                {item}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
