import Link from "next/link";
import Image from "next/image";
import { currentUser } from "@clerk/nextjs/server";

export async function AppTopbar() {
  const user = await currentUser();

  return (
    <header className="border-b border-border">
      <div className="max-w-8xl mx-auto h-20 flex items-center border-border">
        {/* Logo area — matches sidebar column width */}
        <div className="max-w-xs w-full border-r border-border h-full flex items-center px-16">
          <Link href="/">
            <Image
              src="/buildstory-logo.svg"
              alt="BuildStory"
              width={140}
              height={28}
            />
          </Link>
        </div>

        {/* Right section */}
        <div className="flex justify-end w-full items-center px-8">
          {user ? (
            <div className="flex items-center gap-3">
              <Image
                src={user.imageUrl}
                alt={user.firstName ?? "Avatar"}
                width={48}
                height={48}
                className="rounded-full"
              />
              <div className="flex flex-col">
                <p className="text-base font-semibold">
                  {user.firstName ?? user.username ?? "Builder"}
                </p>
                <p className="text-sm text-muted-foreground">
                  @{user.username ?? user.primaryEmailAddress?.emailAddress?.split("@")[0] ?? "user"}
                </p>
              </div>
            </div>
          ) : (
            <Link
              href="/sign-in"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
