"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

const services = [
  "Resume",
  "Cover Letter",
  "Resume + Cover Letter",
  "Career Coaching",
];

const sources = [
  "Referral",
  "LinkedIn",
  "Instagram",
  "TikTok",
  "Facebook",
  "Google Search",
  "Website",
  "Substack",
  "Networking",
  "Former Client",
  "Other",
];

const linkedinOptions = [
  "LinkedIn Request",
  "LinkedIn Message",
  "LinkedIn Post",
  "LinkedIn Comment",
  "LinkedIn Referral",
  "Other",
];

const statuses = [
  "New Lead",
  "Free 15 Scheduled",
  "Free 15 Completed",
  "Follow Up Needed",
  "Proposal Sent",
  "Converted",
  "Not Moving Forward",
];

export default function NewLeadPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [source, setSource] = useState("");
  const [referralName, setReferralName] = useState("");
  const [linkedinSource, setLinkedinSource] = useState("");

  const [free15Date, setFree15Date] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  const [status, setStatus] = useState("New Lead");

  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const [nextStep, setNextStep] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
      setError("Please enter a name.");
      return;
    }

    setSaving(true);
    setError("");

    const { data: userCheck } = await supabase.auth.getUser();

    if (!userCheck.user) {
      setError(
        "Your login session expired. Please log out and log back in."
      );
      setSaving(false);
      return;
    }

    const servicesSelected = selectedServices.join(", ");

    let sourceValue = source;

    if (source === "Referral" && referralName.trim()) {
      sourceValue = `Referral - ${referralName.trim()}`;
    }

    if (source === "LinkedIn" && linkedinSource) {
      sourceValue = `LinkedIn - ${linkedinSource}`;
    }

    const combinedNotes = [
      nextStep ? `Next Step: ${nextStep}` : "",
      notes.trim(),
    ]
      .filter(Boolean)
      .join("\n\n");

    const { error } = await supabase
      .from("intake_calls")
      .insert({
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,

        call_date: free15Date || null,
        call_type: sourceValue || null,

        needs_help_with: servicesSelected || null,
        services_discussed: servicesSelected || null,

        status,

        follow_up_date: followUpDate || null,

        notes: combinedNotes || null,

        converted_to_client: false,
      });

    if (error) {
      console.error(error);
      setError(error.message);
      setSaving(false);
      return;
    }

    router.push("/leads");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#243128]">
      <header className="border-b border-[#dfe6db] bg-[#fbfaf6] px-6 py-7 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/leads"
            className="text-sm font-semibold text-[#7f9975]"
          >
            ← Back to Leads
          </Link>

          <h1 className="mt-4 text-3xl font-bold">
            Add New Lead
          </h1>

          <p className="mt-2 text-sm text-[#708075]">
            Track potential clients and Free 15 consultations.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-4xl p-6 lg:p-10">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-3xl border border-[#dfe6db] bg-white p-8 shadow-sm"
        >
          <section>
            <h2 className="text-xl font-bold">
              Contact Information
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input
                required
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputStyle}
              />

              <input
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputStyle}
              />

              <input
                placeholder="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputStyle}
              />

              <select
                value={source}
                onChange={(e) => {
                  setSource(e.target.value);
                  setReferralName("");
                  setLinkedinSource("");
                }}
                className={inputStyle}
              >
                <option value="">
                  Where Did You Find Us?
                </option>

                {sources.map((item) => (
                  <option key={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {source === "Referral" && (
              <input
                className={`${inputStyle} mt-4`}
                placeholder="Who referred them?"
                value={referralName}
                onChange={(e) =>
                  setReferralName(e.target.value)
                }
              />
            )}

            {source === "LinkedIn" && (
              <select
                value={linkedinSource}
                onChange={(e) =>
                  setLinkedinSource(e.target.value)
                }
                className={`${inputStyle} mt-4`}
              >
                <option value="">
                  Select LinkedIn Source
                </option>

                {linkedinOptions.map((item) => (
                  <option key={item}>
                    {item}
                  </option>
                ))}
              </select>
            )}
          </section>

          <section>
            <h2 className="text-xl font-bold">
              Free 15 Consultation
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input
                type="date"
                value={free15Date}
                onChange={(e) =>
                  setFree15Date(e.target.value)
                }
                className={inputStyle}
              />

              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value)
                }
                className={inputStyle}
              >
                {statuses.map((item) => (
                  <option key={item}>
                    {item}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={followUpDate}
                onChange={(e) =>
                  setFollowUpDate(e.target.value)
                }
                className={inputStyle}
              />
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold">
              Interested In
            </h2>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {services.map((service) => (
                <label
                  key={service}
                  className="rounded-xl border border-[#dfe6db] p-4"
                >
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(service)}
                    onChange={() => toggleService(service)}
                    className="mr-2"
                  />

                  {service}
                </label>
              ))}
            </div>
          </section>

          <section>
            <input
              placeholder="Next Step"
              value={nextStep}
              onChange={(e) => setNextStep(e.target.value)}
              className={inputStyle}
            />

            <textarea
              rows={5}
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${inputStyle} mt-4`}
            />
          </section>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            disabled={saving}
            className="rounded-xl bg-[#647d5b] px-6 py-3 font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving Lead..." : "Save Lead"}
          </button>
        </form>
      </div>
    </main>
  );
}

const inputStyle =
  "w-full rounded-xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3 text-sm text-[#243128] outline-none placeholder:text-[#9aa59c] focus:border-[#9fb294]";