"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Client = {
  id: number;
  name: string | null;
};

type ClientService = {
  id: number;
  client_id: number;
  service: string | null;
  price: number | null;
  payment_status: string | null;
};

const paymentMethods = [
  "Venmo",
  "Zelle",
  "PayPal",
  "Credit Card",
  "Debit Card",
  "Cash",
  "Check",
  "Bank Transfer",
  "Other",
];

const paymentStatuses = [
  "Paid",
  "Pending",
  "Invoice Sent",
];

const inputStyle =
  "w-full rounded-xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3 text-sm text-[#243128] outline-none placeholder:text-[#9aa59c] focus:border-[#9fb294]";

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function NewPaymentPage() {
  const params = useParams();
  const router = useRouter();

  const clientId = Number(params.id);

  const [client, setClient] = useState<Client | null>(null);
  const [services, setServices] = useState<ClientService[]>([]);

  const [clientServiceId, setClientServiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(getTodayDateString());
  const [paymentMethod, setPaymentMethod] = useState("Venmo");
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedService = useMemo(
    () =>
      services.find(
        (service) => service.id === Number(clientServiceId)
      ) ?? null,
    [clientServiceId, services]
  );

  useEffect(() => {
    if (!Number.isInteger(clientId)) {
      setError("Invalid client.");
      setLoading(false);
      return;
    }

    async function loadPageData() {
      setLoading(true);
      setError("");

      const [clientResult, servicesResult] = await Promise.all([
        supabase
          .from("clients")
          .select("id, name")
          .eq("id", clientId)
          .maybeSingle(),

        supabase
          .from("client_services")
          .select("id, client_id, service, price, payment_status")
          .eq("client_id", clientId)
          .order("id", { ascending: false }),
      ]);

      if (clientResult.error) {
        setError(clientResult.error.message);
        setLoading(false);
        return;
      }

      if (!clientResult.data) {
        setError("Client not found.");
        setLoading(false);
        return;
      }

      if (servicesResult.error) {
        setError(servicesResult.error.message);
        setLoading(false);
        return;
      }

      setClient(clientResult.data as Client);
      setServices((servicesResult.data ?? []) as ClientService[]);
      setLoading(false);
    }

    loadPageData();
  }, [clientId]);

  function handleServiceChange(value: string) {
    setClientServiceId(value);

    const service = services.find(
      (item) => item.id === Number(value)
    );

    if (service?.price != null) {
      setAmount(String(service.price));
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid payment amount.");
      return;
    }

    if (!paymentDate) {
      setError("Please select a payment date.");
      return;
    }

    setSaving(true);
    setError("");

    const { error: paymentError } = await supabase
      .from("payments")
      .insert({
        client_id: clientId,
        client_service_id: clientServiceId
          ? Number(clientServiceId)
          : null,
        amount: parsedAmount,
        payment_date: paymentDate,
        payment_method: paymentMethod || null,
        payment_status: paymentStatus,
        notes: notes.trim() || null,
      });

    if (paymentError) {
      setError(paymentError.message);
      setSaving(false);
      return;
    }

    if (
      paymentStatus === "Paid" &&
      selectedService
    ) {
      const { error: serviceError } = await supabase
        .from("client_services")
        .update({
          payment_status: "Paid",
        })
        .eq("id", selectedService.id);

      if (serviceError) {
        setError(
          `Payment was saved, but the service status could not be updated: ${serviceError.message}`
        );
        setSaving(false);
        return;
      }
    }

    const { error: clientError } = await supabase
      .from("clients")
      .update({
        payment_status:
          paymentStatus === "Paid"
            ? "Paid"
            : paymentStatus,
      })
      .eq("id", clientId);

    if (clientError) {
      setError(
        `Payment was saved, but the client payment status could not be updated: ${clientError.message}`
      );
      setSaving(false);
      return;
    }

    router.push(`/clients/${clientId}`);
    router.refresh();
  }

  if (loading) {
    return (
      <div className="p-10 text-sm text-[#708075]">
        Loading payment form...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#243128]">
      <header className="border-b border-[#dfe6db] bg-[#fbfaf6] px-6 py-7 lg:px-10">
        <div className="mx-auto max-w-3xl">
          <Link
            href={`/clients/${clientId}`}
            className="text-sm font-semibold text-[#7f9975] hover:text-[#4d6247]"
          >
            ← Back to Client
          </Link>

          <h1 className="mt-4 text-3xl font-bold">
            Add Payment
          </h1>

          <p className="mt-2 text-sm text-[#708075]">
            Record a payment for{" "}
            {client?.name || "this client"}.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl p-6 lg:p-10">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-3xl border border-[#dfe6db] bg-white p-8 shadow-sm"
        >
          <section>
            <h2 className="text-xl font-bold">
              Payment Details
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-[#4d6247]">
                  Related Service
                </label>

                <select
                  value={clientServiceId}
                  onChange={(event) =>
                    handleServiceChange(event.target.value)
                  }
                  className={inputStyle}
                >
                  <option value="">
                    General payment or no service selected
                  </option>

                  {services.map((service) => (
                    <option
                      key={service.id}
                      value={service.id}
                    >
                      {service.service || "Unnamed Service"} · $
                      {Number(service.price ?? 0).toLocaleString("en-US")}
                      {service.payment_status
                        ? ` · ${service.payment_status}`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#4d6247]">
                  Amount
                </label>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(event) =>
                    setAmount(event.target.value)
                  }
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#4d6247]">
                  Payment Date
                </label>

                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(event) =>
                    setPaymentDate(event.target.value)
                  }
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#4d6247]">
                  Payment Method
                </label>

                <select
                  value={paymentMethod}
                  onChange={(event) =>
                    setPaymentMethod(event.target.value)
                  }
                  className={inputStyle}
                >
                  {paymentMethods.map((method) => (
                    <option
                      key={method}
                      value={method}
                    >
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#4d6247]">
                  Payment Status
                </label>

                <select
                  value={paymentStatus}
                  onChange={(event) =>
                    setPaymentStatus(event.target.value)
                  }
                  className={inputStyle}
                >
                  {paymentStatuses.map((status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section>
            <label className="mb-2 block text-sm font-semibold text-[#4d6247]">
              Notes
            </label>

            <textarea
              rows={5}
              placeholder="Add any payment details or notes."
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              className={inputStyle}
            />
          </section>

          {selectedService && (
            <div className="rounded-xl bg-[#eef2e9] p-4 text-sm text-[#4d6247]">
              <p className="font-semibold">
                {selectedService.service || "Selected Service"}
              </p>

              <p className="mt-1 text-[#708075]">
                Service price: $
                {Number(
                  selectedService.price ?? 0
                ).toLocaleString("en-US")}
              </p>

              {paymentStatus === "Paid" && (
                <p className="mt-2 text-xs font-semibold text-[#647d5b]">
                  Saving this payment will mark the service as Paid.
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href={`/clients/${clientId}`}
              className="rounded-xl border border-[#d7e1d0] bg-white px-6 py-3 text-center text-sm font-semibold text-[#4d6247] hover:bg-[#f5f7f2]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#647d5b] px-6 py-3 text-sm font-semibold text-white hover:bg-[#4d6247] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving Payment..." : "Save Payment"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
