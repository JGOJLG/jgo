"use client";

import { useState } from "react";
import {
  updateServiceStatus,
  markServicePaid,
  deleteService,
  updateService,
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

export default function ServiceCard({ clientId, service }: Props) {
  const [showEdit, setShowEdit] = useState(false);

  const isCoaching = service.service?.toLowerCase().includes("coaching");

  const stages = isCoaching
    ? ["Scheduled", "Completed", "Invoice Sent", "Paid"]
    : ["Received", "In Progress", "Completed", "Invoice Sent", "Paid"];

  const statusStages = stages.filter((s) => s !== "Paid");
  const currentIndex = statusStages.indexOf(service.status ?? "");
  const isPaid = service.payment_status === "Paid";
  const effectiveIndex = isPaid ? statusStages.length - 1 : currentIndex;

  function confirmDelete(event: React.FormEvent<HTMLFormElement>) {
    const confirmed = window.confirm(
      `Delete "${service.service}"? This cannot be undone.`
    );

    if (!confirmed) {
      event.preventDefault();
    }
  }

  return (
    <div className="rounded-xl border border-[#dfe6db] px-4 py-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowEdit(true)}
          className="text-left"
        >
          <span className="text-sm font-semibold text-[#243128] hover:underline">
            {service.service}
          </span>
          {service.date_added ? (
            <p className="mt-0.5 text-xs text-[#708075]">
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

        <div className="flex items-center gap-2">
          <span className="text-sm text-[#708075]">
            ${Number(service.price ?? 0).toLocaleString()}
          </span>

          <button
            type="button"
            onClick={() => setShowEdit(true)}
            aria-label={`Edit ${service.service}`}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-[#dfe6db] text-[#708075] transition hover:border-[#9fb294] hover:text-[#243128]"
          >
            ✎
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {stages.map((stage) => {
          const isPaidStage = stage === "Paid";

          const isActive = isPaidStage
            ? isPaid
            : statusStages.indexOf(stage) <= effectiveIndex &&
              effectiveIndex !== -1;

          return (
            <form
              key={stage}
              action={isPaidStage ? markServicePaid : updateServiceStatus}
            >
              <input type="hidden" name="clientId" value={clientId} />
              <input type="hidden" name="serviceId" value={service.id} />
              {isPaidStage ? null : (
                <input type="hidden" name="status" value={stage} />
              )}
              <button
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  isActive
                    ? "bg-[#647d5b] text-white"
                    : "border border-[#dfe6db] text-[#243128]"
                }`}
              >
                {stage}
              </button>
            </form>
          );
        })}
      </div>

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
                <input type="hidden" name="clientId" value={clientId} />
                <input type="hidden" name="serviceId" value={service.id} />

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-[#708075]">
                    Price
                  </label>
                  <input
                    type="number"
                    name="price"
                    defaultValue={service.price ?? ""}
                    className="mt-1 w-full rounded-xl border border-[#dfe6db] px-3 py-2 text-sm text-[#243128] outline-none focus:border-[#7f9975]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-[#708075]">
                    Date Added
                  </label>
                  <input
                    type="date"
                    name="dateAdded"
                    defaultValue={service.date_added ?? ""}
                    className="mt-1 w-full rounded-xl border border-[#dfe6db] px-3 py-2 text-sm text-[#243128] outline-none focus:border-[#7f9975]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-[#708075]">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    name="scheduledDate"
                    defaultValue={service.scheduled_date ?? ""}
                    className="mt-1 w-full rounded-xl border border-[#dfe6db] px-3 py-2 text-sm text-[#243128] outline-none focus:border-[#7f9975]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-[#708075]">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    defaultValue={service.notes ?? ""}
                    className="mt-1 w-full rounded-xl border border-[#dfe6db] px-3 py-2 text-sm text-[#243128] outline-none focus:border-[#7f9975]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#647d5b] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#56683f]"
                >
                  Save Changes
                </button>
              </form>

              <form action={deleteService} onSubmit={confirmDelete}>
                <input type="hidden" name="clientId" value={clientId} />
                <input type="hidden" name="serviceId" value={service.id} />
                <button
                  type="submit"
                  className="w-full rounded-xl border border-[#e2c6c2] px-4 py-2 text-sm font-semibold text-[#9a554d] transition hover:bg-[#fbefed]"
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
