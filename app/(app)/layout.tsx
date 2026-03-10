import { AppTopbar } from "@/components/app-topbar";
import { AppSidebar } from "@/components/app-sidebar";
import { DevIdentityPanel } from "@/components/dev/dev-identity-panel";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-col justify-stretch min-h-screen">
      <AppTopbar />
      <div className="mx-auto w-full max-w-8xl border-border h-full flex flex-1">
        <AppSidebar />
        {children}
      </div>
      {process.env.NODE_ENV === "development" && <DevIdentityPanel />}
    </main>
  );
}
