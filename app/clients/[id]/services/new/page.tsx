"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";

const serviceOptions = [
  "Resume",
  "Cover Letter",
  "Resume + Cover Letter",
  "Career Coaching",
  "Other",
];

function getToday() {
  return new Date().toISOString().split("T")[0];
}

export default function AddServicePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const clientId = Number(params.id);

  const [clientName, setClientName] = useState("Client");
  const [loadingClient, setLoadingClient] = useState(true);

  const [serviceSelection, setServiceSelection] = useState("");
  const [customService, setCustomService] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("Lead");
  const [paymentStatus, setPaymentStatus] = useState("Open");

  const [dateAdded, setDateAdded] = useState(getToday());
  const [free15Date, setFree15Date] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [clientNotes, setClientNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const finalService =
    serviceSelection === "Other"
      ? customService.trim()
      : serviceSelection;

  useEffect(() => {
    async function loadClient() {
      if (!Number.isInteger(clientId)) {
        setErrorMessage("Invalid client ID.");
        setLoadingClient(false);
        return;
      }

      const { data, error } = await supabase
        .from("clients")
        .select("name")
        .eq("id", clientId)
        .single();

      if (error || !data) {
        setErrorMessage("The client could not be loaded.");
        setLoadingClient(false);
        return;
      }

      setClientName(data.name || "Client");
      setLoadingClient(false);
    }

    loadClient();
  }, [clientId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!serviceSelection) {
      setErrorMessage("Please select a service.");
      return;
    }

    if (serviceSelection === "Other" && !customService.trim()) {
      setErrorMessage("Please type the custom service.");
      return;
    }

    if (price === "") {
      setErrorMessage("Please enter a price.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    const { error } = await supabase.from("client_services").insert({
      client_id: clientId,
      service: finalService,
      price: Number(price),
      status,
      payment_status: paymentStatus,
      date_added: dateAdded || null,
      free15_date: free15Date || null,
      scheduled_date: scheduledDate || null,
      due_date: dueDate || null,
      next_step: nextStep.trim() || null,
      notes: clientNotes.trim() || null,
    });

    if (error) {
      setErrorMessage(error.message);
      setSaving(false);
      return;
    }

    router.push(`/clients/${clientId}`);
    router.refresh();
  }

  if (loadingClient) {
    return (
      <main className="min-h-screen bg-[#f7f8f3] p-6 text-[#243128] lg:p-10">
        <div className="mx-auto max-w-5xl rounded-3xl border border-[#dfe6db] bg-white p-10 shadow-sm">
          Loading client...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#243128]">
      <header className="border-b border-[#dfe6db] bg-[#fbfaf6] px-6 py-7 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <Link
            href={`/clients/${clientId}`}
            className="text-sm font-semibold text-[#7f9975] hover:text-[#4d6247]"
          >
            ← Back to {clientName}
          </Link>

          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            Add New Service
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-5xl p-6 lg:p-10">
        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-3xl border border-[#dfe6db] bg-white shadow-sm"
        >
          <section className="border-b border-[#e4e9df] p-6 lg:p-8">
            <h2 className="text-xl font-bold">Service and Price</h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <FormField label="Service">
                <select
                  value={serviceSelection}
                  onChange={(event) => {
                    setServiceSelection(event.target.value);
                    if (event.target.value !== "Other") {
                      setCustomService("");
                    }
                  }}
                  className={inputStyle}
                >
                  <option value="">Select service</option>
                  {serviceOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Price">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#708075]">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    placeholder="0"
                    className={`${inputStyle} pl-8`}
                  />
                </div>
              </FormField>

              {serviceSelection === "Other" && (
                <div className="md:col-span-2">
                  <FormField label="Custom Service">
                    <input
                      value={customService}
                      onChange={(event) =>
                        setCustomService(event.target.value)
                      }
                      placeholder="Type the service name"
                      className={inputStyle}
                    />
                  </FormField>
                </div>
              )}

              <FormField label="Service Status">
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className={inputStyle}
                >
                  <option>Lead</option>
                  <option>Free 15 Scheduled</option>
                  <option>Free 15 Completed</option>
                  <option>In Process</option>
                  <option>Coaching Session Scheduled</option>
                  <option>Completed</option>
                </select>
              </FormField>

              <FormField label="Payment Status">
                <select
                  value={paymentStatus}
                  onChange={(event) =>
                    setPaymentStatus(event.target.value)
                  }
                  className={inputStyle}
                >
                  <option>Open</option>
                  <option>Invoice Sent</option>
                  <option>Paid</option>
                </select>
              </FormField>
            </div>
          </section>

          <section className="border-b border-[#e4e9df] p-6 lg:p-8">
            <h2 className="text-xl font-bold">Dates and Workflow</h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <FormField label="Date Added">
                <input
                  type="date"
                  value={dateAdded}
                  onChange={(event) => setDateAdded(event.target.value)}
                  className={inputStyle}
                />
              </FormField>

              <FormField label="Free 15 Date">
                <input
                  type="date"
                  value={free15Date}
                  onChange={(event) => setFree15Date(event.target.value)}
                  className={inputStyle}
                />
              </FormField>

              <FormField label="Scheduled Coaching Session">
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(event) =>
                    setScheduledDate(event.target.value)
                  }
                  className={inputStyle}
                />
              </FormField>

              <FormField label="Due Date">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className={inputStyle}
                />
              </FormField>

              <div className="md:col-span-2">
                <FormField label="Next Step">
                  <input
                    value={nextStep}
                    onChange={(event) => setNextStep(event.target.value)}
                    placeholder="Example: Send intake form"
                    className={inputStyle}
                  />
                </FormField>
              </div>

              <div className="md:col-span-2">
                <FormField label="Client Notes">
                  <textarea
                    rows={6}
                    value={clientNotes}
                    onChange={(event) =>
                      setClientNotes(event.target.value)
                    }
                    placeholder="Add client notes..."
                    className={`${inputStyle} resize-y`}
                  />
                </FormField>
              </div>
            </div>
          </section>

          <section className="p-6 lg:p-8">
            {errorMessage && (
              <div className="mb-5 rounded-xl border border-[#ead4d0] bg-[#fbefed] p-4 text-sm text-[#8d4f48]">
                {errorMessage}
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link
                href={`/clients/${clientId}`}
                className="rounded-xl border border-[#d7e1d0] bg-white px-5 py-3 text-center text-sm font-semibold text-[#4d6247]"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#647d5b] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Service"}
              </button>
            </div>
          </section>
        </form>
      </div>
    </main>
  );
}

const inputStyle =
  "w-full rounded-xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3 text-sm text-[#243128] outline-none placeholder:text-[#9aa59c] focus:border-[#9fb294] focus:ring-2 focus:ring-[#e8eee3]";

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[#3d4d39]">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
