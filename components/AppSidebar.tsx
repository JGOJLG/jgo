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
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={iconClassName}
      >
        <path d="M3 3h7v7H3z" />
        <path d="M14 3h7v7h-7z" />
        <path d="M3 14h7v7H3z" />
        <path d="M14 14h7v7h-7z" />
      </svg>
    ),
  },
  {
    label: "Clients",
    href: "/clients",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={iconClassName}
      >
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-4 2.5-6 6-6s6 2 6 6" />
        <circle cx="17" cy="8" r="2.5" />
        <path d="M15 15c3.5 0 6 1.5 6 5" />
      </svg>
    ),
  },
  {
    label: "EWC",
    href: "/ewc",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={iconClassName}
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 9h18M8 9v11M14 9v11M8 14h13" />
      </svg>
    ),
  },
  {
    label: "Calendar",
    href: "/calendar",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={iconClassName}
      >
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4M17 3v4M3 10h18" />
      </svg>
    ),
  },
  {
    label: "Tasks",
    href: "/tasks",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={iconClassName}
      >
        <path d="M9 6h12M9 12h12M9 18h12" />
        <path d="m3.5 6 1.5 1.5L7.5 5" />
        <path d="m3.5 12 1.5 1.5 2.5-2.5" />
        <path d="m3.5 18 1.5 1.5 2.5-2.5" />
      </svg>
    ),
  },

  // TIMER
  {
    label: "Timer",
    href: "/timer",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={iconClassName}
      >
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l3 2" />
        <path d="M9 2h6" />
        <path d="M12 5V2" />
      </svg>
    ),
  },

  {
    label: "Email Hub",
    href: "/email",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={iconClassName}
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    ),
  },
  {
    label: "Recruiter Tips",
    href: "/recruiter-tips",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={iconClassName}
      >
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M8 14c-1.2-1-2-2.6-2-4.5A6 6 0 0 1 18 9.5c0 1.9-.8 3.5-2 4.5-.8.7-1 1.2-1 2H9c0-.8-.2-1.3-1-2Z" />
      </svg>
    ),
  },
  {
    label: "Content Ideas",
    href: "/content-ideas",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={iconClassName}
      >
        <path d="M4 5h16v14H4z" />
        <path d="M8 9h8M8 13h8M8 17h5" />
      </svg>
    ),
  },
  {
    label: "Revenue",
    href: "/revenue/unlock",
    activePrefix: "/revenue",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={iconClassName}
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M15 8.5c-.8-.7-1.8-1-3-1-1.7 0-3 .9-3 2.2 0 1.5 1.4 2 3 2.3 1.7.3 3 .8 3 2.3 0 1.4-1.3 2.2-3 2.2-1.3 0-2.5-.4-3.3-1.2M12 5.5v13" />
      </svg>
    ),
  },
  {
    label: "Files",
    href: "#",
    disabled: true,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={iconClassName}
      >
        <path d="M3 6h7l2 2h9v11H3z" />
      </svg>
    ),
  },
  {
    label: "Marketing",
    href: "#",
    disabled: true,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={iconClassName}
      >
        <path d="M4 14V8l13-4v14L4 14Z" />
        <path d="M4 11H2M20 8l2-1M20 14l2 1" />
        <path d="m7 15 2 5h3l-2-5" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/settings",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={iconClassName}
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 0 0-1.7-1L14.5 3h-5L9.2 6a7 7 0 0 0-1.7 1L5 6 3 9.5 5.1 11a7 7 0 0 0 0 2L3 14.5 5 18l2.5-1a7 7 0 0 0 1.7 1l.3 3h5l.3-3a7 7 0 0 0 1.7-1l2.5 1 2-3.5-2.1-1.5c.1-.3.1-.7.1-1Z" />
      </svg>
    ),
  },
];

function isActivePath(
  pathname: string,
  href: string,
  activePrefix?: string
) {
  if (href === "#") return false;

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
    <aside className="flex h-full min-h-full w-full flex-col bg-[#eef2ea] p-4 text-[#3d4d39] md:min-h-screen md:w-[260px] md:p-5">
      <div className="mb-6 px-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#849083]">
          JGO Hire
        </p>

        <h2 className="mt-1 text-xl font-bold tracking-tight text-[#3d4d39]">
          JGO OS
        </h2>

        <p className="mt-1 text-xs leading-5 text-[#7b887d]">
          Your business command center
        </p>
      </div>

      <nav className="space-y-1.5">
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
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-[#e0e5dc] bg-white/45">
                  {item.icon}
                </span>

                <span>{item.label}</span>

                <span className="ml-auto text-[9px] font-bold uppercase tracking-wide text-[#aab2ac]">
                  Soon
                </span>
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
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition ${
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

      <div className="mt-auto pt-6">
        <div className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-[0_10px_30px_rgba(71,91,66,0.08)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#e3eadf] text-sm font-bold text-[#4d6247]">
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
      </div>
    </aside>
  );
}