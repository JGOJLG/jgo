"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Lead = {
  id: number;
  name: string | null;
  call_date: string | null;
  call_type: string | null;
  status: string | null;
  outcome: string | null;
  notes: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";
  const parsed = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

export default function NoShowsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadLeads() {
    const { data, error } = await supabase
      .from("intake_calls")
      .select("*")
      .in("status", ["No Show", "Cancelled"])
      .is("archived_at", null)
      .order("call_date", { ascending: false });

    if (error) setError(error.message);
    setLeads((data ?? []) as Lead[]);
    setLoading(false);
  }

  useEffect(() => {
    loadLeads();
  }, []);

  async function reschedule(lead: Lead) {
    const date =
      window.prompt("New Free 15 date (YYYY-MM-DD):", lead.call_date ?? "") ?? "";

    if (!date.trim()) return;

    const { error } = await supabase
      .from("intake_calls")
      .update({
        status: "Free 15 Scheduled",
        call_date: date.trim(),
        outcome: null,
        outcome_date: null,
      })
      .eq("id", lead.id);

    if (error) {
      setError(error.message);
      return;
    }

    setLeads((current) => current.filter((item) => item.id !== lead.id));
  }

  if (loading) {
    return <div className="p-10 text-sm text-[#708075]">Loading no shows...</div>;
  }

  return (
    <main className="min-h-screen bg-[#f7f8f3] p-6 text-[#243128] lg:p-10">
      <header className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link href="/leads" className="text-sm font-semibold text-[#647d5b]">
            ← Active Leads
          </Link>
          <h1 className="mt-4 text-3xl font-bold">No Shows & Cancellations</h1>
          <p className="mt-2 text-sm text-[#708075]">
            Keep these separate from real completed consultations.
          </p>
        </div>

        <Link href="/leads/past-free-15" className="rounded-xl border border-[#cbd8c4] bg-white px-4 py-3 text-sm font-semibold text-[#4d6247]">
          Past Free 15s
        </Link>
      </header>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {leads.map((lead) => (
          <article key={lead.id} className="rounded-2xl border border-[#dfe6db] bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <Link href={`/leads/${lead.id}`} className="text-lg font-bold hover:text-[#647d5b]">
                {lead.name || "Unnamed Lead"}
              </Link>

              <span className="rounded-full bg-[#f6ecd9] px-3 py-1 text-xs font-semibold text-[#8f6d37]">
                {lead.status}
              </span>
            </div>

            <p className="mt-2 text-xs text-[#708075]">
              {lead.call_type || "No source added"}
            </p>

            <div className="mt-5 rounded-xl bg-[#f7f8f3] p-4">
              <p className="text-xs text-[#8a968d]">Original Date</p>
              <p className="mt-1 text-sm font-semibold">{formatDate(lead.call_date)}</p>
            </div>

            {lead.notes ? (
              <p className="mt-4 line-clamp-4 text-xs leading-5 text-[#647066]">
                {lead.notes}
              </p>
            ) : null}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => reschedule(lead)}
                className="rounded-xl bg-[#647d5b] px-4 py-2 text-xs font-semibold text-white"
              >
                Reschedule
              </button>

              <Link
                href={`/leads/${lead.id}`}
                className="rounded-xl border border-[#d7e1d0] px-4 py-2 text-xs font-semibold text-[#4d6247]"
              >
                View Lead
              </Link>
            </div>
          </article>
        ))}
      </div>

      {leads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#dfe6db] p-10 text-center text-sm text-[#8a968d]">
          No no-shows or cancellations.
        </div>
      ) : null}
    </main>
  );
}
