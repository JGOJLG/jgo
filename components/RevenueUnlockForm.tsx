import Link from "next/link";
import { unlockRevenue } from "@/app/revenue/actions";

type RevenueUnlockFormProps = {
  error?: string;
};

export default function RevenueUnlockForm({
  error,
}: RevenueUnlockFormProps) {

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(217,229,210,0.95),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(226,238,249,0.9),_transparent_34%),linear-gradient(180deg,_#f7f8f3_0%,_#f3f5ef_100%)] p-6">
      <section className="w-full max-w-md overflow-hidden rounded-[30px] border border-white/80 bg-white/72 p-8 shadow-[0_30px_90px_rgba(71,91,66,0.18)] backdrop-blur-3xl sm:p-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d9e8f7] bg-[#eef6fd] text-xl font-bold text-[#567896] shadow-sm">
          $
        </div>

        <p className="mt-7 text-xs font-semibold uppercase tracking-[0.24em] text-[#7f9975]">
          Private Financial Area
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#243128]">
          Unlock Revenue
        </h1>

        <p className="mt-3 text-sm leading-6 text-[#708075]">
          Enter your Revenue password to view payments, outstanding balances,
          and financial totals.
        </p>

        <form action={unlockRevenue} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="password"
              className="text-sm font-semibold text-[#3d4d39]"
            >
              Revenue password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              className="mt-2 w-full rounded-2xl border border-[#d7e1d0] bg-white/90 px-4 py-3.5 text-[#243128] outline-none transition focus:border-[#7f9975] focus:ring-4 focus:ring-[#dfe9da]/60"
              placeholder="Enter password"
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              Incorrect password. Please try again.
            </div>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-2xl bg-[#647d5b] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(80,104,72,0.22)] transition hover:-translate-y-0.5 hover:bg-[#526b4b]"
          >
            Unlock Revenue
          </button>
        </form>

        <Link
          href="/"
          className="mt-5 block text-center text-sm font-semibold text-[#647d5b] hover:text-[#4d6247]"
        >
          ← Back to Dashboard
        </Link>
      </section>
    </main>
  );
}
