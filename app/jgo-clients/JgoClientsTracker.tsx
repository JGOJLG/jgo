"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { createJgoClientRow, updateJgoClientRow } from "./actions";

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

function extra(row: JgoClientRow) {
  return Math.max(Number(row.amount_received || 0) - Number(row.amount_owed || 0), 0);
}

export default function JgoClientsTracker({ initialRows }: { initialRows: JgoClientRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const totals = useMemo(() => {
    return rows.reduce(
      (sum, row) => ({
        owed: sum.owed + Number(row.amount_owed || 0),
        received: sum.received + Number(row.amount_received || 0),
        outstanding: sum.outstanding + outstanding(row),
        extra: sum.extra + extra(row),
      }),
      { owed: 0, received: 0, outstanding: 0, extra: 0 },
    );
  }, [rows]);

  function updateLocal(id: number, field: keyof JgoClientRow, value: string | number) {
    setRows((current) => current.map((row) => (row.service_id === id ? { ...row, [field]: value } : row)));
  }

  function save(row: JgoClientRow, overrides: Partial<JgoClientRow> = {}) {
    const next = { ...row, ...overrides };
    const formData = new FormData();
    formData.set("clientId", String(next.client_id));
    formData.set("serviceId", String(next.service_id));
    formData.set("clientName", next.client_name);
    formData.set("serviceDate", next.service_date || "");
    formData.set("service", next.service);
    formData.set("amountOwed", String(next.amount_owed || 0));
    formData.set("amountReceived", String(next.amount_received || 0));
    formData.set("paymentDate", next.payment_date || "");
    formData.set("paymentMethod", next.payment_method || "");
    formData.set("notes", next.notes || "");

    startTransition(async () => {
      try {
        await updateJgoClientRow(formData);
        setMessage("Saved and synced everywhere");
        window.setTimeout(() => setMessage(""), 1600);
      } catch (error) {
        console.error(error);
        setMessage("Could not save");
      }
    });
  }

  const inputClass = "h-full w-full border-0 bg-transparent px-3 py-2.5 text-sm text-[#243128] outline-none focus:bg-white focus:shadow-[inset_0_0_0_2px_rgba(100,125,91,0.24)]";

  return (
    <section className="min-w-0 flex-1 bg-[#f7f8f3] p-5 lg:p-8 xl:p-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7f9975]">Live backup tracker</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#243128]">JGO Clients</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#708075]">
            Spreadsheet-style view of your real client records. Changes here update the client profile, Revenue, and Outstanding. Changes made on a client profile flow back here because this page uses the same live records.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/clients" className="rounded-xl border border-[#cbd8c4] bg-white px-4 py-2.5 text-sm font-semibold text-[#4d6247]">Client Profiles</Link>
          <button onClick={() => setShowAdd((value) => !value)} className="rounded-xl bg-[#647d5b] px-4 py-2.5 text-sm font-semibold text-white">+ Add Client Row</button>
        </div>
      </div>

      {showAdd ? (
        <form
          action={createJgoClientRow}
          onSubmit={() => setShowAdd(false)}
          className="mt-5 grid gap-3 rounded-2xl border border-[#dfe6db] bg-white p-4 md:grid-cols-[1.2fr_1fr_160px_150px_auto]"
        >
          <input name="clientName" required placeholder="Client name" className="rounded-xl border border-[#dfe6db] px-3 py-2.5 text-sm" />
          <input name="service" placeholder="Service" className="rounded-xl border border-[#dfe6db] px-3 py-2.5 text-sm" />
          <input name="serviceDate" type="date" className="rounded-xl border border-[#dfe6db] px-3 py-2.5 text-sm" />
          <input name="amountOwed" inputMode="decimal" placeholder="Amount owed" className="rounded-xl border border-[#dfe6db] px-3 py-2.5 text-sm" />
          <button disabled={isPending} className="rounded-xl bg-[#647d5b] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">Create</button>
        </form>
      ) : null}

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total Invoiced", totals.owed],
          ["Actual Revenue", totals.received],
          ["Outstanding", totals.outstanding],
          ["Extra Received", totals.extra],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7f8d82]">{label}</p>
            <p className="mt-2 text-2xl font-bold text-[#243128]">{currency(Number(value))}</p>
          </div>
        ))}
      </section>

      <div className="mt-6 overflow-hidden rounded-2xl border border-[#dfe6db] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#dfe6db] bg-[#fbfaf6] px-5 py-4">
          <div>
            <h2 className="text-xl font-bold text-[#243128]">Client Ledger</h2>
            <p className="mt-1 text-sm text-[#708075]">One row per client service. Amount Received is the number used for revenue.</p>
          </div>
          <span className="text-xs font-semibold text-[#647d5b]">{message || (isPending ? "Saving..." : "Live sync")}</span>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[1500px]">
            <div className="grid grid-cols-[210px_125px_190px_120px_120px_120px_110px_140px_130px_1fr_90px] border-b border-[#dfe6db] bg-[#eef2ea] text-[10px] font-bold uppercase tracking-[0.1em] text-[#647066]">
              {['Client','Date','Service','Owed','Received','Outstanding','Extra','Date Paid','Method','Notes','Profile'].map((label) => <div key={label} className="border-r border-[#dfe6db] px-3 py-3">{label}</div>)}
            </div>

            {rows.length === 0 ? <div className="p-10 text-center text-sm text-[#708075]">No client services yet.</div> : null}

            {rows.map((row, index) => (
              <div key={row.service_id} className={`grid grid-cols-[210px_125px_190px_120px_120px_120px_110px_140px_130px_1fr_90px] border-b border-[#edf0ea] ${index % 2 ? 'bg-[#fcfdfb]' : 'bg-white'}`}>
                <input value={row.client_name} onChange={(e) => updateLocal(row.service_id, 'client_name', e.target.value)} onBlur={() => save(row)} className={`${inputClass} border-r border-[#edf0ea]`} />
                <input type="date" value={row.service_date || ''} onChange={(e) => { updateLocal(row.service_id, 'service_date', e.target.value); save(row, { service_date: e.target.value }); }} className={`${inputClass} border-r border-[#edf0ea]`} />
                <input value={row.service} onChange={(e) => updateLocal(row.service_id, 'service', e.target.value)} onBlur={() => save(row)} className={`${inputClass} border-r border-[#edf0ea]`} />
                <MoneyCell value={row.amount_owed} onSave={(value) => { updateLocal(row.service_id, 'amount_owed', value); save(row, { amount_owed: value }); }} />
                <MoneyCell value={row.amount_received} onSave={(value) => { updateLocal(row.service_id, 'amount_received', value); save(row, { amount_received: value }); }} />
                <div className="flex items-center justify-end border-r border-[#edf0ea] bg-[#fbf6f3] px-3 text-sm font-semibold text-[#9a554d]">{currency(outstanding(row))}</div>
                <div className="flex items-center justify-end border-r border-[#edf0ea] bg-[#f3f7ef] px-3 text-sm font-semibold text-[#55704f]">{currency(extra(row))}</div>
                <input type="date" value={row.payment_date || ''} onChange={(e) => { updateLocal(row.service_id, 'payment_date', e.target.value); save(row, { payment_date: e.target.value }); }} className={`${inputClass} border-r border-[#edf0ea]`} />
                <select value={row.payment_method || ''} onChange={(e) => { updateLocal(row.service_id, 'payment_method', e.target.value); save(row, { payment_method: e.target.value }); }} className={`${inputClass} border-r border-[#edf0ea]`}>
                  <option value="">Method</option><option>Venmo</option><option>Zelle</option><option>Card</option><option>Cash</option><option>Check</option><option>Other</option>
                </select>
                <input value={row.notes || ''} onChange={(e) => updateLocal(row.service_id, 'notes', e.target.value)} onBlur={() => save(row)} placeholder={row.payment_status || 'Notes'} className={`${inputClass} border-r border-[#edf0ea]`} />
                <div className="flex items-center justify-center"><Link href={`/clients/${row.client_id}`} className="text-xs font-bold text-[#647d5b] hover:underline">Open</Link></div>
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
  return (
    <input
      value={draft}
      inputMode="decimal"
      onFocus={(event) => event.currentTarget.select()}
      onChange={(event) => setDraft(event.target.value.replace(/[^0-9.-]/g, ""))}
      onBlur={() => { const parsed = parseMoney(draft); setDraft(parsed.toFixed(2)); onSave(parsed); }}
      className="h-full w-full border-0 border-r border-[#edf0ea] bg-transparent px-3 py-2.5 text-right text-sm text-[#243128] outline-none focus:bg-white focus:shadow-[inset_0_0_0_2px_rgba(100,125,91,0.24)]"
    />
  );
}
