"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
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

function calculatePrice(selectedServices: string[]) {
  return selectedServices.reduce((total, serviceName) => {
    const service = serviceOptions.find(
      (option) => option.name === serviceName
    );

    return total + (service?.price ?? 0);
  }, 0);
}

function parseServices(serviceValue: string | null) {
  if (!serviceValue) return [];

  return serviceValue
    .split(" + ")
    .map((service) => service.trim())
    .filter(Boolean);
}

export default function EditClientPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const clientId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");

  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const [status, setStatus] = useState("New");
  const [paymentStatus, setPaymentStatus] = useState("Open");
  const [intakeDate, setIntakeDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [projectNotes, setProjectNotes] = useState("");

  const totalPrice = useMemo(
    () => calculatePrice(selectedServices),
    [selectedServices]
  );

  useEffect(() => {
    async function loadClient() {
      if (!Number.isInteger(clientId)) {
        setErrorMessage("Invalid client ID.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();

      if (error || !data) {
        console.error("Unable to load client:", error);
        setErrorMessage("The client could not be loaded.");
        setLoading(false);
        return;
      }

      setName(data.name ?? "");
      setEmail(data.email ?? "");
      setPhone(data.phone ?? "");
      setCompany(data.company ?? "");
      setSelectedServices(parseServices(data.service));
      setStatus(data.status ?? "New");
      setPaymentStatus(data.payment_status ?? "Open");
      setIntakeDate(data.intake_date ?? "");
      setDueDate(data.due_date ?? "");
      setNextStep(data.next_step ?? "");
      setProjectNotes(data.project_notes ?? "");

      setLoading(false);
    }

    loadClient();
  }, [clientId]);

  function toggleService(serviceName: string) {
    setSelectedServices((currentServices) => {
      if (currentServices.includes(serviceName)) {
        return currentServices.filter(
          (service) => service !== serviceName
        );
      }

      let updatedServices = [...currentServices];

      if (serviceName === "Resume + Cover Letter") {
        updatedServices = updatedServices.filter(
          (service) =>
            service !== "Resume" && service !== "Cover Letter"
        );
      }

      if (
        serviceName === "Resume" ||
        serviceName === "Cover Letter"
      ) {
        updatedServices = updatedServices.filter(
          (service) => service !== "Resume + Cover Letter"
        );
      }

      return [...updatedServices, serviceName];
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!name.trim()) {
      setErrorMessage("Please enter the client’s name.");
      return;
    }

    if (selectedServices.length === 0) {
      setErrorMessage("Please select at least one service.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("clients")
      .update({
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        company: company.trim() || null,
        service: selectedServices.join(" + "),
        price: totalPrice,
        status,
        payment_status: paymentStatus,
        intake_date: intakeDate || null,
        due_date: dueDate || null,
        next_step: nextStep.trim() || null,
        project_notes: projectNotes.trim() || null,
      })
      .eq("id", clientId);

    if (error) {
      console.error("Unable to update client:", error);
      setErrorMessage(error.message);
      setSaving(false);
      return;
    }

    router.push(`/clients/${clientId}`);
    router.refresh();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8f3] p-10 text-[#243128]">
        <div className="mx-auto max-w-5xl rounded-3xl border border-[#dfe6db] bg-white p-10 shadow-sm">
          <p className="text-sm font-semibold text-[#708075]">
            Loading client...
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
            ← Back to Client
          </Link>

          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            Edit Client
          </h1>

          <p className="mt-2 text-sm text-[#708075]">
            Update contact details, services, status, payment, and
            project information.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl p-6 lg:p-10">
        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-3xl border border-[#dfe6db] bg-white shadow-sm"
        >
          <section className="border-b border-[#e4e9df] p-6 lg:p-8">
            <h2 className="text-xl font-bold">
              Client Information
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <FormField label="Full Name" required>
                <input
                  required
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  className={inputStyle}
                />
              </FormField>

              <FormField label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  className={inputStyle}
                />
              </FormField>

              <FormField label="Phone Number">
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  className={inputStyle}
                />
              </FormField>

              <FormField label="Company">
                <input
                  value={company}
                  onChange={(event) =>
                    setCompany(event.target.value)
                  }
                  className={inputStyle}
                />
              </FormField>
            </div>
          </section>

          <section className="border-b border-[#e4e9df] p-6 lg:p-8">
            <h2 className="text-xl font-bold">
              Services and Pricing
            </h2>

            <p className="mt-1 text-sm text-[#708075]">
              Select the services attached to this client.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {serviceOptions.map((service) => {
                const isSelected =
                  selectedServices.includes(service.name);

                return (
                  <button
                    key={service.name}
                    type="button"
                    onClick={() =>
                      toggleService(service.name)
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
                          {service.name}
                        </p>

                        <p className="mt-1 text-sm leading-6 text-[#708075]">
                          {service.description}
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
                      ${service.price.toLocaleString()}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl border border-[#d7e1d0] bg-[#eef2e9] p-5">
              <div className="flex items-center justify-between gap-5">
                <div>
                  <p className="text-sm font-semibold text-[#4d6247]">
                    Selected Services
                  </p>

                  <p className="mt-2 text-sm text-[#708075]">
                    {selectedServices.length
                      ? selectedServices.join(", ")
                      : "No services selected"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#7f9975]">
                    Total
                  </p>

                  <p className="mt-1 text-3xl font-bold">
                    ${totalPrice.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="border-b border-[#e4e9df] p-6 lg:p-8">
            <h2 className="text-xl font-bold">
              Status and Payment
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <FormField label="Project Status">
                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value)
                  }
                  className={inputStyle}
                >
                  <option>New</option>
                  <option>Free15 Scheduled</option>
                  <option>Consultation Complete</option>
                  <option>Session Scheduled</option>
                  <option>In Progress</option>
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

              <FormField label="Date Reached Out">
                <input
                  type="date"
                  value={intakeDate}
                  onChange={(event) =>
                    setIntakeDate(event.target.value)
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

              <div className="md:col-span-2">
                <FormField label="Next Step">
                  <input
                    value={nextStep}
                    onChange={(event) =>
                      setNextStep(event.target.value)
                    }
                    className={inputStyle}
                  />
                </FormField>
              </div>

              <div className="md:col-span-2">
                <FormField label="Project Notes">
                  <textarea
                    rows={6}
                    value={projectNotes}
                    onChange={(event) =>
                      setProjectNotes(event.target.value)
                    }
                    className={`${inputStyle} resize-y`}
                  />
                </FormField>
              </div>
            </div>
          </section>

          <section className="p-6 lg:p-8">
            {errorMessage && (
              <div className="mb-5 rounded-xl border border-[#ead4d0] bg-[#fbefed] p-4 text-sm text-[#8d4f48]">
                Client could not be updated: {errorMessage}
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
                disabled={
                  saving || selectedServices.length === 0
                }
                className="rounded-xl bg-[#647d5b] px-6 py-3 text-sm font-semibold text-white hover:bg-[#4d6247] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving Changes..." : "Save Changes"}
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
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[#3d4d39]">
        {label}
        {required && (
          <span className="ml-1 text-[#a85656]">*</span>
        )}
      </span>

      <div className="mt-2">{children}</div>
    </label>
  );
}