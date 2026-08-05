"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useState } from "react";
import { supabase } from "@/lib/supabase";

const leadSources = [
  "LinkedIn",
  "Referral",
  "Website",
  "Google",
  "Instagram",
  "TikTok",
  "Substack",
  "Former Client",
  "Networking",
  "Other",
];

const services = [
  "Resume",
  "Cover Letter",
  "Resume + Cover Letter",
  "Career Coaching",
];

function getToday() {
  return new Date().toISOString().split("T")[0];
}

export default function NewClientPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");

  const [leadSource, setLeadSource] = useState("");

  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const [dateReachedOut, setDateReachedOut] = useState(getToday());

  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function toggleService(service: string) {
    setSelectedServices((current) =>
      current.includes(service)
        ? current.filter((item) => item !== service)
        : [...current, service]
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setErrorMessage("Full name is required.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    const { data: client, error } = await supabase
      .from("clients")
      .insert({
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        address_line1: address.trim() || null,
        city: city.trim() || null,
        state: state.trim().toUpperCase() || null,
        postal_code: zip.trim() || null,
        lead_source: leadSource || null,
        client_type: "Lead",
        status: "Lead",
        is_repeat_client: false,
        intake_date: dateReachedOut || null,
        project_notes: notes.trim() || null,
      })
      .select("id")
      .single();

    if (error || !client) {
      console.error(error);
      setErrorMessage(
        error?.message || "Unable to create lead."
      );
      setSaving(false);
      return;
    }

    await supabase.from("client_timeline").insert({
      client_id: client.id,
      event_type: "lead_created",
      title: "Lead Created",
      status: "Complete",
      completed_at: new Date().toISOString(),
    });

    if (selectedServices.length > 0) {
      await supabase.from("client_timeline").insert({
        client_id: client.id,
        event_type: "services_selected",
        title: "Services Selected",
        status: "Complete",
        completed_at: new Date().toISOString(),
      });

      await supabase.from("client_services").insert(
        selectedServices.map((service) => ({
          client_id: client.id,
          service,
          payment_status: "Open",
        }))
      );
    }

    router.push(`/clients/${client.id}`);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#243128]">
      <header className="border-b border-[#dfe6db] bg-white px-6 py-8">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/clients"
            className="text-sm font-semibold text-[#71896a]"
          >
            ← Back to Clients
          </Link>

          <h1 className="mt-4 text-3xl font-bold">
            Add Lead
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-5xl p-6">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-[#dfe6db] bg-white p-8"
        >
                  <section className="mt-8">
          <h2 className="text-xl font-bold">
            Contact Information
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <FormField label="Full Name" required>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputStyle}
                placeholder="Client name"
              />
            </FormField>

            <FormField label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputStyle}
                placeholder="client@email.com"
              />
            </FormField>

            <FormField label="Phone">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputStyle}
                placeholder="(555) 555-5555"
              />
            </FormField>

            <FormField label="Lead Source">
              <select
                value={leadSource}
                onChange={(e) => setLeadSource(e.target.value)}
                className={inputStyle}
              >
                <option value="">
                  Select source
                </option>

                {leadSources.map((source) => (
                  <option key={source}>
                    {source}
                  </option>
                ))}
              </select>
            </FormField>

            <div className="md:col-span-2">
              <FormField label="Address">
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={inputStyle}
                  placeholder="Street address"
                />
              </FormField>
            </div>

            <FormField label="City">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={inputStyle}
              />
            </FormField>

            <FormField label="State">
              <input
                value={state}
                onChange={(e) =>
                  setState(e.target.value.slice(0, 2))
                }
                className={`${inputStyle} uppercase`}
                maxLength={2}
              />
            </FormField>

            <FormField label="Zip">
              <input
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                className={inputStyle}
              />
            </FormField>

            <FormField label="Date Reached Out">
              <input
                type="date"
                value={dateReachedOut}
                onChange={(e) =>
                  setDateReachedOut(e.target.value)
                }
                className={inputStyle}
              />
            </FormField>
          </div>
        </section>

        <section className="mt-10 border-t border-[#e4e9df] pt-8">
          <h2 className="text-xl font-bold">
            Services Interested In
          </h2>

          <div className="mt-5 flex flex-wrap gap-3">
            {services.map((service) => {
              const selected =
                selectedServices.includes(service);

              return (
                <button
                  key={service}
                  type="button"
                  onClick={() =>
                    toggleService(service)
                  }
                  className={`rounded-full border px-5 py-3 text-sm font-semibold transition ${
                    selected
                      ? "border-[#7f9975] bg-[#7f9975] text-white"
                      : "border-[#d7e1d0] bg-[#fbfcf9] text-[#3d4d39]"
                  }`}
                >
                  {service}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-10 border-t border-[#e4e9df] pt-8">
          <h2 className="text-xl font-bold">
            Notes
          </h2>

          <textarea
            rows={6}
            value={notes}
            onChange={(e) =>
              setNotes(e.target.value)
            }
            className={`${inputStyle} mt-5 resize-y`}
            placeholder="Add notes..."
          />
        </section>

        {errorMessage && (
          <div className="mt-6 rounded-xl border border-[#ead4d0] bg-[#fbefed] p-4 text-sm text-[#8d4f48]">
            {errorMessage}
          </div>
        )}

        <div className="mt-8 flex justify-end gap-3">
          <Link
            href="/clients"
            className="rounded-xl border border-[#d7e1d0] px-5 py-3 text-sm font-semibold text-[#4d6247]"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#647d5b] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Lead"}
          </button>
        </div>
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
          <span className="ml-1 text-[#a85656]">
            *
          </span>
        )}
      </span>

      <div className="mt-2">
        {children}
      </div>
    </label>
  );
}
