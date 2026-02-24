import Link from "next/link";
import Image from "next/image";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="flex flex-col justify-stretch min-h-screen">
        <header className="border-b border-border">
          <div className="max-w-8xl mx-auto h-24 flex items-center border-border">
            {/* Header siderbar */}
            <div className="max-w-xs w-full border-r border-border h-full flex items-center  px-16">
              <Link href="/">
                <Image
                  src="/buildstory-logo.svg"
                  alt="BuildStory"
                  width={140}
                  height={28}
                />
              </Link>
            </div>
            {/* Header main */}
              {/* User badge */}
              <div className="flex justify-end w-full items-center">
                <div className="flex flex-col gap-1">
                <p className="text-base font-medium">Slug</p>
                <p className="text-sm text-muted-foreground">@mk_slug</p>
              </div>
              </div>
          </div>
        </header>
        <div className="mx-auto w-full max-w-8xl border-border h-full flex flex-1">
          <aside className="px-16 py-8 max-w-xs w-full border-r border-border">
            {/* Menu should go here */}
            <div className="flex flex-col gap-8">
              <Link href="/">
              <p className="text-xl font-semibold text-foreground">Active</p>
            </Link>
            <Link href="/">
              <p className="text-xl font-medium text-muted-foreground">Inactive</p>
            </Link>
            </div>
          </aside>
          {children}
        </div>
      </main>
    </>
  );
}
