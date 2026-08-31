"use client";

import { useState } from "react";
import {
  deleteService,
  markServiceInvoiceSent,
  markServicePaid,
  updateService,
  updateServiceStatus,
} from "./actions";

type Service = {
  id: number;
  service: string;
  price: number | null;
  status: string | null;
  payment_status: string | null;
  date_added: string | null;
  scheduled_date: string | null;
  notes: string | null;
  amount_received?: number | null;
  payment_method?: string | null;
  payment_date?: string | null;
};

type Props = { clientId: number; service: Service };

function normalize(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

function todayEastern() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function ServiceCard({ clientId, service }: Props) {
  const [showEdit, setShowEdit] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [amountReceived, setAmountReceived] = useState(String(service.amount_received ?? service.price ?? 0));

  const isCoaching = normalize(service.service).includes("coaching");
  const workStages = isCoaching ? ["Scheduled", "Completed"] : ["Received", "In Progress", "Completed"];
  const currentStatus = normalize(service.status);
  const paymentStatus = normalize(service.payment_status);
  const invoiceSent = paymentStatus === "invoice sent";
  const isPaid = paymentStatus === "paid";
  const isPartial = paymentStatus === "partial";
  const invoiceAmount = Number(service.price ?? 0);
  const received = Number(service.amount_received ?? (isPaid ? invoiceAmount : 0));
  const remaining = Math.max(0, invoiceAmount - received);
  const extra = Math.max(0, received - invoiceAmount);
  const pendingExtra = Math.max(0, Number(amountReceived || 0) - invoiceAmount);

  function confirmDelete(event: React.FormEvent<HTMLFormElement>) {
    if (!window.confirm(`Delete "${service.service}"? This cannot be undone.`)) event.preventDefault();
  }

  return (
    <div className="rounded-2xl border border-[#dfe6db] bg-[#fbfcf9] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <button type="button" onClick={() => setShowEdit(true)} className="min-w-0 text-left">
          <span className="text-base font-bold text-[#243128] hover:underline">{service.service}</span>
          {service.date_added ? <p className="mt-1 text-xs text-[#708075]">Added {new Date(`${service.date_added}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p> : null}
        </button>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-[#243128]">${invoiceAmount.toLocaleString()}</span>
          <button type="button" onClick={() => setShowEdit(true)} aria-label={`Edit ${service.service}`} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#dfe6db] bg-white text-[#708075] transition hover:border-[#9fb294] hover:text-[#243128]">✎</button>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7f8d82]">Service Status</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {workStages.map((stage) => {
            const active = currentStatus === normalize(stage);
            return <form key={stage} action={updateServiceStatus}>
              <input type="hidden" name="clientId" value={clientId} /><input type="hidden" name="serviceId" value={service.id} /><input type="hidden" name="status" value={stage} />
              <button type="submit" className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${active ? "bg-[#647d5b] text-white" : "border border-[#d7e1d0] bg-white text-[#647066] hover:border-[#9fb294] hover:text-[#3d4d39]"}`}>{active ? "✓ " : ""}{stage}</button>
            </form>;
          })}
        </div>
      </div>

      <div className="mt-5 border-t border-[#e4e9df] pt-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7f8d82]">Payment</p>
            <div className="mt-2">
              {isPaid ? (
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#e5f0e2] px-3.5 py-2 text-xs font-bold text-[#4d6948]">✓ Paid</span>
                  <PaymentDetails received={received} extra={extra} remaining={0} method={service.payment_method} />
                </div>
              ) : isPartial ? (
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#e8edf5] px-3.5 py-2 text-xs font-bold text-[#55708b]">Partial Payment</span>
                  <PaymentDetails received={received} extra={0} remaining={remaining} method={service.payment_method} />
                </div>
              ) : invoiceSent ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-[#e8edf5] px-3.5 py-2 text-xs font-bold text-[#55708b]">✓ Invoice Sent</span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-[#f4ead9] px-3.5 py-2 text-xs font-bold text-[#8a6b3f]">Invoice Not Sent</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {!invoiceSent && !isPaid && !isPartial ? <form action={markServiceInvoiceSent}><input type="hidden" name="clientId" value={clientId} /><input type="hidden" name="serviceId" value={service.id} /><button type="submit" className="rounded-xl border border-[#cbd8c4] bg-white px-4 py-2 text-xs font-semibold text-[#4d6247] transition hover:bg-[#f5f7f2]">Mark Invoice Sent</button></form> : null}
            {!isPaid ? <button type="button" onClick={() => { setAmountReceived(String(service.amount_received ?? service.price ?? 0)); setShowPayment(true); }} className="rounded-xl bg-[#647d5b] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#56683f]">{isPartial ? "Update Payment" : "Mark Paid"}</button> : null}
          </div>
        </div>
      </div>

      {service.notes ? <div className="mt-4 rounded-xl bg-white px-4 py-3 text-sm leading-6 text-[#647066]">{service.notes}</div> : null}

      {showPayment ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between"><div><h3 className="text-lg font-bold text-[#243128]">Record Payment Received</h3><p className="mt-1 text-sm text-[#708075]">Invoice amount: ${invoiceAmount.toLocaleString()}</p></div><button type="button" onClick={() => setShowPayment(false)} className="text-[#708075] hover:text-[#243128]">✕</button></div>
            <form action={markServicePaid} onSubmit={() => setShowPayment(false)} className="mt-5 space-y-4">
              <input type="hidden" name="clientId" value={clientId} /><input type="hidden" name="serviceId" value={service.id} />
              <label className="block"><span className={labelStyle}>Total Amount Received</span><input required min="0" step="0.01" type="number" name="amountReceived" value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} className={inputStyle} /></label>
              {pendingExtra > 0 ? <div className="rounded-xl border border-[#ead8b7] bg-[#fbf4e6] p-3 text-sm text-[#765b35]">This includes <strong>${pendingExtra.toLocaleString()}</strong> above the ${invoiceAmount.toLocaleString()} invoice.</div> : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block"><span className={labelStyle}>Payment Method</span><select name="paymentMethod" className={inputStyle} defaultValue={service.payment_method || ""}><option value="">Not specified</option><option>Venmo</option><option>Zelle</option><option>Card</option><option>Cash</option><option>Check</option><option>Other</option></select></label>
                <label className="block"><span className={labelStyle}>Date Paid</span><input type="date" name="paymentDate" defaultValue={service.payment_date || todayEastern()} className={inputStyle} /></label>
              </div>
              {pendingExtra > 0 ? <label className="block"><span className={labelStyle}>Extra Payment Type</span><select name="extraType" className={inputStyle} defaultValue="Extra Payment"><option>Extra Payment</option><option>Tip / Bonus</option><option>Credit</option><option>Other</option></select></label> : null}
              <label className="block"><span className={labelStyle}>Payment Note</span><textarea name="paymentNote" rows={2} placeholder="Optional" className={`${inputStyle} resize-y`} /></label>
              <button type="submit" className="w-full rounded-xl bg-[#647d5b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#56683f]">Save Payment</button>
            </form>
          </div>
        </div>
      ) : null}

      {showEdit ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between"><h3 className="text-lg font-bold text-[#243128]">Edit Service</h3><button type="button" onClick={() => setShowEdit(false)} className="text-[#708075] hover:text-[#243128]">✕</button></div>
            <div className="mt-4 space-y-3">
              <form action={updateService} onSubmit={() => setShowEdit(false)} className="space-y-3">
                <input type="hidden" name="clientId" value={clientId} /><input type="hidden" name="serviceId" value={service.id} />
                <label className="block"><span className={labelStyle}>Price</span><input type="number" name="price" defaultValue={service.price ?? ""} className={inputStyle} /></label>
                <label className="block"><span className={labelStyle}>Date Added</span><input type="date" name="dateAdded" defaultValue={service.date_added ?? ""} className={inputStyle} /></label>
                <label className="block"><span className={labelStyle}>Scheduled Date</span><input type="date" name="scheduledDate" defaultValue={service.scheduled_date ?? ""} className={inputStyle} /></label>
                <label className="block"><span className={labelStyle}>Notes</span><textarea name="notes" rows={3} defaultValue={service.notes ?? ""} className={`${inputStyle} resize-y`} /></label>
                <button type="submit" className="w-full rounded-xl bg-[#647d5b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#56683f]">Save Changes</button>
              </form>
              <form action={deleteService} onSubmit={confirmDelete}><input type="hidden" name="clientId" value={clientId} /><input type="hidden" name="serviceId" value={service.id} /><button type="submit" className="w-full rounded-xl border border-[#e2c6c2] px-4 py-2.5 text-sm font-semibold text-[#9a554d] transition hover:bg-[#fbefed]">Delete Service</button></form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PaymentDetails({ received, extra, remaining, method }: { received: number; extra: number; remaining: number; method?: string | null }) {
  return <div className="text-xs text-[#647066]"><span className="font-semibold text-[#344239]">Received ${received.toLocaleString()}</span>{remaining > 0 ? <span className="ml-2 rounded-full bg-[#f4ead9] px-2 py-1 font-semibold text-[#8a6b3f]">${remaining.toLocaleString()} remaining</span> : null}{extra > 0 ? <span className="ml-2 rounded-full bg-[#f4ead9] px-2 py-1 font-semibold text-[#8a6b3f]">+${extra.toLocaleString()} extra</span> : null}{method ? <span className="ml-2">via {method}</span> : null}</div>;
}

const labelStyle = "text-xs font-semibold uppercase tracking-wide text-[#708075]";
const inputStyle = "mt-1 w-full rounded-xl border border-[#dfe6db] px-3 py-2 text-sm text-[#243128] outline-none focus:border-[#7f9975]";
