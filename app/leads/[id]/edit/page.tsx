"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const services = [
  "Resume",
  "Cover Letter",
  "Resume + Cover Letter",
  "Career Coaching",
];

const statuses = [
  "New Lead",
  "Free 15 Scheduled",
  "Follow Up Needed",
];

const inputStyle =
  "w-full rounded-xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3 text-sm text-[#243128] outline-none placeholder:text-[#9aa59c] focus:border-[#9fb294]";

export default function EditLeadPage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [callType, setCallType] = useState("");
  const [callDate, setCallDate] = useState("");
  const [status, setStatus] = useState("New Lead");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadLead();
  }, []);

  async function loadLead() {
    const { data, error } = await supabase
      .from("intake_calls")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setName(data.name || "");
    setEmail(data.email || "");
    setPhone(data.phone || "");
    setCallType(data.call_type || "");
    setCallDate(data.call_date || "");
    setStatus(
      statuses.includes(data.status)
        ? data.status
        : "New Lead"
    );
    setNotes(data.notes || "");

    if (data.services_discussed) {
      setSelectedServices(
        data.services_discussed
          .split(",")
          .map((item: string) => item.trim())
          .filter(Boolean)
      );
    }

    setLoading(false);
  }

  function toggleService(service: string) {
    setSelectedServices((current) =>
      current.includes(service)
        ? current.filter((item) => item !== service)
        : [...current, service]
    );
  }

  async function saveLead() {
    setSaving(true);
    setError("");

    const { error } = await supabase
      .from("intake_calls")
      .update({
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        call_type: callType.trim() || null,
        call_date: callDate || null,
        status,
        services_discussed:
          selectedServices.join(", ") || null,
        notes: notes.trim() || null,
      })
      .eq("id", id);

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    router.push(`/leads/${id}`);
    router.refresh();
  }

  if (loading) {
    return (
      <div className="p-10 text-sm text-[#708075]">
        Loading lead...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#243128]">
      <header className="border-b border-[#dfe6db] bg-[#fbfaf6] px-6 py-7 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <Link
            href={`/leads/${id}`}
            className="text-sm font-semibold text-[#7f9975]"
          >
            ← Back to Lead
          </Link>

          <h1 className="mt-4 text-3xl font-bold">
            Edit Lead
          </h1>

          <p className="mt-2 text-sm text-[#708075]">
            Update lead information and Free 15 details.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-4xl p-6 lg:p-10">
        <div className="space-y-8 rounded-3xl border border-[#dfe6db] bg-white p-8 shadow-sm">
          <section>
            <h2 className="text-xl font-bold">
              Contact Information
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#4d6247]">
                  Name
                </label>

                <input
                  className={inputStyle}
                  placeholder="Name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#4d6247]">
                  Email
                </label>

                <input
                  type="email"
                  className={inputStyle}
                  placeholder="Email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#4d6247]">
                  Phone
                </label>

                <input
                  className={inputStyle}
                  placeholder="Phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#4d6247]">
                  Lead Source
                </label>

                <input
                  className={inputStyle}
                  placeholder="Source"
                  value={callType}
                  onChange={(event) => setCallType(event.target.value)}
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold">
              Lead Status
            </h2>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-[#4d6247]">
                Current Stage
              </label>

              <select
                className={inputStyle}
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold">
              Free 15 Consultation
            </h2>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-[#4d6247]">
                Free 15 Date
              </label>

              <input
                type="date"
                className={inputStyle}
                value={callDate}
                onChange={(event) => setCallDate(event.target.value)}
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
                  className={`cursor-pointer rounded-xl border p-4 transition ${
                    selectedServices.includes(service)
                      ? "border-[#9fb294] bg-[#f1f5ee]"
                      : "border-[#dfe6db] bg-white"
                  }`}
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
            <label className="mb-2 block text-sm font-semibold text-[#4d6247]">
              Notes
            </label>

            <textarea
              rows={6}
              className={inputStyle}
              placeholder="Notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </section>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href={`/leads/${id}`}
              className="rounded-xl border border-[#d7e1d0] px-6 py-3 text-center text-sm font-semibold text-[#4d6247]"
            >
              Cancel
            </Link>

            <button
              type="button"
              onClick={saveLead}
              disabled={saving}
              className="rounded-xl bg-[#647d5b] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
