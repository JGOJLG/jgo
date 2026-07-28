"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  follow_up_date: string | null;
  converted_to_client: boolean | null;
  outcome: string | null;
  outcome_date: string | null;
  archived_at: string | null;
  archive_reason: string | null;
};

const columns = ["New Lead", "Free 15", "Follow Up"];

const moveOptions = [
  { label: "New Lead", value: "New Lead" },
  { label: "Free 15", value: "Free 15 Scheduled" },
  { label: "Follow Up", value: "Follow Up Needed" },
];

const outcomes = [
  "Became Client",
  "Thinking About It",
  "Follow Up Later",
  "Couldn't Afford It",
  "Went Another Direction",
  "No Show",
  "Cancelled",
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";

  const parsed = new Date(
    value.includes("T") ? value : `${value}T12:00:00`
  );

  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function matchesColumn(lead: Lead, column: string) {
  const status = lead.status || "New Lead";

  if (
    column === "Free 15" &&
    ["Free 15 Scheduled", "Free 15 Completed"].includes(status)
  ) {
    return true;
  }

  if (column === "Follow Up" && status === "Follow Up Needed") {
    return true;
  }

  return status === column;
}

export default function LeadsPage() {
  const router = useRouter();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  const [outcomeLead, setOutcomeLead] = useState<Lead | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [outcomeNotes, setOutcomeNotes] = useState("");

  async function loadLeads() {
    setLoading(true);
    setActionError("");

    const { data, error } = await supabase
      .from("intake_calls")
      .select("*")
      .is("archived_at", null)
      .not("status", "in", '("Past Free 15","No Show","Cancelled","Archived","Converted")')
      .order("id", { ascending: false });

    if (error) {
      setActionError(error.message);
      setLeads([]);
    } else {
      setLeads((data ?? []) as Lead[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadLeads();
  }, []);

  const counts = useMemo(
    () => ({
      total: leads.length,
      new: leads.filter((lead) => matchesColumn(lead, "New Lead")).length,
      free15: leads.filter((lead) => matchesColumn(lead, "Free 15")).length,
      followUp: leads.filter((lead) => matchesColumn(lead, "Follow Up")).length,
    }),
    [leads]
  );

  async function updateStatus(id: number, status: string) {
    setActionError("");
    setSavingId(id);

    const { error } = await supabase
      .from("intake_calls")
      .update({ status })
      .eq("id", id);

    if (error) {
      setActionError(error.message);
    } else {
      setLeads((current) =>
        current.map((lead) =>
          lead.id === id ? { ...lead, status } : lead
        )
      );
      setOpenMenu(null);
    }

    setSavingId(null);
  }

  function openOutcomeModal(lead: Lead) {
    setOutcomeLead(lead);
    setSelectedOutcome("");
    setFollowUpDate(lead.follow_up_date ?? "");
    setOutcomeNotes("");
    setOpenMenu(null);
  }

  async function saveOutcome() {
    if (!outcomeLead || !selectedOutcome) {
      setActionError("Choose an outcome before saving.");
      return;
    }

    setSavingId(outcomeLead.id);
    setActionError("");

    let nextStatus = "Past Free 15";

    if (selectedOutcome === "Became Client") {
      nextStatus = "Converted";
    } else if (selectedOutcome === "Thinking About It") {
      nextStatus = "Follow Up Needed";
    } else if (selectedOutcome === "Follow Up Later") {
      nextStatus = "Past Free 15";
    } else if (selectedOutcome === "No Show") {
      nextStatus = "No Show";
    } else if (selectedOutcome === "Cancelled") {
      nextStatus = "Cancelled";
    }

    const existingNotes = outcomeLead.notes?.trim();
    const addedNote = outcomeNotes.trim();
    const combinedNotes = addedNote
      ? [existingNotes, `Free 15 outcome note: ${addedNote}`]
          .filter(Boolean)
          .join("\n\n")
      : existingNotes || null;

    const { error } = await supabase
      .from("intake_calls")
      .update({
        status: nextStatus,
        outcome: selectedOutcome,
        outcome_date: today(),
        follow_up_date:
          selectedOutcome === "Thinking About It" ||
          selectedOutcome === "Follow Up Later"
            ? followUpDate || null
            : outcomeLead.follow_up_date,
        notes: combinedNotes,
      })
      .eq("id", outcomeLead.id);

    if (error) {
      setActionError(error.message);
      setSavingId(null);
      return;
    }

    const leadId = outcomeLead.id;
    setLeads((current) =>
      nextStatus === "Follow Up Needed"
        ? current.map((lead) =>
            lead.id === leadId
              ? {
                  ...lead,
                  status: nextStatus,
                  outcome: selectedOutcome,
                  outcome_date: today(),
                  follow_up_date: followUpDate || null,
                }
              : lead
          )
        : current.filter((lead) => lead.id !== leadId)
    );

    setOutcomeLead(null);
    setSavingId(null);

    if (selectedOutcome === "Became Client") {
      router.push(`/leads/${leadId}`);
    }
  }

  async function archiveLead(lead: Lead) {
    const reason =
      window.prompt(
        "Why are you archiving this lead? Examples: spam, duplicate, fake inquiry, asked to be removed."
      )?.trim() ?? "";

    if (!reason) return;

    const confirmed = window.confirm(
      `Archive ${lead.name || "this lead"}?`
    );

    if (!confirmed) return;

    setSavingId(lead.id);
    setActionError("");

    const { error } = await supabase
      .from("intake_calls")
      .update({
        status: "Archived",
        archived_at: new Date().toISOString(),
        archive_reason: reason,
      })
      .eq("id", lead.id);

    if (error) {
      setActionError(error.message);
    } else {
      setLeads((current) =>
        current.filter((currentLead) => currentLead.id !== lead.id)
      );
      setOpenMenu(null);
    }

    setSavingId(null);
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
      <header className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7f9975]">
            JGO Hire CRM
          </p>

          <h1 className="mt-2 text-3xl font-bold">Active Leads</h1>

          <p className="mt-2 text-sm text-[#708075]">
            Keep only current opportunities in your working pipeline.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/leads/past-free-15"
            className="rounded-xl border border-[#cbd8c4] bg-white px-4 py-3 text-sm font-semibold text-[#4d6247]"
          >
            Past Free 15s
          </Link>

          <Link
            href="/leads/no-shows"
            className="rounded-xl border border-[#cbd8c4] bg-white px-4 py-3 text-sm font-semibold text-[#4d6247]"
          >
            No Shows
          </Link>

          <Link
            href="/leads/archived"
            className="rounded-xl border border-[#cbd8c4] bg-white px-4 py-3 text-sm font-semibold text-[#4d6247]"
          >
            Archived
          </Link>

          <Link
            href="/leads/new"
            className="rounded-xl bg-[#647d5b] px-5 py-3 text-sm font-semibold text-white"
          >
            + Add Lead
          </Link>
        </div>
      </header>

      {actionError ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}

      <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Active Leads", counts.total],
          ["New Leads", counts.new],
          ["Free 15", counts.free15],
          ["Follow Ups", counts.followUp],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-[#708075]">{label}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-5 md:grid-cols-3">
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
                <h2 className="font-bold">{column}</h2>
                <span className="rounded-full bg-[#edf2e9] px-2 py-1 text-xs text-[#647d5b]">
                  {columnLeads.length}
                </span>
              </div>

              <div className="mt-5 space-y-4">
                {columnLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="relative rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm"
                  >
                    <Link href={`/leads/${lead.id}`}>
                      <h3 className="text-lg font-bold">
                        {lead.name || "Unnamed Lead"}
                      </h3>

                      <p className="mt-2 text-xs text-[#708075]">
                        {lead.call_type || lead.lead_source || "No source"}
                      </p>

                      {lead.services_discussed ? (
                        <p className="mt-4 text-xs font-medium text-[#647d5b]">
                          {lead.services_discussed}
                        </p>
                      ) : null}

                      <div className="mt-4 rounded-xl bg-[#f7f8f3] p-3">
                        <p className="text-[11px] text-[#708075]">
                          Free 15
                        </p>
                        <p className="text-sm font-medium">
                          {formatDate(lead.call_date)}
                        </p>
                      </div>

                      {lead.follow_up_date ? (
                        <p className="mt-3 text-xs text-[#8a968d]">
                          Follow up {formatDate(lead.follow_up_date)}
                        </p>
                      ) : null}

                      <p className="mt-4 text-xs font-semibold text-[#647d5b]">
                        View Lead →
                      </p>
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        setOpenMenu(
                          openMenu === lead.id ? null : lead.id
                        )
                      }
                      className="absolute bottom-4 right-4 rounded-full px-3 py-1 text-lg text-[#708075] hover:bg-[#f7f8f3]"
                    >
                      ⋮
                    </button>

                    {openMenu === lead.id ? (
                      <div className="absolute right-4 top-12 z-20 w-56 rounded-xl border border-[#dfe6db] bg-white p-2 shadow-lg">
                        <p className="px-3 py-2 text-xs font-semibold text-[#708075]">
                          Move To
                        </p>

                        {moveOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            disabled={savingId === lead.id}
                            onClick={() =>
                              updateStatus(lead.id, option.value)
                            }
                            className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#f7f8f3]"
                          >
                            {option.label}
                          </button>
                        ))}

                        <div className="my-2 border-t border-[#edf1e8]" />

                        <button
                          type="button"
                          onClick={() => openOutcomeModal(lead)}
                          className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#4d6247] hover:bg-[#f7f8f3]"
                        >
                          Complete Free 15
                        </button>

                        <Link
                          href={`/leads/${lead.id}/edit`}
                          className="block rounded-lg px-3 py-2 text-sm hover:bg-[#f7f8f3]"
                        >
                          Edit Lead
                        </Link>

                        <button
                          type="button"
                          onClick={() => archiveLead(lead)}
                          disabled={savingId === lead.id}
                          className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 disabled:opacity-50"
                        >
                          {savingId === lead.id ? "Saving..." : "Archive Lead"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}

                {columnLeads.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#dfe6db] p-6 text-center text-xs text-[#8a968d]">
                    No leads
                  </div>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>

      {outcomeLead ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7f9975]">
              Complete Free 15
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              {outcomeLead.name || "Lead"}
            </h2>

            <p className="mt-2 text-sm text-[#708075]">
              Choose what happened after the consultation.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {outcomes.map((outcome) => (
                <button
                  key={outcome}
                  type="button"
                  onClick={() => setSelectedOutcome(outcome)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold ${
                    selectedOutcome === outcome
                      ? "border-[#647d5b] bg-[#eef2e9] text-[#3f543b]"
                      : "border-[#dfe6db] bg-white text-[#4d6247]"
                  }`}
                >
                  {outcome}
                </button>
              ))}
            </div>

            {selectedOutcome === "Thinking About It" ||
            selectedOutcome === "Follow Up Later" ? (
              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold text-[#4d6247]">
                  Follow-Up Date
                </label>

                <input
                  type="date"
                  value={followUpDate}
                  onChange={(event) => setFollowUpDate(event.target.value)}
                  className="w-full rounded-xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3 text-sm outline-none focus:border-[#9fb294]"
                />
              </div>
            ) : null}

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-[#4d6247]">
                Outcome Notes
              </label>

              <textarea
                rows={4}
                value={outcomeNotes}
                onChange={(event) => setOutcomeNotes(event.target.value)}
                placeholder="Add anything you want to remember about the call."
                className="w-full rounded-xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3 text-sm outline-none focus:border-[#9fb294]"
              />
            </div>

            {selectedOutcome === "Became Client" ? (
              <p className="mt-4 rounded-xl bg-[#eef2e9] p-4 text-sm text-[#4d6247]">
                After saving, you will be taken to the lead page to complete the existing Convert to Client process.
              </p>
            ) : null}

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setOutcomeLead(null)}
                className="rounded-xl border border-[#d7e1d0] px-5 py-3 text-sm font-semibold text-[#4d6247]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveOutcome}
                disabled={!selectedOutcome || savingId === outcomeLead.id}
                className="rounded-xl bg-[#647d5b] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {savingId === outcomeLead.id
                  ? "Saving..."
                  : selectedOutcome === "Became Client"
                    ? "Save and Continue"
                    : "Save Outcome"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
