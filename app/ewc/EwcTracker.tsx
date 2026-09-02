"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  createEwcEntry,
  reorderEwcEntries,
  updateEwcEntry,
  updateEwcMoved,
  type EwcEntryType,
} from "./actions";

export type EwcEntry = {
  id: number;
  section: EwcEntryType;
  client_name: string;
  service_date: string | null;
  service_type: string;
  amount_owed: number;
  amount_paid: number;
  stripe_fee: number;
  date_paid: string | null;
  notes: string | null;
  moved: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type TextField = "client_name" | "service_date" | "service_type" | "date_paid" | "notes";
type MoneyField = "amount_owed" | "amount_paid" | "stripe_fee";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function parseMoney(value: string) {
  const parsed = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getOutstanding(row: EwcEntry) {
  return Math.max(Number(row.amount_owed || 0) - Number(row.amount_paid || 0), 0);
}

function MoneyInput({ value, onCommit }: { value: number; onCommit: (value: number) => void }) {
  const [draft, setDraft] = useState(Number(value || 0).toFixed(2));

  useEffect(() => setDraft(Number(value || 0).toFixed(2)), [value]);

  return (
    <input
      value={draft}
      inputMode="decimal"
      onFocus={(event) => event.currentTarget.select()}
      onChange={(event) => setDraft(event.target.value.replace(/[^0-9.-]/g, ""))}
      onBlur={() => {
        const parsed = parseMoney(draft);
        setDraft(parsed.toFixed(2));
        onCommit(parsed);
      }}
      className="h-full w-full border-0 bg-transparent px-2.5 py-2 text-right text-[13px] text-[#243128] outline-none focus:bg-white focus:shadow-[inset_0_0_0_2px_rgba(100,125,91,0.24)]"
    />
  );
}

export default function EwcTracker({ initialEntries }: { initialEntries: EwcEntry[] }) {
  const [entries, setEntries] = useState(initialEntries);
  const [dragged, setDragged] = useState<{ section: EwcEntryType; id: number } | null>(null);
  const [savedMessage, setSavedMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bySection = (section: EwcEntryType) =>
    entries.filter((entry) => entry.section === section).sort((a, b) => a.sort_order - b.sort_order);

  const sessions = useMemo(() => bySection("Session"), [entries]);
  const linkedin = useMemo(() => bySection("LinkedIn"), [entries]);
  const other = useMemo(() => bySection("Other"), [entries]);

  const totalMade = useMemo(() => {
    const grossReceived = entries.reduce((sum, row) => sum + Number(row.amount_paid || 0), 0);
    const stripeFees = entries.reduce((sum, row) => sum + Number(row.stripe_fee || 0), 0);
    return grossReceived - stripeFees;
  }, [entries]);

  function flashSaved(message = "Saved to Supabase") {
    setSavedMessage(message);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSavedMessage(""), 1600);
  }

  function updateLocal(
    id: number,
    field: TextField | MoneyField | "moved",
    value: string | number | boolean,
  ) {
    setEntries((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  }

  function rowFormData(row: EwcEntry, overrides: Partial<EwcEntry> = {}) {
    const next = { ...row, ...overrides };
    const formData = new FormData();
    formData.set("id", String(next.id));
    formData.set("client_name", next.client_name);
    formData.set("service_date", next.service_date ?? "");
    formData.set("service_type", next.service_type);
    formData.set("amount_owed", String(next.amount_owed ?? 0));
    formData.set("amount_paid", String(next.amount_paid ?? 0));
    formData.set("stripe_fee", String(next.stripe_fee ?? 0));
    formData.set("date_paid", next.date_paid ?? "");
    formData.set("notes", next.notes ?? "");
    return formData;
  }

  function persistRow(row: EwcEntry, overrides: Partial<EwcEntry> = {}) {
    const formData = rowFormData(row, overrides);
    startTransition(async () => {
      try {
        await updateEwcEntry(formData);
        flashSaved();
      } catch (error) {
        console.error(error);
        flashSaved("Could not save");
      }
    });
  }

  function addRow(section: EwcEntryType) {
    startTransition(async () => {
      try {
        const row = (await createEwcEntry(section)) as EwcEntry;
        setEntries((current) => [row, ...current]);
        flashSaved(`${section} row added`);
      } catch (error) {
        console.error(error);
        flashSaved("Could not add row");
      }
    });
  }

  function archiveRow(row: EwcEntry) {
    if (
      !window.confirm(
        `Are you sure you want to archive ${row.client_name || "this client"}${row.service_type ? ` - ${row.service_type}` : ""}? It will be removed from this EWC client list but kept safely in JGO OS.`,
      )
    ) {
      return;
    }

    const formData = rowFormData(row);
    startTransition(async () => {
      try {
        await updateEwcEntry(formData);
        await updateEwcMoved(row.id, true);
        setEntries((current) => current.filter((entry) => entry.id !== row.id));
        flashSaved("Archived and saved");
      } catch (error) {
        console.error(error);
        flashSaved("Could not archive");
      }
    });
  }

  function reorderWithinSection(section: EwcEntryType, targetId: number) {
    if (!dragged || dragged.section !== section || dragged.id === targetId) return;

    const rows = bySection(section);
    const from = rows.findIndex((row) => row.id === dragged.id);
    const to = rows.findIndex((row) => row.id === targetId);
    if (from < 0 || to < 0) return;

    const reordered = [...rows];
    const [movedRow] = reordered.splice(from, 1);
    reordered.splice(to, 0, movedRow);
    const orderMap = new Map(reordered.map((row, index) => [row.id, index + 1]));

    setEntries((current) =>
      current.map((row) =>
        row.section === section ? { ...row, sort_order: orderMap.get(row.id) ?? row.sort_order } : row,
      ),
    );
    setDragged(null);

    startTransition(async () => {
      try {
        await reorderEwcEntries(
          section,
          reordered.map((row) => row.id),
        );
        flashSaved("Order saved");
      } catch (error) {
        console.error(error);
        flashSaved("Could not reorder");
      }
    });
  }

  const inputClass =
    "h-full w-full border-0 bg-transparent px-2.5 py-2 text-[13px] text-[#243128] outline-none focus:bg-white focus:shadow-[inset_0_0_0_2px_rgba(100,125,91,0.24)]";
  const dateInputClass =
    "h-full w-full min-w-0 border-0 bg-transparent px-1.5 py-2 text-[11px] text-[#243128] outline-none focus:bg-white focus:shadow-[inset_0_0_0_2px_rgba(100,125,91,0.24)]";

  function StandardTable({ section, rows }: { section: "Session" | "Other"; rows: EwcEntry[] }) {
    return (
      <section className="overflow-hidden rounded-2xl border border-[#dfe6db] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#dfe6db] bg-[#fbfaf6] px-5 py-4">
          <div>
            <h2 className="text-xl font-bold text-[#243128]">
              {section === "Session" ? "Sessions" : "Other"}
            </h2>
            <p className="mt-1 text-sm text-[#708075]">Newest entries stay at the top. All edits auto-save.</p>
          </div>
          <button
            type="button"
            onClick={() => addRow(section)}
            disabled={isPending}
            className="rounded-xl bg-[#647d5b] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            + Add {section === "Session" ? "Session" : "Other"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[1060px]">
            <div className="grid grid-cols-[44px_205px_92px_145px_110px_110px_120px_1fr_38px] border-b border-[#dfe6db] bg-[#eef2ea] text-[9px] font-bold uppercase tracking-[0.08em] text-[#647066]">
              {['#', 'Client', 'Date', 'Service', 'Owed', 'Paid', 'Outstanding', 'Notes', ''].map(
                (label, index) => (
                  <div key={`${label}-${index}`} className="border-r border-[#dfe6db] px-2 py-2.5 text-center">
                    {label}
                  </div>
                ),
              )}
            </div>

            {rows.length === 0 ? <div className="p-10 text-center text-sm text-[#708075]">No entries yet.</div> : null}

            {rows.map((row, index) => (
              <div
                key={row.id}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => reorderWithinSection(section, row.id)}
                className={`group grid grid-cols-[44px_205px_92px_145px_110px_110px_120px_1fr_38px] border-b border-[#edf0ea] ${index % 2 ? 'bg-[#fcfdfb]' : 'bg-white'}`}
              >
                <button type="button" draggable onDragStart={() => setDragged({ section, id: row.id })} className="cursor-grab border-r border-[#edf0ea] text-[#a5aea6]">⋮⋮</button>
                <input value={row.client_name} onChange={(event) => updateLocal(row.id, 'client_name', event.target.value)} onBlur={() => persistRow(row)} placeholder="Client name" className={`${inputClass} border-r border-[#edf0ea]`} />
                <input type="date" value={row.service_date ?? ''} onChange={(event) => { updateLocal(row.id, 'service_date', event.target.value); persistRow(row, { service_date: event.target.value }); }} className={`${dateInputClass} border-r border-[#edf0ea]`} />
                <input value={row.service_type} onChange={(event) => updateLocal(row.id, 'service_type', event.target.value)} onBlur={() => persistRow(row)} placeholder="Service" className={`${inputClass} border-r border-[#edf0ea]`} />
                <MoneyInput value={row.amount_owed} onCommit={(value) => { updateLocal(row.id, 'amount_owed', value); persistRow(row, { amount_owed: value }); }} />
                <MoneyInput value={row.amount_paid} onCommit={(value) => { updateLocal(row.id, 'amount_paid', value); persistRow(row, { amount_paid: value }); }} />
                <div className="flex items-center justify-end border-r border-[#edf0ea] bg-[#fbf6f3] px-2.5 text-xs font-semibold text-[#9a554d]">{money(getOutstanding(row))}</div>
                <input value={row.notes ?? ''} onChange={(event) => updateLocal(row.id, 'notes', event.target.value)} onBlur={() => persistRow(row)} placeholder="Notes" className={`${inputClass} border-r border-[#edf0ea]`} />
                <div className="flex items-center justify-center"><button type="button" onClick={() => archiveRow(row)} className="flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium text-[#a8aea8] transition hover:bg-[#f1f2ef] hover:text-[#7b847c]" aria-label={`Archive ${row.client_name || 'client'}`} title="Archive">×</button></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  function LinkedInTable({ rows }: { rows: EwcEntry[] }) {
    return (
      <section className="overflow-hidden rounded-2xl border border-[#dfe6db] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#dfe6db] bg-[#fbfaf6] px-5 py-4">
          <div><h2 className="text-xl font-bold text-[#243128]">LinkedIn</h2><p className="mt-1 text-sm text-[#708075]">Newest entries stay at the top. All edits auto-save.</p></div>
          <button type="button" onClick={() => addRow("LinkedIn")} disabled={isPending} className="rounded-xl bg-[#647d5b] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">+ Add LinkedIn Client</button>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-[44px_205px_92px_150px_115px_115px_135px_1fr_38px] border-b border-[#dfe6db] bg-[#eef2ea] text-[9px] font-bold uppercase tracking-[0.08em] text-[#647066]">
              {['#', 'Client', 'Date', 'Service', 'Paid', 'Stripe Fee', 'Total Received', 'Notes', ''].map((label, index) => <div key={`${label}-${index}`} className="border-r border-[#dfe6db] px-2 py-2.5 text-center">{label}</div>)}
            </div>

            {rows.length === 0 ? <div className="p-10 text-center text-sm text-[#708075]">No LinkedIn entries yet.</div> : null}

            {rows.map((row, index) => (
              <div key={row.id} onDragOver={(event) => event.preventDefault()} onDrop={() => reorderWithinSection("LinkedIn", row.id)} className={`group grid grid-cols-[44px_205px_92px_150px_115px_115px_135px_1fr_38px] border-b border-[#edf0ea] ${index % 2 ? 'bg-[#fcfdfb]' : 'bg-white'}`}>
                <button type="button" draggable onDragStart={() => setDragged({ section: "LinkedIn", id: row.id })} className="cursor-grab border-r border-[#edf0ea] text-[#a5aea6]">⋮⋮</button>
                <input value={row.client_name} onChange={(event) => updateLocal(row.id, 'client_name', event.target.value)} onBlur={() => persistRow(row)} placeholder="Client name" className={`${inputClass} border-r border-[#edf0ea]`} />
                <input type="date" value={row.service_date ?? ''} onChange={(event) => { updateLocal(row.id, 'service_date', event.target.value); persistRow(row, { service_date: event.target.value }); }} className={`${dateInputClass} border-r border-[#edf0ea]`} />
                <input value={row.service_type} onChange={(event) => updateLocal(row.id, 'service_type', event.target.value)} onBlur={() => persistRow(row)} placeholder="LinkedIn service" className={`${inputClass} border-r border-[#edf0ea]`} />
                <MoneyInput value={row.amount_paid} onCommit={(value) => { updateLocal(row.id, 'amount_paid', value); persistRow(row, { amount_paid: value }); }} />
                <MoneyInput value={row.stripe_fee} onCommit={(value) => { updateLocal(row.id, 'stripe_fee', value); persistRow(row, { stripe_fee: value }); }} />
                <div className="flex items-center justify-end border-r border-[#edf0ea] bg-[#f5f8f2] px-2.5 text-xs font-bold text-[#56754f]">{money(Number(row.amount_paid || 0) - Number(row.stripe_fee || 0))}</div>
                <input value={row.notes ?? ''} onChange={(event) => updateLocal(row.id, 'notes', event.target.value)} onBlur={() => persistRow(row)} placeholder="Notes" className={`${inputClass} border-r border-[#edf0ea]`} />
                <div className="flex items-center justify-center"><button type="button" onClick={() => archiveRow(row)} className="flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium text-[#a8aea8] transition hover:bg-[#f1f2ef] hover:text-[#7b847c]" aria-label={`Archive ${row.client_name || 'client'}`} title="Archive">×</button></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-w-0 flex-1 bg-[#f7f8f3] text-[#243128]">
      <header className="border-b border-[#dfe6db] bg-[#fbfaf6] px-6 py-7 lg:px-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7f9975]">Emily Weiss Consulting</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">EWC</h1>
      </header>

      <div className="space-y-7 p-6 lg:p-10">
        <section className="max-w-sm rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7f8d82]">Total Made</p>
          <p className="mt-2 text-3xl font-bold text-[#56754f]">{money(totalMade)}</p>
        </section>

        <div className="flex items-center justify-between rounded-xl border border-[#dfe6db] bg-white px-4 py-3 text-xs text-[#708075]">
          <span>Everything auto-saves to Supabase. Archived rows stay safely stored in JGO OS.</span>
          <span className="font-semibold text-[#647d5b]">{isPending ? "Saving..." : savedMessage || "Auto-saved"}</span>
        </div>

        <StandardTable section="Session" rows={sessions} />
        <LinkedInTable rows={linkedin} />
        <StandardTable section="Other" rows={other} />
      </div>
    </section>
  );
}
