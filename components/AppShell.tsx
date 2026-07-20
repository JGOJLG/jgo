"use client";

import { usePathname } from "next/navigation";
import AppSidebar from "@/components/AppSidebar";

type AppShellProps = {
  children: React.ReactNode;
};

const pagesWithoutSidebar = ["/login"];

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  const shouldHideSidebar = pagesWithoutSidebar.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (shouldHideSidebar) {
    return <>{children}</>;
  }

  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#243128]">
      <div className="flex min-h-screen">
        <AppSidebar />

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </main>
  );
}