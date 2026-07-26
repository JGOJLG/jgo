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

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();

  const clientId = String(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");

  const [status, setStatus] = useState("New");
  const [paymentStatus, setPaymentStatus] = useState("Open");

  const [intakeDate, setIntakeDate] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [nextStep, setNextStep] = useState("");
  const [projectNotes, setProjectNotes] = useState("");

  useEffect(() => {
    async function loadClient() {
      console.log("CLIENT ID FROM URL:", clientId);
      if (!clientId) {
        setErrorMessage("Invalid client ID.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .maybeSingle();

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

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("clients")
      .update({
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        company: company.trim() || null,

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
            Update client information and project details.
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
              <FormField label="Full Name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputStyle}
                />
              </FormField>

              <FormField label="Email">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputStyle}
                />
              </FormField>

              <FormField label="Phone Number">
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputStyle}
                />
              </FormField>

              <FormField label="Company">
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className={inputStyle}
                />
              </FormField>
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
                  onChange={(e) => setStatus(e.target.value)}
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
                  onChange={(e) =>
                    setPaymentStatus(e.target.value)
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
                  onChange={(e) =>
                    setIntakeDate(e.target.value)
                  }
                  className={inputStyle}
                />
              </FormField>

              <FormField label="Project Due Date">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) =>
                    setDueDate(e.target.value)
                  }
                  className={inputStyle}
                />
              </FormField>
            </div>
          </section>

          <section className="p-6 lg:p-8">
            <FormField label="Next Step">
              <input
                value={nextStep}
                onChange={(e) =>
                  setNextStep(e.target.value)
                }
                className={inputStyle}
              />
            </FormField>

            <div className="mt-5">
              <FormField label="Project Notes">
                <textarea
                  rows={6}
                  value={projectNotes}
                  onChange={(e) =>
                    setProjectNotes(e.target.value)
                  }
                  className={`${inputStyle} resize-y`}
                />
              </FormField>
            </div>

            {errorMessage && (
              <div className="mt-5 rounded-xl border border-[#ead4d0] bg-[#fbefed] p-4 text-sm text-[#8d4f48]">
                Client could not be updated: {errorMessage}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Link
                href={`/clients/${clientId}`}
                className="rounded-xl border border-[#d7e1d0] bg-white px-5 py-3 text-sm font-semibold text-[#4d6247]"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#647d5b] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </section>
        </form>
      </div>
    </main>
  );
}

const inputStyle =
  "w-full rounded-xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3 text-sm text-[#243128] outline-none focus:border-[#9fb294] focus:ring-2 focus:ring-[#e8eee3]";

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