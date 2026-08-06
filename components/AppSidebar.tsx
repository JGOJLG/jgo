"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavigationItem = {
  label: string;
  href: string;
  icon: ReactNode;
  activePrefix?: string;
  disabled?: boolean;
};

const iconClassName = "h-4 w-4";

const navigation: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName}>
        <path
          d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Clients",
    href: "/clients",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName}>
        <path
          d="M8.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7-1a3 3 0 1 0 0-6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M3 20v-1.5A4.5 4.5 0 0 1 7.5 14h2A4.5 4.5 0 0 1 14 18.5V20m1-6h1.5a4.5 4.5 0 0 1 4.5 4.5V20"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "Calendar",
    href: "/calendar",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName}>
        <path
          d="M6 3v3m12-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Tasks",
    href: "/tasks",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName}>
        <path
          d="m5 7 1.5 1.5L9 6m3 1h7M5 13l1.5 1.5L9 12m3 1h7M5 19l1.5 1.5L9 18m3 1h7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Recruiter Tips",
    href: "/recruiter-tips",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName}>
        <path
          d="M9 18h6m-5 3h4M8.2 14.8A7 7 0 1 1 15.8 14.8c-.9.6-1.3 1.4-1.3 2.2h-5c0-.8-.4-1.6-1.3-2.2Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Revenue",
    href: "/revenue/unlock",
    activePrefix: "/revenue",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName}>
        <path
          d="M12 3v18m4-14.5c0-1.4-1.8-2.5-4-2.5S8 5.1 8 6.5 9.8 9 12 9s4 1.1 4 2.5S14.2 14 12 14s-4 1.1-4 2.5S9.8 19 12 19s4-1.1 4-2.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "Files",
    href: "#",
    disabled: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName}>
        <path
          d="M3 6h7l2 2h9v11H3V6Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Email Templates",
    href: "#",
    disabled: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName}>
        <path
          d="M3 5h18v14H3V5Zm0 2 9 6 9-6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Marketing",
    href: "#",
    disabled: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName}>
        <path
          d="m4 14 12-6v10L4 12v2Zm12-3 4-2v8l-4-2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="m7 15 1 5h4l-1.5-3.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/settings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className={iconClassName}>
        <path
          d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="m19 13.5 2-1.5-2-1.5-.4-1 1-2.3-2.3-1-1.5 2-.9-.4L13.5 5h-3L9.1 7.8l-.9.4-1.5-2-2.3 1 1 2.3-.4 1L3 12l2 1.5.4 1-1 2.3 2.3 1 1.5-2 .9.4 1.4 2.8h3l1.4-2.8.9-.4 1.5 2 2.3-1-1-2.3.4-1Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

function isActivePath(
  pathname: string,
  href: string,
  activePrefix?: string
) {
  if (href === "#") {
    return false;
  }

  if (href === "/") {
    return pathname === "/";
  }

  if (activePrefix) {
    return (
      pathname === activePrefix ||
      pathname.startsWith(`${activePrefix}/`)
    );
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-[#dfe6db] bg-[linear-gradient(180deg,#f3f6f0_0%,#eef2ea_100%)] px-5 py-7 lg:flex">
      <Link
        href="/"
        className="mb-8 block rounded-2xl px-2 py-1 transition hover:bg-white/65"
        aria-label="Return to JGO OS dashboard"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7f9975]">
          JGO Hire
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#3d4d39]">
          JGO OS
        </h1>

        <p className="mt-2 text-xs leading-5 text-[#708075]">
          Your business command center
        </p>
      </Link>

      <nav className="space-y-2">
        {navigation.map((item) => {
          const active = isActivePath(
            pathname,
            item.href,
            item.activePrefix
          );

          if (item.disabled) {
            return (
              <div
                key={item.label}
                className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#a0aaa2]"
                title="Coming soon"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e0e5dc] bg-white/45">
                  {item.icon}
                </span>

                <span>{item.label}</span>
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                active
                  ? "bg-[#d7e1d0] text-[#3d4d39] shadow-sm"
                  : "text-[#647066] hover:bg-white hover:text-[#3d4d39]"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                  active
                    ? "bg-white/75 text-[#52684b]"
                    : "bg-white/45 text-[#7e8b80]"
                }`}
              >
                {item.icon}
              </span>

              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-white/80 bg-white/75 p-4 shadow-[0_10px_30px_rgba(71,91,66,0.08)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e3eadf] text-sm font-bold text-[#4d6247]">
            JG
          </span>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#3d4d39]">
              Jennifer Gordon
            </p>

            <p className="mt-0.5 text-[11px] leading-4 text-[#708075]">
              Career Coach and Recruiter
            </p>
          </div>
        </div>

        <button
          type="button"
          className="mt-4 w-full rounded-xl border border-[#d7e1d0] bg-white px-4 py-2 text-sm font-semibold text-[#4d6247] transition hover:bg-[#f5f7f2]"
        >
          Log Out
        </button>
      </div>
    </aside>
  );
}
