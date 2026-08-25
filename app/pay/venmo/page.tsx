"use client";

import { useEffect } from "react";

const VENMO_DEEP_LINK = "venmo://paycharge?txn=pay&recipients=jengordon";
const VENMO_WEB = "https://venmo.com/u/jengordon";

export default function VenmoPayPage() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.location.href = VENMO_DEEP_LINK;
    }, 150);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7f1] px-5 py-10 text-[#243128]">
      <section className="w-full max-w-md rounded-[28px] border border-[#dfe6db] bg-white p-7 text-center shadow-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e6eee1] text-lg font-black text-[#53684c]">J</div>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-[#6f8966]">JGO Hire</p>
        <h1 className="mt-2 text-2xl font-bold">Opening Venmo</h1>
        <p className="mt-3 text-sm leading-6 text-[#708075]">
          Venmo should open automatically to pay <strong className="text-[#243128]">@jengordon</strong>.
        </p>

        <a
          href={VENMO_DEEP_LINK}
          className="mt-6 block rounded-2xl bg-[#53684c] px-5 py-3.5 text-sm font-bold text-white"
        >
          Open Venmo App
        </a>

        <a
          href={VENMO_WEB}
          className="mt-3 block rounded-2xl border border-[#d7e1d0] bg-[#f8faf6] px-5 py-3.5 text-sm font-semibold text-[#4d6247]"
        >
          Venmo isn’t opening?
        </a>

        <p className="mt-5 text-xs leading-5 text-[#8a968d]">Please include your name in the payment memo.</p>
      </section>
    </main>
  );
}
