"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Lead = {
  id: number;
  name: string | null;
  lead_source: string | null;
  call_type: string | null;
  call_date: string | null;
  status: string | null;
  services_discussed: string | null;
  notes: string | null;
};

const columns = [
  "New Lead",
  "Free 15",
  "Follow Up",
  "Converted",
];

const moveOptions = [
  {
    label: "New Lead",
    value: "New Lead",
  },
  {
    label: "Free 15",
    value: "Free 15 Scheduled",
  },
  {
    label: "Follow Up",
    value: "Follow Up Needed",
  },
  {
    label: "Converted",
    value: "Converted",
  },
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  async function loadLeads() {
    const { data } = await supabase
      .from("intake_calls")
      .select("*")
      .order("id", { ascending: false });

    setLeads((data ?? []) as Lead[]);
    setLoading(false);
  }

  useEffect(() => {
    loadLeads();
  }, []);

  async function updateStatus(
    id: number,
    status: string
  ) {
    await supabase
      .from("intake_calls")
      .update({ status })
      .eq("id", id);

    setLeads((current) =>
      current.map((lead) =>
        lead.id === id
          ? {
              ...lead,
              status,
            }
          : lead
      )
    );

    setOpenMenu(null);
  }

  function formatDate(date: string | null) {
    if (!date) return "Not scheduled";

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(`${date}T12:00:00`));
  }

  function matchesColumn(
    lead: Lead,
    column: string
  ) {
    const status = lead.status || "New Lead";

    if (
      column === "Free 15" &&
      [
        "Free 15 Scheduled",
        "Free 15 Completed",
      ].includes(status)
    ) {
      return true;
    }

    if (
      column === "Follow Up" &&
      status === "Follow Up Needed"
    ) {
      return true;
    }

    return status === column;
  }

  if (loading) {
    return (
      <div className="p-10 text-sm text-[#708075]">
        Loading leads...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8f3] p-6 text-[#243128] lg:p-10">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Leads
          </h1>

          <p className="mt-2 text-sm text-[#708075]">
            Manage prospects, Free 15 consultations, and conversions.
          </p>
        </div>

        <Link
          href="/leads/new"
          className="rounded-xl bg-[#647d5b] px-5 py-3 text-sm font-semibold text-white"
        >
          + Add Lead
        </Link>
      </header>


      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {columns.map((column) => {
          const columnLeads = leads.filter((lead) =>
            matchesColumn(lead, column)
          );

          return (
            <section
              key={column}
              className="rounded-3xl border border-[#dfe6db] bg-[#fbfaf6] p-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-bold">
                  {column}
                </h2>

                <span className="rounded-full bg-[#edf2e9] px-2 py-1 text-xs text-[#647d5b]">
                  {columnLeads.length}
                </span>
              </div>


              <div className="mt-5 space-y-4">
                {columnLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="relative rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm transition hover:shadow-md"
                  >
                    <Link href={`/leads/${lead.id}`}>
                      <h3 className="font-bold text-lg">
                        {lead.name || "Unnamed Lead"}
                      </h3>

                      <p className="mt-2 text-xs text-[#708075]">
                        {lead.call_type ||
                          lead.lead_source ||
                          "No source"}
                      </p>

                      {lead.services_discussed && (
                        <p className="mt-4 text-xs font-medium text-[#647d5b]">
                          {lead.services_discussed}
                        </p>
                      )}

                      <div className="mt-4 rounded-xl bg-[#f7f8f3] p-3">
                        <p className="text-[11px] text-[#708075]">
                          Free 15
                        </p>

                        <p className="text-sm font-medium">
                          {formatDate(lead.call_date)}
                        </p>
                      </div>

                      <p className="mt-4 text-xs font-semibold text-[#647d5b]">
                        View Lead →
                      </p>
                    </Link>


                    <button
                      onClick={() =>
                        setOpenMenu(
                          openMenu === lead.id
                            ? null
                            : lead.id
                        )
                      }
                      className="absolute bottom-4 right-4 rounded-full px-3 py-1 text-lg text-[#708075] hover:bg-[#f7f8f3]"
                    >
                      ⋮
                    </button>


                    {openMenu === lead.id && (
                      <div className="absolute right-4 top-12 z-10 w-48 rounded-xl border border-[#dfe6db] bg-white p-2 shadow-lg">

                        <p className="px-3 py-2 text-xs font-semibold text-[#708075]">
                          Move To
                        </p>

                        {moveOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() =>
                              updateStatus(
                                lead.id,
                                option.value
                              )
                            }
                            className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#f7f8f3]"
                          >
                            {option.label}
                          </button>
                        ))}

                        <div className="my-2 border-t border-[#edf1e8]" />

                        <Link
                          href={`/leads/${lead.id}/edit`}
                          className="block rounded-lg px-3 py-2 text-sm hover:bg-[#f7f8f3]"
                        >
                          Edit Lead
                        </Link>

                        <button
                          className="w-full rounded-lg px-3 py-2 text-left text-sm text-[#647d5b] hover:bg-[#f7f8f3]"
                        >
                          Convert to Client
                        </button>

                        <button
                          className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-500 hover:bg-[#f7f8f3]"
                        >
                          Archive Lead
                        </button>
                      </div>
                    )}
                  </div>
                ))}


                {columnLeads.length === 0 && (
                  <div className="rounded-xl border border-dashed border-[#dfe6db] p-6 text-center text-xs text-[#8a968d]">
                    No leads
                  </div>
                )}

              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}