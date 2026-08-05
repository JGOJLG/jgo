"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const services = [
  "Resume",
  "Cover Letter",
  "Resume + Cover Letter",
  "Career Coaching",
];

const sources = [
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

const sourceDetails: Record<string, string[]> = {
  LinkedIn: [
    "LinkedIn Connection",
    "LinkedIn Message",
    "LinkedIn Post",
    "LinkedIn Recruiter",
  ],
  Referral: [
    "Past Client",
    "Friend / Family",
    "Professional Network",
  ],
};

const inputStyle =
  "w-full rounded-xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3 text-sm text-[#243128] outline-none placeholder:text-[#9aa59c] focus:border-[#9fb294]";

function getToday() {
  return new Date().toISOString().split("T")[0];
}


export default function NewLeadPage() {

  const router = useRouter();


  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");

  const [source, setSource] = useState("");
  const [sourceDetail, setSourceDetail] = useState("");

  const [dateReachedOut, setDateReachedOut] =
    useState(getToday());

  const [selectedServices, setSelectedServices] =
    useState<string[]>([]);

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



  function handleSourceChange(value: string) {

    setSource(value);

    if (!sourceDetails[value]) {
      setSourceDetail("");
    }

  }



  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {

    event.preventDefault();


    if (!name.trim()) {
      setError("Please enter a name.");
      return;
    }


    setSaving(true);
    setError("");



    const today = getToday();



    const { data: client, error: clientError } =
      await supabase
        .from("clients")
        .insert({

          name: name.trim(),

          email:
            email.trim() || null,

          phone:
            phone.trim() || null,


          address_line1:
            address.trim() || null,

          city:
            city.trim() || null,

          state:
            state.trim() || null,

          postal_code:
            zip.trim() || null,


          lead_source:
            source || null,

          lead_source_detail:
            sourceDetail || null,


          date_added:
            today,

          date_reached_out:
            dateReachedOut || today,


          client_type:
            "Lead",

          is_repeat_client:
            false,


          project_notes:
            notes.trim() || null,

        })
        .select()
        .single();



    if (clientError || !client) {

      setError(
        clientError?.message ||
        "Unable to create lead."
      );

      setSaving(false);

      return;
    }
        for (const service of selectedServices) {

      const { data: catalog } =
        await supabase
          .from("service_catalog")
          .select("default_price")
          .eq("name", service)
          .maybeSingle();



      await supabase
        .from("client_services")
        .insert({

          client_id:
            client.id,

          service,

          price:
            catalog?.default_price ?? 0,

          status:
            "Selected",

          payment_status:
            "Open",

          date_added:
            today,

        });

    }




    await supabase
      .from("client_timeline")
      .insert({

        client_id:
          client.id,

        event_type:
          "lead_created",

        title:
          "Lead Created",

        status:
          "Complete",

        completed_at:
          new Date().toISOString(),

      });





    if (selectedServices.length > 0) {

      await supabase
        .from("client_timeline")
        .insert({

          client_id:
            client.id,

          event_type:
            "services_selected",

          title:
            "Services Selected",

          status:
            "Complete",

          completed_at:
            new Date().toISOString(),

        });

    }



    router.push(`/clients/${client.id}`);

    router.refresh();

  }





  return (

    <main className="min-h-screen bg-[#f7f8f3] text-[#243128]">


      <header className="border-b border-[#dfe6db] bg-[#fbfaf6] px-6 py-7">

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
            Create a lead and start the JGO Hire client journey.
          </p>


        </div>

      </header>





      <div className="mx-auto max-w-4xl p-6 lg:p-10">


        <form
          onSubmit={handleSubmit}
          className="space-y-7 rounded-3xl border border-[#dfe6db] bg-white p-8 shadow-sm"
        >



          <section>

            <h2 className="text-xl font-bold">
              Contact Information
            </h2>


            <div className="mt-5 grid gap-4 md:grid-cols-2">


              {[
                ["Full Name", name, setName],
                ["Email", email, setEmail],
                ["Phone", phone, setPhone],
                ["Address", address, setAddress],
                ["City", city, setCity],
                ["State", state, setState],
                ["Zip Code", zip, setZip],
              ].map(([placeholder, value, setter]) => (

                <input
                  key={placeholder as string}
                  placeholder={placeholder as string}
                  value={value as string}
                  onChange={(event) =>
                    (setter as Function)(
                      event.target.value
                    )
                  }
                  className={inputStyle}
                  required={
                    placeholder === "Full Name"
                  }
                />

              ))}


            </div>

          </section>





          <section>

            <h2 className="text-xl font-bold">
              Lead Source
            </h2>


            <select
              value={source}
              onChange={(event) =>
                handleSourceChange(
                  event.target.value
                )
              }
              className={`${inputStyle} mt-4`}
            >

              <option value="">
                Select Source
              </option>


              {sources.map((item) => (

                <option key={item}>
                  {item}
                </option>

              ))}


            </select>




            {sourceDetails[source] && (

              <select
                value={sourceDetail}
                onChange={(event) =>
                  setSourceDetail(
                    event.target.value
                  )
                }
                className={`${inputStyle} mt-3`}
              >

                <option value="">
                  Select Details
                </option>


                {sourceDetails[source].map(
                  (item) => (

                    <option key={item}>
                      {item}
                    </option>

                  )
                )}


              </select>

            )}


          </section>





          <section>

            <h2 className="text-xl font-bold">
              Date Reached Out
            </h2>


            <input
              type="date"
              value={dateReachedOut}
              onChange={(event) =>
                setDateReachedOut(
                  event.target.value
                )
              }
              className={`${inputStyle} mt-4`}
            />


          </section>





          <section>

            <h2 className="text-xl font-bold">
              Services Interested In
            </h2>


            <div className="mt-4 grid gap-3 md:grid-cols-2">


              {services.map((service) => (

                <button

                  type="button"

                  key={service}

                  onClick={() =>
                    toggleService(service)
                  }

                  className={`rounded-2xl border p-5 text-left font-semibold transition ${
                    selectedServices.includes(service)
                      ? "border-[#647d5b] bg-[#eef2e9] text-[#4d6247]"
                      : "border-[#dfe6db] bg-white"
                  }`}

                >

                  {selectedServices.includes(service)
                    ? "✓ "
                    : ""}

                  {service}


                </button>

              ))}


            </div>


          </section>





          <section>

            <h2 className="text-xl font-bold">
              Notes
            </h2>


            <textarea

              rows={5}

              value={notes}

              onChange={(event) =>
                setNotes(
                  event.target.value
                )
              }

              className={`${inputStyle} mt-4`}

              placeholder="Add notes..."

            />


          </section>





          {error && (

            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">

              {error}

            </div>

          )}





          <button

            disabled={saving}

            className="rounded-xl bg-[#647d5b] px-6 py-3 font-semibold text-white disabled:opacity-50"

          >

            {saving
              ? "Creating..."
              : "Create Lead"}

          </button>



        </form>


      </div>


    </main>

  );

}