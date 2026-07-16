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
  {
    name: "Resume",
    description: "Professional resume writing",
    price: 250,
  },
  {
    name: "Cover Letter",
    description: "Standalone professional cover letter",
    price: 250,
  },
  {
    name: "Resume + Cover Letter",
    description: "Complete resume and cover letter package",
    price: 400,
  },
  {
    name: "Career Coaching",
    description: "One career coaching session",
    price: 250,
  },
];

export default function EditServicePage() {
  const params = useParams<{
    id: string;
    serviceId: string;
  }>();

  const router = useRouter();

  const clientId = Number(params.id);
  const serviceId = Number(params.serviceId);

  const [clientName, setClientName] = useState("Client");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [service, setService] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("New");
  const [paymentStatus, setPaymentStatus] = useState("Open");

  const [dateAdded, setDateAdded] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [completedDate, setCompletedDate] = useState("");

  const [nextStep, setNextStep] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function loadService() {
      if (
        !Number.isInteger(clientId) ||
        !Number.isInteger(serviceId)
      ) {
        setErrorMessage("Invalid client or service ID.");
        setLoading(false);
        return;
      }

      const [
        { data: clientData, error: clientError },
        { data: serviceData, error: serviceError },
      ] = await Promise.all([
        supabase
          .from("clients")
          .select("name")
          .eq("id", clientId)
          .single(),

        supabase
          .from("client_services")
          .select("*")
          .eq("id", serviceId)
          .eq("client_id", clientId)
          .single(),
      ]);

      if (clientError || !clientData) {
        console.error("Unable to load client:", clientError);
        setErrorMessage("The client could not be loaded.");
        setLoading(false);
        return;
      }

      if (serviceError || !serviceData) {
        console.error("Unable to load service:", serviceError);
        setErrorMessage("The service could not be loaded.");
        setLoading(false);
        return;
      }

      setClientName(clientData.name || "Client");

      setService(serviceData.service ?? "");
      setPrice(
        serviceData.price !== null
          ? String(serviceData.price)
          : ""
      );
      setStatus(serviceData.status ?? "New");
      setPaymentStatus(serviceData.payment_status ?? "Open");

      setDateAdded(serviceData.date_added ?? "");
      setScheduledDate(serviceData.scheduled_date ?? "");
      setDueDate(serviceData.due_date ?? "");
      setCompletedDate(serviceData.completed_date ?? "");

      setNextStep(serviceData.next_step ?? "");
      setNotes(serviceData.notes ?? "");

      setLoading(false);
    }

    loadService();
  }, [clientId, serviceId]);

  function selectService(
    serviceName: string,
    servicePrice: number
  ) {
    setService(serviceName);
    setPrice(String(servicePrice));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!service) {
      setErrorMessage("Please select a service.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    const updateData = {
      service,
      price: price ? Number(price) : null,
      status,
      payment_status: paymentStatus,
      date_added: dateAdded || null,
      scheduled_date: scheduledDate || null,
      due_date: dueDate || null,
      completed_date:
        status === "Completed"
          ? completedDate || new Date().toISOString().split("T")[0]
          : completedDate || null,
      next_step: nextStep.trim() || null,
      notes: notes.trim() || null,
    };

    const { error } = await supabase
      .from("client_services")
      .update(updateData)
      .eq("id", serviceId)
      .eq("client_id", clientId);

    if (error) {
      console.error("Unable to update service:", error);
      setErrorMessage(error.message);
      setSaving(false);
      return;
    }

    router.push(`/clients/${clientId}`);
    router.refresh();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8f3] p-6 text-[#243128] lg:p-10">
        <div className="mx-auto max-w-5xl rounded-3xl border border-[#dfe6db] bg-white p-10 shadow-sm">
          <p className="text-sm font-semibold text-[#708075]">
            Loading service...
          </p>
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
            Edit Service
          </h1>

          <p className="mt-2 text-sm text-[#708075]">
            Update this service’s status, payment, dates, notes,
            and next steps.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl p-6 lg:p-10">
        {errorMessage && !service ? (
          <div className="rounded-2xl border border-[#ead4d0] bg-[#fbefed] p-6 text-sm text-[#8d4f48]">
            {errorMessage}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-3xl border border-[#dfe6db] bg-white shadow-sm"
          >
            <section className="border-b border-[#e4e9df] p-6 lg:p-8">
              <h2 className="text-xl font-bold">
                Service and Price
              </h2>

              <p className="mt-1 text-sm text-[#708075]">
                Choose the service attached to this project or
                session.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {serviceOptions.map((option) => {
                  const isSelected = service === option.name;

                  return (
                    <button
                      key={option.name}
                      type="button"
                      onClick={() =>
                        selectService(option.name, option.price)
                      }
                      className={`rounded-2xl border p-5 text-left transition ${
                        isSelected
                          ? "border-[#7f9975] bg-[#eef2e9] shadow-sm"
                          : "border-[#dfe6db] bg-[#fbfcf9] hover:border-[#becdb5]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-bold text-[#243128]">
                            {option.name}
                          </p>

                          <p className="mt-1 text-sm leading-6 text-[#708075]">
                            {option.description}
                          </p>
                        </div>

                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                            isSelected
                              ? "border-[#647d5b] bg-[#647d5b] text-white"
                              : "border-[#cbd8c4] bg-white text-transparent"
                          }`}
                        >
                          ✓
                        </div>
                      </div>

                      <p className="mt-4 text-sm font-bold text-[#4d6247]">
                        ${option.price.toLocaleString()}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 rounded-2xl border border-[#d7e1d0] bg-[#eef2e9] p-5">
                <FormField label="Service Price">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#708075]">
                      $
                    </span>

                    <input
                      type="number"
                      min="0"
                      value={price}
                      onChange={(event) =>
                        setPrice(event.target.value)
                      }
                      className={`${inputStyle} pl-8`}
                    />
                  </div>
                </FormField>
              </div>
            </section>

            <section className="border-b border-[#e4e9df] p-6 lg:p-8">
              <h2 className="text-xl font-bold">
                Status and Payment
              </h2>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <FormField label="Service Status">
                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value)
                    }
                    className={inputStyle}
                  >
                    <option>New</option>
                    <option>Scheduled</option>
                    <option>In Progress</option>
                    <option>Waiting on Client</option>
                    <option>Revision</option>
                    <option>On Hold</option>
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
                    <option>Pending</option>
                    <option>Paid</option>
                  </select>
                </FormField>
              </div>

              <div className="mt-6 rounded-2xl border border-[#dfe6db] bg-[#fbfcf9] p-5">
                <p className="text-sm font-semibold text-[#3d4d39]">
                  Revenue behavior
                </p>

                <p className="mt-2 text-sm leading-6 text-[#708075]">
                  Open, Invoice Sent, and Pending count toward Money
                  Owed. Paid counts toward official Paid Revenue.
                </p>
              </div>
            </section>

            <section className="border-b border-[#e4e9df] p-6 lg:p-8">
              <h2 className="text-xl font-bold">
                Dates and Workflow
              </h2>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <FormField label="Date Added">
                  <input
                    type="date"
                    value={dateAdded}
                    onChange={(event) =>
                      setDateAdded(event.target.value)
                    }
                    className={inputStyle}
                  />
                </FormField>

                <FormField label="Scheduled Session Date">
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(event) =>
                      setScheduledDate(event.target.value)
                    }
                    className={inputStyle}
                  />
                </FormField>

                <FormField label="Project Due Date">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(event) =>
                      setDueDate(event.target.value)
                    }
                    className={inputStyle}
                  />
                </FormField>

                <FormField label="Completed Date">
                  <input
                    type="date"
                    value={completedDate}
                    onChange={(event) =>
                      setCompletedDate(event.target.value)
                    }
                    className={inputStyle}
                  />
                </FormField>

                <div className="md:col-span-2">
                  <FormField label="Next Step">
                    <input
                      value={nextStep}
                      onChange={(event) =>
                        setNextStep(event.target.value)
                      }
                      placeholder="What needs to happen next?"
                      className={inputStyle}
                    />
                  </FormField>
                </div>

                <div className="md:col-span-2">
                  <FormField label="Service Notes">
                    <textarea
                      rows={6}
                      value={notes}
                      onChange={(event) =>
                        setNotes(event.target.value)
                      }
                      placeholder="Add notes for this specific service..."
                      className={`${inputStyle} resize-y`}
                    />
                  </FormField>
                </div>
              </div>
            </section>

            <section className="p-6 lg:p-8">
              {errorMessage && (
                <div className="mb-5 rounded-xl border border-[#ead4d0] bg-[#fbefed] p-4 text-sm text-[#8d4f48]">
                  Service could not be updated: {errorMessage}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Link
                  href={`/clients/${clientId}`}
                  className="rounded-xl border border-[#d7e1d0] bg-white px-5 py-3 text-center text-sm font-semibold text-[#4d6247] hover:bg-[#f5f7f2]"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={saving || !service}
                  className="rounded-xl bg-[#647d5b] px-6 py-3 text-sm font-semibold text-white hover:bg-[#4d6247] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving Changes..."
                    : "Save Service Changes"}
                </button>
              </div>
            </section>
          </form>
        )}
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