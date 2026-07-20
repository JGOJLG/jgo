"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { label: "Dashboard", href: "/" },
  { label: "Clients", href: "/clients" },
  { label: "Leads", href: "#" },
  { label: "Calendar", href: "#" },
 { label: "Tasks", href: "/tasks" },
  { label: "Revenue", href: "#" },
  { label: "Files", href: "#" },
  { label: "Email Templates", href: "#" },
  { label: "Marketing", href: "#" },
  { label: "Settings", href: "/settings" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "#") {
    return false;
  }

  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r border-[#dfe6db] bg-[#f1f4ed] px-5 py-7 lg:flex">
      <div className="mb-10 px-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7f9975]">
          JGO Hire
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#3d4d39]">
          JGO OS
        </h1>

        <p className="mt-2 text-xs leading-5 text-[#708075]">
          Your business command center
        </p>
      </div>

      <nav className="space-y-2">
        {navigation.map((item) => {
          const active = isActivePath(pathname, item.href);
          const disabled = item.href === "#";

          if (disabled) {
            return (
              <div
                key={item.label}
                className="cursor-not-allowed rounded-xl px-4 py-3 text-sm font-semibold text-[#a0aaa2]"
                title="Coming soon"
              >
                {item.label}
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`block rounded-xl px-4 py-3 text-sm font-semibold transition ${
                active
                  ? "bg-[#d7e1d0] text-[#3d4d39]"
                  : "text-[#647066] hover:bg-white hover:text-[#3d4d39]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-[#dfe6db] bg-white p-4">
        <p className="text-sm font-semibold text-[#3d4d39]">
          Jennifer Gordon
        </p>

        <p className="mt-1 text-xs text-[#708075]">
          Certified Career Coach and Recruiter
        </p>

        <button
          type="button"
          className="mt-4 w-full rounded-xl border border-[#d7e1d0] px-4 py-2 text-sm font-semibold text-[#4d6247] hover:bg-[#f5f7f2]"
        >
          Log Out
        </button>
      </div>
    </aside>
  );
}
