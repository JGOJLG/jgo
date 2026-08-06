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
};

type Props = {
  clientId: number;
  service: Service;
};

function normalize(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

export default function ServiceCard({
  clientId,
  service,
}: Props) {
  const [showEdit, setShowEdit] = useState(false);

  const isCoaching = normalize(service.service).includes(
    "coaching"
  );

  const workStages = isCoaching
    ? ["Scheduled", "Completed"]
    : ["Received", "In Progress", "Completed"];

  const currentStatus = normalize(service.status);
  const paymentStatus = normalize(service.payment_status);

  const invoiceSent = paymentStatus === "invoice sent";
  const isPaid = paymentStatus === "paid";

  function confirmDelete(
    event: React.FormEvent<HTMLFormElement>
  ) {
    const confirmed = window.confirm(
      `Delete "${service.service}"? This cannot be undone.`
    );

    if (!confirmed) {
      event.preventDefault();
    }
  }

  return (
    <div className="rounded-2xl border border-[#dfe6db] bg-[#fbfcf9] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <button
          type="button"
          onClick={() => setShowEdit(true)}
          className="min-w-0 text-left"
        >
          <span className="text-base font-bold text-[#243128] hover:underline">
            {service.service}
          </span>

          {service.date_added ? (
            <p className="mt-1 text-xs text-[#708075]">
              Added{" "}
              {new Date(
                `${service.date_added}T12:00:00`
              ).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          ) : null}
        </button>

        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-[#243128]">
            ${Number(service.price ?? 0).toLocaleString()}
          </span>

          <button
            type="button"
            onClick={() => setShowEdit(true)}
            aria-label={`Edit ${service.service}`}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#dfe6db] bg-white text-[#708075] transition hover:border-[#9fb294] hover:text-[#243128]"
          >
            ✎
          </button>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7f8d82]">
          Service Status
        </p>

        <div className="mt-2 flex flex-wrap gap-2">
          {workStages.map((stage) => {
            const active =
              currentStatus === normalize(stage);

            return (
              <form
                key={stage}
                action={updateServiceStatus}
              >
                <input
                  type="hidden"
                  name="clientId"
                  value={clientId}
                />
                <input
                  type="hidden"
                  name="serviceId"
                  value={service.id}
                />
                <input
                  type="hidden"
                  name="status"
                  value={stage}
                />

                <button
                  type="submit"
                  className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                    active
                      ? "bg-[#647d5b] text-white"
                      : "border border-[#d7e1d0] bg-white text-[#647066] hover:border-[#9fb294] hover:text-[#3d4d39]"
                  }`}
                >
                  {active ? "✓ " : ""}
                  {stage}
                </button>
              </form>
            );
          })}
        </div>
      </div>

      <div className="mt-5 border-t border-[#e4e9df] pt-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7f8d82]">
              Payment
            </p>

            <div className="mt-2">
              {isPaid ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-[#e5f0e2] px-3.5 py-2 text-xs font-bold text-[#4d6948]">
                  ✓ Paid
                </span>
              ) : invoiceSent ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-[#e8edf5] px-3.5 py-2 text-xs font-bold text-[#55708b]">
                  ✓ Invoice Sent
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-[#f4ead9] px-3.5 py-2 text-xs font-bold text-[#8a6b3f]">
                  Invoice Not Sent
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {!invoiceSent && !isPaid ? (
              <form action={markServiceInvoiceSent}>
                <input
                  type="hidden"
                  name="clientId"
                  value={clientId}
                />
                <input
                  type="hidden"
                  name="serviceId"
                  value={service.id}
                />

                <button
                  type="submit"
                  className="rounded-xl border border-[#cbd8c4] bg-white px-4 py-2 text-xs font-semibold text-[#4d6247] transition hover:bg-[#f5f7f2]"
                >
                  Mark Invoice Sent
                </button>
              </form>
            ) : null}

            {!isPaid ? (
              <form action={markServicePaid}>
                <input
                  type="hidden"
                  name="clientId"
                  value={clientId}
                />
                <input
                  type="hidden"
                  name="serviceId"
                  value={service.id}
                />

                <button
                  type="submit"
                  className="rounded-xl bg-[#647d5b] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#56683f]"
                >
                  Mark Paid
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </div>

      {service.notes ? (
        <div className="mt-4 rounded-xl bg-white px-4 py-3 text-sm leading-6 text-[#647066]">
          {service.notes}
        </div>
      ) : null}

      {showEdit ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#243128]">
                Edit Service
              </h3>

              <button
                type="button"
                onClick={() => setShowEdit(false)}
                className="text-[#708075] hover:text-[#243128]"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <form
                action={updateService}
                onSubmit={() => setShowEdit(false)}
                className="space-y-3"
              >
                <input
                  type="hidden"
                  name="clientId"
                  value={clientId}
                />
                <input
                  type="hidden"
                  name="serviceId"
                  value={service.id}
                />

                <label className="block">
                  <span className={labelStyle}>Price</span>
                  <input
                    type="number"
                    name="price"
                    defaultValue={service.price ?? ""}
                    className={inputStyle}
                  />
                </label>

                <label className="block">
                  <span className={labelStyle}>
                    Date Added
                  </span>
                  <input
                    type="date"
                    name="dateAdded"
                    defaultValue={service.date_added ?? ""}
                    className={inputStyle}
                  />
                </label>

                <label className="block">
                  <span className={labelStyle}>
                    Scheduled Date
                  </span>
                  <input
                    type="date"
                    name="scheduledDate"
                    defaultValue={
                      service.scheduled_date ?? ""
                    }
                    className={inputStyle}
                  />
                </label>

                <label className="block">
                  <span className={labelStyle}>Notes</span>
                  <textarea
                    name="notes"
                    rows={3}
                    defaultValue={service.notes ?? ""}
                    className={`${inputStyle} resize-y`}
                  />
                </label>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#647d5b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#56683f]"
                >
                  Save Changes
                </button>
              </form>

              <form
                action={deleteService}
                onSubmit={confirmDelete}
              >
                <input
                  type="hidden"
                  name="clientId"
                  value={clientId}
                />
                <input
                  type="hidden"
                  name="serviceId"
                  value={service.id}
                />

                <button
                  type="submit"
                  className="w-full rounded-xl border border-[#e2c6c2] px-4 py-2.5 text-sm font-semibold text-[#9a554d] transition hover:bg-[#fbefed]"
                >
                  Delete Service
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const labelStyle =
  "text-xs font-semibold uppercase tracking-wide text-[#708075]";

const inputStyle =
  "mt-1 w-full rounded-xl border border-[#dfe6db] px-3 py-2 text-sm text-[#243128] outline-none focus:border-[#7f9975]";
