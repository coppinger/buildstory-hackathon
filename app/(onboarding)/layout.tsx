import Image from "next/image";
import Link from "next/link";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <div className="flex justify-center pt-8 pb-6">
        <Link href="/">
          <Image
            src="/buildstory-logo.svg"
            alt="BuildStory"
            width={140}
            height={28}
          />
        </Link>
      </div>

      <div className="flex flex-1 w-full items-start justify-center px-6 pt-8 pb-24 md:pt-24">
        {children}
      </div>
    </div>
  );
}
