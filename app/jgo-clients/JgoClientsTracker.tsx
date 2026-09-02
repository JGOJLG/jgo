"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { createJgoClientRow, deleteJgoClientRow, updateJgoClientRow } from "./actions";

export type JgoClientRow = {
  service_id: number;
  client_id: number;
  client_name: string;
  service_date: string | null;
  service: string;
  amount_owed: number;
  amount_received: number;
  payment_date: string | null;
  payment_method: string | null;
  payment_status: string | null;
  notes: string | null;
  moved: boolean;
};

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function parseMoney(value: string) {
  const parsed = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function outstanding(row: JgoClientRow) {
  return Math.max(Number(row.amount_owed || 0) - Number(row.amount_received || 0), 0);
}

function appliedPayment(row: JgoClientRow) {
  return Math.min(Math.max(Number(row.amount_received || 0), 0), Math.max(Number(row.amount_owed || 0), 0));
}

function extraPayment(row: JgoClientRow) {
  return Math.max(Number(row.amount_received || 0) - Number(row.amount_owed || 0), 0);
}

export default function JgoClientsTracker({ initialRows }: { initialRows: JgoClientRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const totals = useMemo(
    () =>
      rows.reduce(
        (sum, row) => ({
          owed: sum.owed + Number(row.amount_owed || 0),
          paid: sum.paid + appliedPayment(row),
          extra: sum.extra + extraPayment(row),
          outstanding: sum.outstanding + outstanding(row),
        }),
        { owed: 0, paid: 0, extra: 0, outstanding: 0 },
      ),
    [rows],
  );

  const sortedRows = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const aDate = a.service_date ? Date.parse(`${a.service_date}T12:00:00`) : 0;
        const bDate = b.service_date ? Date.parse(`${b.service_date}T12:00:00`) : 0;
        if (bDate !== aDate) return bDate - aDate;
        return b.service_id - a.service_id;
      }),
    [rows],
  );

  function flash(messageText: string) {
    setMessage(messageText);
    window.setTimeout(() => setMessage(""), 1600);
  }

  function updateLocal(id: number, field: keyof JgoClientRow, value: string | number | boolean) {
    setRows((current) => current.map((row) => (row.service_id === id ? { ...row, [field]: value } : row)));
  }

  function rowFormData(row: JgoClientRow, overrides: Partial<JgoClientRow> = {}) {
    const next = { ...row, ...overrides };
    const fd = new FormData();
    fd.set("clientId", String(next.client_id));
    fd.set("serviceId", String(next.service_id));
    fd.set("clientName", next.client_name);
    fd.set("serviceDate", next.service_date || "");
    fd.set("service", next.service);
    fd.set("amountOwed", String(next.amount_owed || 0));
    fd.set("amountReceived", String(next.amount_received || 0));
    fd.set("paymentDate", next.payment_date || "");
    fd.set("paymentMethod", next.payment_method || "");
    fd.set("notes", next.notes || "");
    return fd;
  }

  function save(row: JgoClientRow, overrides: Partial<JgoClientRow> = {}) {
    const fd = rowFormData(row, overrides);
    startTransition(async () => {
      try {
        await updateJgoClientRow(fd);
        flash("Saved to Supabase");
      } catch (error) {
        console.error(error);
        setMessage("Could not save");
      }
    });
  }

  function archiveRow(row: JgoClientRow) {
    if (!window.confirm(`Archive ${row.client_name} - ${row.service}? It will be removed from this ledger but kept safely in JGO OS.`)) return;

    const saveData = rowFormData(row);
    const archiveData = new FormData();
    archiveData.set("clientId", String(row.client_id));
    archiveData.set("serviceId", String(row.service_id));

    startTransition(async () => {
      try {
        await updateJgoClientRow(saveData);
        await deleteJgoClientRow(archiveData);
        setRows((current) => current.filter((item) => item.service_id !== row.service_id));
        flash("Archived and saved");
      } catch (error) {
        console.error(error);
        setMessage("Could not archive");
      }
    });
  }

  const inputClass = "h-full w-full border-0 bg-transparent px-2.5 py-2 text-[13px] text-[#243128] outline-none focus:bg-white focus:shadow-[inset_0_0_0_2px_rgba(100,125,91,0.24)]";
  const dateInputClass = "h-full w-full min-w-0 border-0 bg-transparent px-1.5 py-2 text-[11px] text-[#243128] outline-none focus:bg-white focus:shadow-[inset_0_0_0_2px_rgba(100,125,91,0.24)]";
  const mobileFieldClass = "w-full rounded-xl border border-[#dfe6db] bg-white px-3 py-2.5 text-base text-[#243128] outline-none focus:border-[#9eb095]";

  return (
    <section className="min-w-0 flex-1 bg-[#f7f8f3] p-4 sm:p-5 lg:p-8 xl:p-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7f9975]">Live backup tracker</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#243128]">JGO Clients</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#708075]">Spreadsheet-style view of your real client records. Changes save to Supabase and sync back to the client profile, Revenue, and Outstanding.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Link href="/clients" className="flex min-h-11 items-center justify-center rounded-xl border border-[#cbd8c4] bg-white px-3 py-2.5 text-center text-sm font-semibold text-[#4d6247] sm:px-4">Client Profiles</Link>
          <button onClick={() => setShowAdd((value) => !value)} className="min-h-11 rounded-xl bg-[#647d5b] px-3 py-2.5 text-sm font-semibold text-white sm:px-4">+ Add Client Row</button>
        </div>
      </div>

      {showAdd ? (
        <form action={createJgoClientRow} onSubmit={() => setShowAdd(false)} className="mt-5 grid gap-3 rounded-2xl border border-[#dfe6db] bg-white p-4 md:grid-cols-[1.2fr_1fr_130px_150px_auto]">
          <input name="clientName" required placeholder="Client name" className="rounded-xl border border-[#dfe6db] px-3 py-2.5 text-base md:text-sm" />
          <input name="service" placeholder="Service" className="rounded-xl border border-[#dfe6db] px-3 py-2.5 text-base md:text-sm" />
          <input name="serviceDate" type="date" className="rounded-xl border border-[#dfe6db] px-2 py-2.5 text-base md:text-xs" />
          <input name="amountOwed" inputMode="decimal" placeholder="Amount owed" className="rounded-xl border border-[#dfe6db] px-3 py-2.5 text-base md:text-sm" />
          <button disabled={isPending} className="min-h-11 rounded-xl bg-[#647d5b] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">Create</button>
        </form>
      ) : null}

      <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#dfe6db] bg-white p-4 shadow-sm sm:p-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7f8d82]">Total Invoiced</p><p className="mt-2 text-2xl font-bold text-[#243128]">{currency(totals.owed)}</p></div>
        <div className="rounded-2xl border border-[#dfe6db] bg-white p-4 shadow-sm sm:p-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7f8d82]">Paid Toward Invoices</p><p className="mt-2 text-2xl font-bold text-[#243128]">{currency(totals.paid)}</p>{totals.extra > 0 ? <p className="mt-1 text-xs font-semibold text-[#7f8d82]">+ {currency(totals.extra)} extra received</p> : null}</div>
        <div className="rounded-2xl border border-[#dfe6db] bg-white p-4 shadow-sm sm:p-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7f8d82]">Outstanding</p><p className="mt-2 text-2xl font-bold text-[#243128]">{currency(totals.outstanding)}</p></div>
      </section>

      <div className="mt-6 overflow-hidden rounded-2xl border border-[#dfe6db] bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-[#dfe6db] bg-[#fbfaf6] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div><h2 className="text-xl font-bold text-[#243128]">Client Ledger</h2><p className="mt-1 text-sm text-[#708075]">Edits auto-save. Archive keeps the record safely stored in JGO OS.</p></div>
          <span className="text-xs font-semibold text-[#647d5b]">{message || (isPending ? "Saving..." : "Auto-saved")}</span>
        </div>

        <div className="p-3 md:hidden">
          {rows.length === 0 ? <div className="p-8 text-center text-sm text-[#708075]">No client services yet.</div> : null}
          <div className="space-y-3">
            {sortedRows.map((row) => (
              <article key={row.service_id} className="relative rounded-2xl border border-[#e1e7de] bg-white p-4 shadow-sm">
                <button type="button" onClick={() => archiveRow(row)} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-lg font-medium text-[#a8aea8] active:bg-[#f1f2ef]" aria-label={`Archive ${row.client_name}`} title="Archive">×</button>
                <div className="pr-10">
                  <input value={row.client_name} onChange={(event) => updateLocal(row.service_id, "client_name", event.target.value)} onBlur={() => save(row)} className="w-full border-0 bg-transparent p-0 text-lg font-bold text-[#243128] outline-none" aria-label="Client name" />
                  <input value={row.service} onChange={(event) => updateLocal(row.service_id, "service", event.target.value)} onBlur={() => save(row)} className="mt-1 w-full border-0 bg-transparent p-0 text-sm font-medium text-[#657067] outline-none" aria-label="Service" />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7f8d82]">Date<input type="date" value={row.service_date || ""} onChange={(event) => { updateLocal(row.service_id, "service_date", event.target.value); save(row, { service_date: event.target.value }); }} className={`${mobileFieldClass} mt-1`} /></label>
                  <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7f8d82]">Method<select value={row.payment_method || ""} onChange={(event) => { updateLocal(row.service_id, "payment_method", event.target.value); save(row, { payment_method: event.target.value }); }} className={`${mobileFieldClass} mt-1`}><option value="">Method</option><option>Venmo</option><option>Zelle</option><option>Card</option><option>Cash</option><option>Check</option><option>Other</option></select></label>
                  <MobileMoneyField label="Owed" value={row.amount_owed} onSave={(value) => { updateLocal(row.service_id, "amount_owed", value); save(row, { amount_owed: value }); }} />
                  <MobileMoneyField label="Paid" value={row.amount_received} onSave={(value) => { updateLocal(row.service_id, "amount_received", value); save(row, { amount_received: value }); }} />
                  <div className="rounded-xl bg-[#fbf6f3] px-3 py-2.5"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9a7772]">Outstanding</p><p className="mt-1 text-sm font-bold text-[#9a554d]">{currency(outstanding(row))}</p></div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7f8d82]">Date Paid<input type="date" value={row.payment_date || ""} onChange={(event) => { updateLocal(row.service_id, "payment_date", event.target.value); save(row, { payment_date: event.target.value }); }} className={`${mobileFieldClass} mt-1`} /></label>
                </div>

                <Link href={`/clients/${row.client_id}`} className="mt-4 flex min-h-11 w-full items-center justify-center rounded-xl border border-[#cbd8c4] bg-[#f8faf6] text-sm font-bold text-[#647d5b]">Open Client Profile</Link>
              </article>
            ))}
          </div>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <div className="min-w-[1080px]">
            <div className="grid grid-cols-[190px_92px_175px_105px_105px_115px_105px_105px_70px_38px] border-b border-[#dfe6db] bg-[#eef2ea] text-[9px] font-bold uppercase tracking-[0.08em] text-[#647066]">
              {["Client", "Date", "Service", "Owed", "Paid", "Outstanding", "Date Paid", "Method", "Profile", ""].map((label, index) => <div key={`${label}-${index}`} className="border-r border-[#dfe6db] px-2 py-2.5 text-center">{label}</div>)}
            </div>
            {rows.length === 0 ? <div className="p-10 text-center text-sm text-[#708075]">No client services yet.</div> : null}
            {sortedRows.map((row, index) => (
              <div key={row.service_id} className={`grid grid-cols-[190px_92px_175px_105px_105px_115px_105px_105px_70px_38px] border-b border-[#edf0ea] ${index % 2 ? "bg-[#fcfdfb]" : "bg-white"}`}>
                <input value={row.client_name} onChange={(event) => updateLocal(row.service_id, "client_name", event.target.value)} onBlur={() => save(row)} className={`${inputClass} border-r border-[#edf0ea]`} />
                <input type="date" value={row.service_date || ""} onChange={(event) => { updateLocal(row.service_id, "service_date", event.target.value); save(row, { service_date: event.target.value }); }} className={`${dateInputClass} border-r border-[#edf0ea]`} />
                <input value={row.service} onChange={(event) => updateLocal(row.service_id, "service", event.target.value)} onBlur={() => save(row)} className={`${inputClass} border-r border-[#edf0ea]`} />
                <MoneyCell value={row.amount_owed} onSave={(value) => { updateLocal(row.service_id, "amount_owed", value); save(row, { amount_owed: value }); }} />
                <MoneyCell value={row.amount_received} onSave={(value) => { updateLocal(row.service_id, "amount_received", value); save(row, { amount_received: value }); }} />
                <div className="flex items-center justify-end border-r border-[#edf0ea] bg-[#fbf6f3] px-2.5 text-xs font-semibold text-[#9a554d]">{currency(outstanding(row))}</div>
                <input type="date" value={row.payment_date || ""} onChange={(event) => { updateLocal(row.service_id, "payment_date", event.target.value); save(row, { payment_date: event.target.value }); }} className={`${dateInputClass} border-r border-[#edf0ea]`} />
                <select value={row.payment_method || ""} onChange={(event) => { updateLocal(row.service_id, "payment_method", event.target.value); save(row, { payment_method: event.target.value }); }} className={`${inputClass} border-r border-[#edf0ea]`}><option value="">Method</option><option>Venmo</option><option>Zelle</option><option>Card</option><option>Cash</option><option>Check</option><option>Other</option></select>
                <div className="flex items-center justify-center border-r border-[#edf0ea]"><Link href={`/clients/${row.client_id}`} className="text-[11px] font-bold text-[#647d5b] hover:underline">Open</Link></div>
                <div className="flex items-center justify-center"><button type="button" onClick={() => archiveRow(row)} className="flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium text-[#a8aea8] transition hover:bg-[#f1f2ef] hover:text-[#7b847c]" aria-label={`Archive ${row.client_name}`} title="Archive">×</button></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function MoneyCell({ value, onSave }: { value: number; onSave: (value: number) => void }) {
  const [draft, setDraft] = useState(Number(value || 0).toFixed(2));
  return <input value={draft} inputMode="decimal" onFocus={(event) => event.currentTarget.select()} onChange={(event) => setDraft(event.target.value.replace(/[^0-9.-]/g, ""))} onBlur={() => { const parsed = parseMoney(draft); setDraft(parsed.toFixed(2)); onSave(parsed); }} className="h-full w-full border-0 border-r border-[#edf0ea] bg-transparent px-2.5 py-2 text-right text-[13px] text-[#243128] outline-none focus:bg-white focus:shadow-[inset_0_0_0_2px_rgba(100,125,91,0.24)]" />;
}

function MobileMoneyField({ label, value, onSave }: { label: string; value: number; onSave: (value: number) => void }) {
  const [draft, setDraft] = useState(Number(value || 0).toFixed(2));
  return (
    <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7f8d82]">{label}
      <input value={draft} inputMode="decimal" onFocus={(event) => event.currentTarget.select()} onChange={(event) => setDraft(event.target.value.replace(/[^0-9.-]/g, ""))} onBlur={() => { const parsed = parseMoney(draft); setDraft(parsed.toFixed(2)); onSave(parsed); }} className="mt-1 w-full rounded-xl border border-[#dfe6db] bg-white px-3 py-2.5 text-base font-normal normal-case tracking-normal text-[#243128] outline-none focus:border-[#9eb095]" />
    </label>
  );
}
