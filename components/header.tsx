import Image from "next/image";
import { Button } from "@/components/ui/button";

const navItems = ["What", "Why", "When", "Where", "Who", "FAQ"];

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-neut-900 backdrop-blur-xl">
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6">
        <a href="/" className="shrink-0">
          <Image
            src="/buildstory-logo.svg"
            alt="BuildStory"
            width={140}
            height={28}
            priority
          />
        </a>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="rounded-md px-3 py-1.5 text-md font-medium text-white/70 transition-colors hover:text-white"
            >
              {item}
            </a>
          ))}
        </nav>

        <Button
          variant="default"
          size="lg"
          className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
        >
          Sign in
        </Button>
      </div>
    </header>
  );
}
