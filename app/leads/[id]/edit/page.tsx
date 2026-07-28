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
  "Free 15 Completed",
  "Follow Up Needed",
  "Proposal Sent",
  "Converted",
  "Not Moving Forward",
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

    setStatus(data.status || "New Lead");

    setNotes(data.notes || "");

    if (data.services_discussed) {
      setSelectedServices(
        data.services_discussed
          .split(",")
          .map((item: string) => item.trim())
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

        call_type: callType || null,
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
        <div className="space-y-6 rounded-3xl border border-[#dfe6db] bg-white p-8 shadow-sm">

          <section>
            <h2 className="text-xl font-bold">
              Contact Information
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input
                className={inputStyle}
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <input
                className={inputStyle}
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <input
                className={inputStyle}
                placeholder="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <input
                className={inputStyle}
                placeholder="Source"
                value={callType}
                onChange={(e) => setCallType(e.target.value)}
              />
            </div>
          </section>


          <section>
            <h2 className="text-xl font-bold">
              Free 15 Consultation
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">

              <input
                type="date"
                className={inputStyle}
                value={callDate}
                onChange={(e)=>setCallDate(e.target.value)}
              />

              <select
                className={inputStyle}
                value={status}
                onChange={(e)=>setStatus(e.target.value)}
              >
                {statuses.map((item)=>(
                  <option key={item}>
                    {item}
                  </option>
                ))}
              </select>

            </div>
          </section>


          <section>
            <h2 className="text-xl font-bold">
              Interested In
            </h2>

            <div className="mt-4 grid gap-3 md:grid-cols-2">

              {services.map((service)=>(
                <label
                  key={service}
                  className="rounded-xl border border-[#dfe6db] p-4"
                >
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(service)}
                    onChange={()=>toggleService(service)}
                    className="mr-2"
                  />

                  {service}

                </label>
              ))}

            </div>
          </section>


          <section>
            <textarea
              rows={6}
              className={inputStyle}
              placeholder="Notes"
              value={notes}
              onChange={(e)=>setNotes(e.target.value)}
            />
          </section>


          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}


          <button
            onClick={saveLead}
            disabled={saving}
            className="rounded-xl bg-[#647d5b] px-6 py-3 font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

        </div>
      </div>
    </main>
  );
}