import Image from "next/image";
import { Button } from "@/components/ui/button";

const navItems = ["what", "why", "where", "who", "faq"];

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-8xl items-center justify-between px-6">
        <a href="/" className="shrink-0">
          <Image
            src="/buildstory-logo.svg"
            alt="BuildStory"
            width={140}
            height={28}
            priority
          />
        </a>

        <nav className="hidden items-center gap-16 md:flex">
          {navItems.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="rounded-md px-3 py-1.5 text-base text-neutral-500 transition-colors hover:text-white font-mono"
            >
              {item}
            </a>
          ))}
        </nav>

        <Button
          variant="outline"
          size="lg"
          className="border-border  text-white hover:bg-white/10 hover:text-white"
        >
          sign in
        </Button>
      </div>
    </header>
  );
}
