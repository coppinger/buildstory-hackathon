import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { isAdmin } from "@/lib/admin";
import { Icon } from "@/components/ui/icon";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId || !isAdmin(userId)) redirect("/");

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard">
              <Image
                src="/buildstory-logo.svg"
                alt="BuildStory"
                width={120}
                height={24}
              />
            </Link>
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground bg-muted px-2 py-0.5">
              Admin
            </span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Icon name="arrow_back" size="4" />
              Back to app
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
