"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Lead = {
  id: number;
  name: string | null;
  call_date: string | null;
  call_type: string | null;
  services_discussed: string | null;
  status: string | null;
  outcome: string | null;
  outcome_date: string | null;
  follow_up_date: string | null;
  notes: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Not added";
  const parsed = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

export default function PastFree15Page() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadLeads() {
    const { data, error } = await supabase
      .from("intake_calls")
      .select("*")
      .eq("status", "Past Free 15")
      .is("archived_at", null)
      .order("outcome_date", { ascending: false });

    if (error) setError(error.message);
    setLeads((data ?? []) as Lead[]);
    setLoading(false);
  }

  useEffect(() => {
    loadLeads();
  }, []);

  const filteredLeads = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return leads;

    return leads.filter((lead) =>
      [
        lead.name,
        lead.outcome,
        lead.services_discussed,
        lead.call_type,
        lead.notes,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term))
    );
  }, [leads, search]);

  async function moveToFollowUp(lead: Lead) {
    const date =
      window.prompt("Follow-up date (YYYY-MM-DD):", lead.follow_up_date ?? "") ??
      "";

    if (!date.trim()) return;

    const { error } = await supabase
      .from("intake_calls")
      .update({
        status: "Follow Up Needed",
        follow_up_date: date.trim(),
      })
      .eq("id", lead.id);

    if (error) {
      setError(error.message);
      return;
    }

    setLeads((current) => current.filter((item) => item.id !== lead.id));
  }

  if (loading) {
    return <div className="p-10 text-sm text-[#708075]">Loading history...</div>;
  }

  return (
    <main className="min-h-screen bg-[#f7f8f3] p-6 text-[#243128] lg:p-10">
      <header className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link href="/leads" className="text-sm font-semibold text-[#647d5b]">
            ← Active Leads
          </Link>
          <h1 className="mt-4 text-3xl font-bold">Past Free 15s</h1>
          <p className="mt-2 text-sm text-[#708075]">
            Searchable history of real prospects who did not convert immediately.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/leads/no-shows" className="rounded-xl border border-[#cbd8c4] bg-white px-4 py-3 text-sm font-semibold text-[#4d6247]">
            No Shows
          </Link>
          <Link href="/leads/archived" className="rounded-xl border border-[#cbd8c4] bg-white px-4 py-3 text-sm font-semibold text-[#4d6247]">
            Archived
          </Link>
        </div>
      </header>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-6 rounded-2xl border border-[#dfe6db] bg-white p-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, outcome, service, or notes..."
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredLeads.map((lead) => (
          <article key={lead.id} className="rounded-2xl border border-[#dfe6db] bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link href={`/leads/${lead.id}`} className="text-lg font-bold hover:text-[#647d5b]">
                  {lead.name || "Unnamed Lead"}
                </Link>
                <p className="mt-1 text-xs text-[#708075]">
                  {lead.call_type || "No source added"}
                </p>
              </div>

              <span className="rounded-full bg-[#eef2e9] px-3 py-1 text-xs font-semibold text-[#5c7454]">
                {lead.outcome || "Past Free 15"}
              </span>
            </div>

            <dl className="mt-5 space-y-3 text-sm">
              <div>
                <dt className="text-xs text-[#8a968d]">Free 15 Date</dt>
                <dd className="mt-1 font-medium">{formatDate(lead.call_date)}</dd>
              </div>

              <div>
                <dt className="text-xs text-[#8a968d]">Outcome Date</dt>
                <dd className="mt-1 font-medium">{formatDate(lead.outcome_date)}</dd>
              </div>

              <div>
                <dt className="text-xs text-[#8a968d]">Interested In</dt>
                <dd className="mt-1 font-medium">
                  {lead.services_discussed || "Not added"}
                </dd>
              </div>

              {lead.follow_up_date ? (
                <div>
                  <dt className="text-xs text-[#8a968d]">Follow Up</dt>
                  <dd className="mt-1 font-medium">{formatDate(lead.follow_up_date)}</dd>
                </div>
              ) : null}
            </dl>

            {lead.notes ? (
              <p className="mt-5 line-clamp-4 rounded-xl bg-[#f7f8f3] p-4 text-xs leading-5 text-[#647066]">
                {lead.notes}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => moveToFollowUp(lead)}
                className="rounded-xl bg-[#647d5b] px-4 py-2 text-xs font-semibold text-white"
              >
                Move to Follow Up
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

      {filteredLeads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#dfe6db] p-10 text-center text-sm text-[#8a968d]">
          No past Free 15s found.
        </div>
      ) : null}
    </main>
  );
}
