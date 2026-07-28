"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Lead = {
  id: number;
  name: string | null;
  call_type: string | null;
  status: string | null;
  archived_at: string | null;
  archive_reason: string | null;
  services_discussed: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Not added";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

export default function ArchivedLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadLeads() {
    const { data, error } = await supabase
      .from("intake_calls")
      .select("*")
      .not("archived_at", "is", null)
      .order("archived_at", { ascending: false });

    if (error) setError(error.message);
    setLeads((data ?? []) as Lead[]);
    setLoading(false);
  }

  useEffect(() => {
    loadLeads();
  }, []);

  async function restoreLead(lead: Lead) {
    const { error } = await supabase
      .from("intake_calls")
      .update({
        status: "New Lead",
        archived_at: null,
        archive_reason: null,
      })
      .eq("id", lead.id);

    if (error) {
      setError(error.message);
      return;
    }

    setLeads((current) => current.filter((item) => item.id !== lead.id));
  }

  async function deleteForever(lead: Lead) {
    const confirmed = window.confirm(
      `Permanently delete ${lead.name || "this lead"}? This cannot be undone.`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("intake_calls")
      .delete()
      .eq("id", lead.id);

    if (error) {
      setError(error.message);
      return;
    }

    setLeads((current) => current.filter((item) => item.id !== lead.id));
  }

  if (loading) {
    return <div className="p-10 text-sm text-[#708075]">Loading archive...</div>;
  }

  return (
    <main className="min-h-screen bg-[#f7f8f3] p-6 text-[#243128] lg:p-10">
      <header className="mb-7">
        <Link href="/leads" className="text-sm font-semibold text-[#647d5b]">
          ← Active Leads
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Archived Leads</h1>
        <p className="mt-2 text-sm text-[#708075]">
          Spam, duplicates, fake inquiries, and people who asked to be removed.
        </p>
      </header>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="space-y-4">
        {leads.map((lead) => (
          <article
            key={lead.id}
            className="flex flex-col gap-5 rounded-2xl border border-[#dfe6db] bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between"
          >
            <div>
              <h2 className="text-lg font-bold">{lead.name || "Unnamed Lead"}</h2>
              <p className="mt-1 text-xs text-[#708075]">
                {lead.call_type || "No source"} · Archived {formatDate(lead.archived_at)}
              </p>
              <p className="mt-3 text-sm font-medium text-[#9a554d]">
                {lead.archive_reason || "No archive reason added"}
              </p>
              {lead.services_discussed ? (
                <p className="mt-2 text-xs text-[#708075]">
                  {lead.services_discussed}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => restoreLead(lead)}
                className="rounded-xl bg-[#647d5b] px-4 py-2 text-xs font-semibold text-white"
              >
                Restore
              </button>

              <button
                type="button"
                onClick={() => deleteForever(lead)}
                className="rounded-xl border border-red-200 px-4 py-2 text-xs font-semibold text-red-600"
              >
                Delete Forever
              </button>
            </div>
          </article>
        ))}
      </div>

      {leads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#dfe6db] p-10 text-center text-sm text-[#8a968d]">
          No archived leads.
        </div>
      ) : null}
    </main>
  );
}
