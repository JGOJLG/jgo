"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useState } from "react";
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

export default function NewClientPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [leadSource, setLeadSource] = useState("");
  const [referralName, setReferralName] = useState("");
  const [linkedinSource, setLinkedinSource] = useState("");

  const [serviceSelection, setServiceSelection] = useState("");
  const [customService, setCustomService] = useState("");
  const [price, setPrice] = useState("");

  const [status, setStatus] = useState("Lead");
  const [paymentStatus, setPaymentStatus] = useState("Open");

  const [dateAdded, setDateAdded] = useState(getToday());
  const [free15Date, setFree15Date] = useState("");
  const [scheduledSessionDate, setScheduledSessionDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [clientNotes, setClientNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const finalService =
    serviceSelection === "Other"
      ? customService.trim()
      : serviceSelection;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setErrorMessage("Please enter the client’s name.");
      return;
    }

    if (serviceSelection === "Other" && !customService.trim()) {
      setErrorMessage("Please type the custom service.");
      return;
    }

    if (finalService && price === "") {
      setErrorMessage("Please enter a price for the service.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    const numericPrice = price === "" ? null : Number(price);

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .insert({
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        address_line1: addressLine1.trim() || null,
        address_line2: addressLine2.trim() || null,
        city: city.trim() || null,
        state: state.trim().toUpperCase() || null,
        postal_code: postalCode.trim() || null,
        lead_source: leadSource || null,
        referral_name:
          leadSource === "Referral"
            ? referralName.trim() || null
            : null,
        linkedin_source:
          leadSource === "LinkedIn"
            ? linkedinSource || null
            : null,
        service: finalService || null,
        price: numericPrice,
        status,
        payment_status: paymentStatus,
        intake_date: dateAdded || null,
        due_date: dueDate || null,
        next_step: nextStep.trim() || null,
        project_notes: clientNotes.trim() || null,
      })
      .select("id")
      .single();

    if (clientError || !client) {
      console.error("Unable to create client:", clientError);
      setErrorMessage(
        clientError?.message || "The client could not be saved."
      );
      setSaving(false);
      return;
    }

    if (finalService) {
      const { error: serviceError } = await supabase
        .from("client_services")
        .insert({
          client_id: client.id,
          service: finalService,
          price: numericPrice,
          status,
          payment_status: paymentStatus,
          date_added: dateAdded || getToday(),
          free15_date: free15Date || null,
          scheduled_date: scheduledSessionDate || null,
          due_date: dueDate || null,
          next_step: nextStep.trim() || null,
          notes: clientNotes.trim() || null,
        });

      if (serviceError) {
        console.error("Unable to create service:", serviceError);
        setErrorMessage(serviceError.message);
        setSaving(false);
        return;
      }
    }

    router.push(`/clients/${client.id}`);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#243128]">
      <header className="border-b border-[#dfe6db] bg-[#fbfaf6] px-6 py-7 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/clients"
            className="text-sm font-semibold text-[#7f9975] hover:text-[#4d6247]"
          >
            ← Back to Clients
          </Link>

          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            Add New Client
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-10">
        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-3xl border border-[#dfe6db] bg-white shadow-sm"
        >
          <section className="border-b border-[#e4e9df] p-6 lg:p-8">
            <h2 className="text-xl font-bold">Client Information</h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <FormField label="Full Name" required>
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Client’s full name"
                  className={inputStyle}
                />
              </FormField>

              <FormField label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="client@email.com"
                  className={inputStyle}
                />
              </FormField>

              <FormField label="Phone Number">
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="(555) 555-5555"
                  className={inputStyle}
                />
              </FormField>

              <FormField label="Where Did You Find Us?">
                <select
                  value={leadSource}
                  onChange={(event) => setLeadSource(event.target.value)}
                  className={inputStyle}
                >
                  <option value="">Select source</option>
                  <option value="Referral">Referral</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Instagram">Instagram</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Google Search">Google Search</option>
                  <option value="Website">Website</option>
                  <option value="Substack">Substack</option>
                  <option value="Networking">Networking</option>
                  <option value="Former Client">Former Client</option>
                  <option value="Other">Other</option>
                </select>
              </FormField>

              {leadSource === "Referral" && (
                <FormField label="Who Referred You?">
                  <input
                    value={referralName}
                    onChange={(event) =>
                      setReferralName(event.target.value)
                    }
                    placeholder="Name of referral"
                    className={inputStyle}
                  />
                </FormField>
              )}

              {leadSource === "LinkedIn" && (
                <FormField label="LinkedIn Source">
                  <select
                    value={linkedinSource}
                    onChange={(event) =>
                      setLinkedinSource(event.target.value)
                    }
                    className={inputStyle}
                  >
                    <option value="">Select LinkedIn source</option>
                    <option>LinkedIn Request</option>
                    <option>LinkedIn Message</option>
                    <option>LinkedIn Post</option>
                    <option>LinkedIn Comment</option>
                    <option>LinkedIn Referral</option>
                    <option>Other</option>
                  </select>
                </FormField>
              )}
            </div>
          </section>

          <section className="border-b border-[#e4e9df] p-6 lg:p-8">
            <div>
              <h2 className="text-xl font-bold">Mailing Address</h2>

              <p className="mt-1 text-sm text-[#708075]">
                Optional. Add an address for holiday cards and client mail.
              </p>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <FormField label="Street Address">
                  <input
                    value={addressLine1}
                    onChange={(event) =>
                      setAddressLine1(event.target.value)
                    }
                    placeholder="123 Main Street"
                    autoComplete="address-line1"
                    className={inputStyle}
                  />
                </FormField>
              </div>

              <div className="md:col-span-2">
                <FormField label="Apartment, Suite, or Unit">
                  <input
                    value={addressLine2}
                    onChange={(event) =>
                      setAddressLine2(event.target.value)
                    }
                    placeholder="Apt 4B"
                    autoComplete="address-line2"
                    className={inputStyle}
                  />
                </FormField>
              </div>

              <FormField label="City">
                <input
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="West Palm Beach"
                  autoComplete="address-level2"
                  className={inputStyle}
                />
              </FormField>

              <FormField label="State">
                <input
                  value={state}
                  onChange={(event) =>
                    setState(event.target.value.slice(0, 2))
                  }
                  placeholder="FL"
                  maxLength={2}
                  autoComplete="address-level1"
                  className={`${inputStyle} uppercase`}
                />
              </FormField>

              <FormField label="ZIP Code">
                <input
                  value={postalCode}
                  onChange={(event) =>
                    setPostalCode(event.target.value)
                  }
                  placeholder="33401"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  className={inputStyle}
                />
              </FormField>
            </div>
          </section>

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
                  value={scheduledSessionDate}
                  onChange={(event) =>
                    setScheduledSessionDate(event.target.value)
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
                    rows={5}
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
                href="/clients"
                className="rounded-xl border border-[#d7e1d0] bg-white px-5 py-3 text-center text-sm font-semibold text-[#4d6247]"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#647d5b] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Client"}
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
        {required && <span className="ml-1 text-[#a85656]">*</span>}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
