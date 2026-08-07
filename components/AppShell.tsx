"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AppSidebar from "@/components/AppSidebar";

type AppShellProps = {
  children: React.ReactNode;
};

const pagesWithoutSidebar = ["/login"];

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const shouldHideSidebar = pagesWithoutSidebar.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  if (shouldHideSidebar) {
    return <>{children}</>;
  }

  return (
    <>
      {/* MOBILE TOP BAR */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-black/5 bg-white/95 px-4 backdrop-blur md:hidden">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            JGO Hire
          </p>
          <p className="text-base font-semibold text-slate-900">JGO OS</p>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open navigation"
          aria-expanded={mobileMenuOpen}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm"
        >
          <span className="flex w-5 flex-col gap-[4px]">
            <span className="block h-[2px] w-full rounded-full bg-current" />
            <span className="block h-[2px] w-full rounded-full bg-current" />
            <span className="block h-[2px] w-full rounded-full bg-current" />
          </span>
        </button>
      </header>

      {/* MOBILE OVERLAY */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
        />
      )}

      {/* MOBILE SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[86%] max-w-[320px] bg-white shadow-2xl transition-transform duration-300 md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              JGO Hire
            </p>
            <p className="text-base font-semibold text-slate-900">JGO OS</p>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl text-slate-600"
          >
            ×
          </button>
        </div>

        <div className="h-[calc(100vh-4rem)] overflow-y-auto">
          <AppSidebar />
        </div>
      </aside>

      {/* DESKTOP + PAGE CONTENT */}
      <main className="min-h-screen bg-slate-50">
        <div className="flex min-h-screen">
          <div className="hidden md:block">
            <AppSidebar />
          </div>

          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </main>
    </>
  );
}