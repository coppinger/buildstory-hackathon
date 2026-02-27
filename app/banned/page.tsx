import Image from "next/image";
import Link from "next/link";

export default function BannedPage() {
  return (
    <div className="dark min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-6">
        <Link href="/">
          <Image
            src="/buildstory-logo.svg"
            alt="BuildStory"
            width={140}
            height={28}
            className="mx-auto"
          />
        </Link>
        <h1 className="font-heading text-2xl">Account Suspended</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your account has been suspended. If you believe this is an error,
          please contact us for assistance.
        </p>
        <Link
          href="/"
          className="inline-block text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
        >
          Return to homepage
        </Link>
      </div>
    </div>
  );
}
