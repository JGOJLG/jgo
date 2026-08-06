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

const linkedInSources = [
  "Proposal",
  "Post",
  "Direct Message",
  "Connection Request",
  "LinkedIn Search",
  "Profile Visit",
  "Comment or Engagement",
  "Referral Through LinkedIn",
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

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length === 0) {
    return "";
  }

  if (digits.length <= 3) {
    return `(${digits}`;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(
    3,
    6
  )}-${digits.slice(6)}`;
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
  const [referralName, setReferralName] = useState("");
  const [linkedInSource, setLinkedInSource] = useState("");
  const [linkedInSourceOther, setLinkedInSourceOther] = useState("");
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

  function handleLeadSourceChange(value: string) {
    setLeadSource(value);

    if (value !== "Referral") {
      setReferralName("");
    }

    if (value !== "LinkedIn") {
      setLinkedInSource("");
      setLinkedInSourceOther("");
    }
  }

  function handleLinkedInSourceChange(value: string) {
    setLinkedInSource(value);

    if (value !== "Other") {
      setLinkedInSourceOther("");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setErrorMessage("Full name is required.");
      return;
    }

    if (leadSource === "Referral" && !referralName.trim()) {
      setErrorMessage("Please add who referred this lead.");
      return;
    }

    if (leadSource === "LinkedIn" && !linkedInSource) {
      setErrorMessage("Please select how this lead found you on LinkedIn.");
      return;
    }

    if (
      leadSource === "LinkedIn" &&
      linkedInSource === "Other" &&
      !linkedInSourceOther.trim()
    ) {
      setErrorMessage("Please describe the LinkedIn source.");
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
        referral_name:
          leadSource === "Referral" ? referralName.trim() || null : null,
        linkedin_source:
          leadSource === "LinkedIn" ? linkedInSource || null : null,
        linkedin_source_other:
          leadSource === "LinkedIn" && linkedInSource === "Other"
            ? linkedInSourceOther.trim() || null
            : null,
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
      setErrorMessage(error?.message || "Unable to create lead.");
      setSaving(false);
      return;
    }

    const { error: timelineError } = await supabase
      .from("client_timeline")
      .insert({
        client_id: client.id,
        event_type: "lead_created",
        title: "Lead Created",
        status: "Complete",
        completed_at: new Date().toISOString(),
      });

    if (timelineError) {
      console.error("Unable to create lead timeline event:", timelineError);
    }

    if (selectedServices.length > 0) {
      const { error: servicesTimelineError } = await supabase
        .from("client_timeline")
        .insert({
          client_id: client.id,
          event_type: "services_selected",
          title: "Services Selected",
          status: "Complete",
          completed_at: new Date().toISOString(),
        });

      if (servicesTimelineError) {
        console.error(
          "Unable to create services selected timeline event:",
          servicesTimelineError
        );
      }

      const { error: servicesError } = await supabase
        .from("client_services")
        .insert(
          selectedServices.map((service) => ({
            client_id: client.id,
            service,
            payment_status: "Open",
          }))
        );

      if (servicesError) {
        console.error("Unable to create selected services:", servicesError);
      }
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

          <h1 className="mt-4 text-3xl font-bold">Add Lead</h1>

          <p className="mt-2 text-sm text-[#708075]">
            Add their contact details, lead source, and services they are
            interested in.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl p-6 lg:p-10">
        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-3xl border border-[#dfe6db] bg-white shadow-sm"
        >
          <section className="border-b border-[#e4e9df] p-6 lg:p-8">
            <h2 className="text-xl font-bold">Contact Information</h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <FormField label="Full Name" required>
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={inputStyle}
                  placeholder="Client name"
                />
              </FormField>

              <FormField label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={inputStyle}
                  placeholder="client@email.com"
                />
              </FormField>

              <FormField label="Phone">
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={14}
                  value={phone}
                  onChange={(event) =>
                    setPhone(
                      formatPhoneNumber(event.target.value)
                    )
                  }
                  className={inputStyle}
                  placeholder="(555) 555-5555"
                />
              </FormField>

              <FormField label="Lead Source">
                <select
                  value={leadSource}
                  onChange={(event) =>
                    handleLeadSourceChange(event.target.value)
                  }
                  className={inputStyle}
                >
                  <option value="">Select source</option>
                  {leadSources.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </FormField>

              {leadSource === "Referral" ? (
                <div className="md:col-span-2 rounded-2xl border border-[#d7e1d0] bg-[#f3f6f0] p-5">
                  <FormField label="Who referred them?" required>
                    <input
                      required
                      value={referralName}
                      onChange={(event) =>
                        setReferralName(event.target.value)
                      }
                      className={inputStyle}
                      placeholder="Enter the referral name"
                    />
                  </FormField>
                </div>
              ) : null}

              {leadSource === "LinkedIn" ? (
                <div className="md:col-span-2 rounded-2xl border border-[#d7e1d0] bg-[#f3f6f0] p-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <FormField label="How did they find you?" required>
                      <select
                        required
                        value={linkedInSource}
                        onChange={(event) =>
                          handleLinkedInSourceChange(event.target.value)
                        }
                        className={inputStyle}
                      >
                        <option value="">Select LinkedIn source</option>
                        {linkedInSources.map((source) => (
                          <option key={source} value={source}>
                            {source}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    {linkedInSource === "Other" ? (
                      <FormField label="Please specify" required>
                        <input
                          required
                          value={linkedInSourceOther}
                          onChange={(event) =>
                            setLinkedInSourceOther(event.target.value)
                          }
                          className={inputStyle}
                          placeholder="Describe how they found you"
                        />
                      </FormField>
                    ) : (
                      <div className="rounded-xl border border-dashed border-[#cfd9c9] bg-white/70 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#7f9975]">
                          LinkedIn tracking
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[#708075]">
                          This will help you see which LinkedIn activity brings
                          in the most leads.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              <div className="md:col-span-2">
                <FormField label="Address">
                  <input
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    className={inputStyle}
                    placeholder="Street address"
                  />
                </FormField>
              </div>

              <FormField label="City">
                <input
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  className={inputStyle}
                />
              </FormField>

              <FormField label="State">
                <input
                  value={state}
                  onChange={(event) =>
                    setState(event.target.value.slice(0, 2))
                  }
                  className={`${inputStyle} uppercase`}
                  maxLength={2}
                  placeholder="FL"
                />
              </FormField>

              <FormField label="Zip">
                <input
                  value={zip}
                  onChange={(event) => setZip(event.target.value)}
                  className={inputStyle}
                />
              </FormField>

              <FormField label="Date Reached Out">
                <input
                  type="date"
                  value={dateReachedOut}
                  onChange={(event) =>
                    setDateReachedOut(event.target.value)
                  }
                  className={inputStyle}
                />
              </FormField>
            </div>
          </section>

          <section className="border-b border-[#e4e9df] p-6 lg:p-8">
            <h2 className="text-xl font-bold">Services Interested In</h2>

            <p className="mt-1 text-sm text-[#708075]">
              These are interests only. They will not count as outstanding
              revenue until scheduled or invoiced.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {services.map((service) => {
                const selected = selectedServices.includes(service);

                return (
                  <button
                    key={service}
                    type="button"
                    onClick={() => toggleService(service)}
                    className={`rounded-full border px-5 py-3 text-sm font-semibold transition ${
                      selected
                        ? "border-[#7f9975] bg-[#7f9975] text-white"
                        : "border-[#d7e1d0] bg-[#fbfcf9] text-[#3d4d39] hover:border-[#9fb294]"
                    }`}
                  >
                    {service}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="border-b border-[#e4e9df] p-6 lg:p-8">
            <h2 className="text-xl font-bold">Notes</h2>

            <textarea
              rows={6}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className={`${inputStyle} mt-5 resize-y`}
              placeholder="Add notes..."
            />
          </section>

          <section className="p-6 lg:p-8">
            {errorMessage ? (
              <div className="mb-6 rounded-xl border border-[#ead4d0] bg-[#fbefed] p-4 text-sm font-medium text-[#8d4f48]">
                {errorMessage}
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link
                href="/clients"
                className="rounded-xl border border-[#d7e1d0] px-5 py-3 text-center text-sm font-semibold text-[#4d6247]"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#647d5b] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#4d6247] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Lead"}
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
        {required ? <span className="ml-1 text-[#a85656]">*</span> : null}
      </span>

      <div className="mt-2">{children}</div>
    </label>
  );
}
