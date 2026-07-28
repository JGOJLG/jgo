"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Lead = {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  call_type: string | null;
  call_date: string | null;
  status: string | null;
  services_discussed: string | null;
  notes: string | null;
  created_at: string | null;
  converted_to_client?: boolean;
  converted_client_id?: number | null;
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState("");

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

    setLead(data);
    setLoading(false);
  }

  useEffect(() => {
    loadLead();
  }, []);


  function formatDate(date: string | null) {
    if (!date) return "Not scheduled";

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(
      new Date(
        date.includes("T")
          ? date
          : `${date}T12:00:00`
      )
    );
  }


  async function convertToClient() {
    if (!lead) return;

    if (lead.converted_to_client) {
      return;
    }

    setConverting(true);
    setError("");


    const { data: client, error: clientError } =
      await supabase
        .from("clients")
        .insert({
          name: lead.name,
          email: lead.email,
          phone: lead.phone,

          service: lead.services_discussed,

          status: "New",

          payment_status: "Unpaid",

          project_notes: lead.notes,

          intake_date: lead.call_date,

          lead_source: lead.call_type,
        })
        .select()
        .single();


    if (clientError) {
      setError(clientError.message);
      setConverting(false);
      return;
    }


    const { error: updateError } =
      await supabase
        .from("intake_calls")
        .update({
          status: "Converted",
          converted_to_client: true,
          converted_client_id: client.id,
        })
        .eq("id", lead.id);


    if (updateError) {
      setError(updateError.message);
      setConverting(false);
      return;
    }


    router.push(`/clients/${client.id}`);
    router.refresh();
  }



  if (loading) {
    return (
      <div className="p-10 text-sm text-[#708075]">
        Loading lead...
      </div>
    );
  }


  if (!lead) {
    return (
      <div className="p-10">
        Lead not found.
      </div>
    );
  }


  return (
    <main className="min-h-screen bg-[#f7f8f3] p-6 text-[#243128] lg:p-10">

      <Link
        href="/leads"
        className="text-sm font-semibold text-[#647d5b]"
      >
        ← Back to Leads
      </Link>


      <header className="mt-6 rounded-3xl border border-[#dfe6db] bg-white p-8 shadow-sm">

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="text-3xl font-bold">
              {lead.name || "Unnamed Lead"}
            </h1>

            <p className="mt-2 text-sm text-[#708075]">
              {lead.email || "No email"}
              {lead.phone && ` • ${lead.phone}`}
            </p>
          </div>


          <div className="rounded-full bg-[#edf2e9] px-4 py-2 text-sm font-semibold text-[#647d5b]">
            {lead.status || "New Lead"}
          </div>

        </div>

      </header>



      <div className="mt-6 grid gap-6 lg:grid-cols-3">


        <div className="space-y-6 lg:col-span-2">


          <section className="rounded-3xl border border-[#dfe6db] bg-white p-8 shadow-sm">

            <h2 className="text-xl font-bold">
              Lead Details
            </h2>


            <div className="mt-6 grid gap-5 md:grid-cols-2">

              <div>
                <p className="text-xs text-[#708075]">
                  Source
                </p>

                <p className="mt-1">
                  {lead.call_type || "Not provided"}
                </p>
              </div>


              <div>
                <p className="text-xs text-[#708075]">
                  Free 15
                </p>

                <p className="mt-1">
                  {formatDate(lead.call_date)}
                </p>
              </div>


              <div>
                <p className="text-xs text-[#708075]">
                  Interested In
                </p>

                <p className="mt-1">
                  {lead.services_discussed || "Not provided"}
                </p>
              </div>

            </div>

          </section>



          <section className="rounded-3xl border border-[#dfe6db] bg-white p-8 shadow-sm">

            <h2 className="text-xl font-bold">
              Notes
            </h2>

            <p className="mt-4 whitespace-pre-line text-sm text-[#647066]">
              {lead.notes || "No notes yet."}
            </p>

          </section>



        </div>



        <aside className="space-y-4">


          <button
            onClick={() =>
              router.push(`/leads/${lead.id}/edit`)
            }
            className="w-full rounded-2xl border border-[#dfe6db] bg-white px-5 py-4 font-semibold hover:bg-[#f7f8f3]"
          >
            Edit Lead
          </button>



          <button
            onClick={convertToClient}
            disabled={converting || lead.converted_to_client}
            className="w-full rounded-2xl bg-[#647d5b] px-5 py-4 font-semibold text-white disabled:opacity-50"
          >
            {converting
              ? "Converting..."
              : lead.converted_to_client
              ? "Already Converted"
              : "Convert to Client"}
          </button>



          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}



          <button
            className="w-full rounded-2xl border border-red-200 bg-white px-5 py-4 font-semibold text-red-500"
          >
            Archive Lead
          </button>


        </aside>


      </div>


    </main>
  );
}