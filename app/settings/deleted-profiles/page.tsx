"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

type BackupRow = {
  backup_id: number;
  client_id: number;
  event_type: string;
  snapshot: Record<string, any>;
  recorded_at: string;
};

function listCount(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

function prettyDate(value?: string | null) {
  if (!value) return "Unknown date";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function DeletedProfilesPage() {
  const [rows, setRows] = useState<BackupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    void loadBackups();
  }, []);

  async function loadBackups() {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error: loadError } = await supabase
      .from("client_profile_backups")
      .select("backup_id, client_id, event_type, snapshot, recorded_at")
      .order("recorded_at", { ascending: false });

    if (loadError) {
      setError(`Backups could not be loaded: ${loadError.message}`);
      setLoading(false);
      return;
    }

    setRows((data ?? []) as BackupRow[]);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) => {
      const client = row.snapshot?.client ?? {};
      return [client.name, client.email, client.phone, String(row.client_id)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [query, rows]);

  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#243128]">
      <header className="border-b border-[#dfe6db] bg-[#fbfaf6] px-6 py-7 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <Link href="/settings" className="text-sm font-semibold text-[#7f9975] hover:text-[#4d6247]">
            ← Back to Settings
          </Link>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Deleted Profiles & Backups</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#708075]">
                Permanent safety history for client profiles removed from the active list. Future archived clients are automatically snapshotted before they can ever disappear from view.
              </p>
            </div>
            <div className="rounded-2xl border border-[#d7e1d0] bg-white px-5 py-3 text-center">
              <div className="text-2xl font-bold text-[#4d6247]">{rows.length}</div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[#849080]">Backups</div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl p-6 lg:p-10">
        <div className="mb-6 rounded-2xl border border-[#dfe6db] bg-[#eef3ea] p-4 text-sm leading-6 text-[#53624f]">
          <strong>Safety rule:</strong> JGO OS no longer permanently deletes client profiles. Archive is the removal method. This screen is the backup ledger so there is always a record of who was removed and what data was attached at the time.
        </div>

        <div className="mb-5">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search deleted or archived profiles..."
            className="w-full rounded-xl border border-[#d7e1d0] bg-white px-4 py-3 text-sm outline-none placeholder:text-[#9aa59c] focus:border-[#9fb294] focus:ring-2 focus:ring-[#e8eee3]"
          />
        </div>

        {error ? <div className="mb-5 rounded-xl border border-[#ead4d0] bg-[#fbefed] px-4 py-3 text-sm font-semibold text-[#9a554d]">{error}</div> : null}

        <section className="overflow-hidden rounded-3xl border border-[#dfe6db] bg-white shadow-sm">
          {loading ? (
            <div className="p-8 text-sm font-semibold text-[#708075]">Loading profile backups...</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#708075]">No matching profile backups.</div>
          ) : (
            <div className="divide-y divide-[#e7ece3]">
              {filtered.map((row) => {
                const client = row.snapshot?.client ?? {};
                const isOpen = expanded === row.backup_id;
                return (
                  <div key={row.backup_id} className="px-6 py-5 lg:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-bold text-[#344331]">{client.name || `Client #${row.client_id}`}</h2>
                          <span className="rounded-full bg-[#f2eee8] px-2.5 py-1 text-xs font-semibold text-[#806f5f]">
                            {row.event_type === "archived" ? "Archived" : "Legacy Deleted"}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-[#708075]">
                          Client #{row.client_id} · Backed up {prettyDate(row.recorded_at)}
                        </p>
                        <p className="mt-1 text-xs text-[#8b958c]">
                          {client.email || "No email saved"}{client.phone ? ` · ${client.phone}` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : row.backup_id)}
                        className="rounded-xl border border-[#d7e1d0] bg-white px-4 py-2.5 text-sm font-semibold text-[#4d6247] hover:bg-[#f5f7f2]"
                      >
                        {isOpen ? "Hide Backup" : "View Backup"}
                      </button>
                    </div>

                    {isOpen ? (
                      <div className="mt-5 rounded-2xl border border-[#e2e8de] bg-[#fafbf8] p-5">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <BackupStat label="Notes" value={listCount(row.snapshot?.notes)} />
                          <BackupStat label="Services" value={listCount(row.snapshot?.services)} />
                          <BackupStat label="Timeline" value={listCount(row.snapshot?.timeline)} />
                          <BackupStat label="Payments" value={listCount(row.snapshot?.payments)} />
                          <BackupStat label="Appointments" value={listCount(row.snapshot?.appointments)} />
                          <BackupStat label="Calendar" value={listCount(row.snapshot?.calendar_events)} />
                          <BackupStat label="Files" value={listCount(row.snapshot?.files)} />
                          <BackupStat label="Tasks" value={listCount(row.snapshot?.tasks)} />
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          <Detail label="Service" value={client.service} />
                          <Detail label="Client Type" value={client.client_type} />
                          <Detail label="Payment Status" value={client.payment_status} />
                          <Detail label="Intake Date" value={client.intake_date} />
                          <Detail label="Company" value={client.company} />
                          <Detail label="Lead Source" value={client.lead_source} />
                        </div>

                        {row.event_type === "legacy_deleted" ? (
                          <p className="mt-5 rounded-xl bg-[#fff7e8] px-4 py-3 text-xs leading-5 text-[#816d48]">
                            This record predates the new backup system. Only data that survived the original deletion can be shown here. Future archives preserve the full available snapshot automatically.
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function BackupStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#e1e7dd] bg-white px-4 py-3">
      <div className="text-lg font-bold text-[#4d6247]">{value}</div>
      <div className="text-xs font-semibold text-[#849080]">{label}</div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-[#8b958c]">{label}</div>
      <div className="mt-1 text-sm font-semibold text-[#3d4d39]">{value ? String(value) : "Not saved"}</div>
    </div>
  );
}
