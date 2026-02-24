import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh">
      <div className="flex w-full flex-col lg:w-1/2">
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

        <div className="flex flex-1 items-center justify-center px-6">
          {children}
        </div>

        <div className="p-6">
          <p className="font-mono text-neutral-600">© 2025 Buildstory</p>
        </div>
      </div>

      <div className="hidden border-l border-border bg-neutral-950 lg:block lg:w-1/2" />
    </div>
  );
}
