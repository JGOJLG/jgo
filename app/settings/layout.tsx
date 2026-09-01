import Link from "next/link";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="border-b border-[#dfe6db] bg-[#eef3ea] px-6 py-3 lg:px-10">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 text-sm font-semibold">
          <span className="mr-2 text-[#708075]">Settings:</span>
          <Link href="/settings" className="rounded-lg bg-white px-3 py-2 text-[#4d6247] shadow-sm hover:bg-[#f8faf6]">
            Services & Pricing
          </Link>
          <Link href="/settings/deleted-profiles" className="rounded-lg bg-white px-3 py-2 text-[#4d6247] shadow-sm hover:bg-[#f8faf6]">
            Deleted Profiles & Backups
          </Link>
        </nav>
      </div>
      {children}
    </>
  );
}
