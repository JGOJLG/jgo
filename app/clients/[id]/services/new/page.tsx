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

const serviceOptions = [
  "Resume",
  "Cover Letter",
  "Resume + Cover Letter",
  "Career Coaching",
  "Other",
];

const defaultPrices: Record<string, string> = {
  "Resume": "250",
  "Cover Letter": "250",
  "Resume + Cover Letter": "400",
  "Career Coaching": "250",
};

function getToday() {
  return new Date().toISOString().split("T")[0];
}

export default function AddServicePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const clientId = Number(params.id);

  const [clientName, setClientName] = useState("Client");
  const [loadingClient, setLoadingClient] = useState(true);

  const [serviceSelection, setServiceSelection] = useState("");
  const [customService, setCustomService] = useState("");

  const [price, setPrice] = useState("");

  const [dateAdded, setDateAdded] = useState(getToday());

  const [scheduledDate, setScheduledDate] = useState("");
  const [serviceNotes, setServiceNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const finalService =
    serviceSelection === "Other"
      ? customService.trim()
      : serviceSelection;


  useEffect(() => {
    async function loadClient() {
      if (!Number.isInteger(clientId)) {
        setErrorMessage("Invalid client ID.");
        setLoadingClient(false);
        return;
      }

      const { data, error } = await supabase
        .from("clients")
        .select("name")
        .eq("id", clientId)
        .single();


      if (error || !data) {
        setErrorMessage("The client could not be loaded.");
        setLoadingClient(false);
        return;
      }


      setClientName(data.name || "Client");
      setLoadingClient(false);
    }


    loadClient();

  }, [clientId]);



  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();


    if (!serviceSelection) {
      setErrorMessage("Please select a service.");
      return;
    }


    if (
      serviceSelection === "Other" &&
      !customService.trim()
    ) {
      setErrorMessage("Please enter the custom service.");
      return;
    }


    if (!price) {
      setErrorMessage("Please enter a price.");
      return;
    }


    setSaving(true);
    setErrorMessage("");



    const { data: service, error } =
      await supabase
        .from("client_services")
        .insert({
          client_id: clientId,
          service: finalService,
          price: Number(price),
          status: "Selected",
          payment_status: "Open",
          date_added: dateAdded || null,
          scheduled_date: scheduledDate || null,
          notes: serviceNotes.trim() || null,
        })
        .select()
        .single();



    if (error || !service) {
      setErrorMessage(
        error?.message ||
          "Unable to create service."
      );

      setSaving(false);
      return;
    }



    if (scheduledDate) {
      await supabase.from("calendar_events").insert({
        client_id: clientId,
        event_type: finalService
          .toLowerCase()
          .includes("coaching")
          ? "Coaching Session"
          : `${finalService} Scheduled`,
        title: finalService
          .toLowerCase()
          .includes("coaching")
          ? "Coaching Session"
          : `${finalService} Scheduled`,
        start_at: `${scheduledDate}T09:00:00`,
        end_at: `${scheduledDate}T10:00:00`,
      });
    }

    const leadStatuses = ["lead", "free 15 scheduled", "free 15 completed"];

    const { data: currentClient } = await supabase
      .from("clients")
      .select("status")
      .eq("id", clientId)
      .single();

    if (
      currentClient &&
      leadStatuses.includes(
        (currentClient.status || "lead").trim().toLowerCase()
      )
    ) {
      await supabase
        .from("clients")
        .update({ status: "Active" })
        .eq("id", clientId);
    }



    await supabase
      .from("client_timeline")
      .upsert({
        client_id: clientId,
        event_type: "services_selected",
        title: "Services Selected",
        status: "Complete",
        completed_at: new Date().toISOString(),
      });



    router.push(`/clients/${clientId}`);
    router.refresh();
  }



  if (loadingClient) {
    return (
      <main className="min-h-screen bg-[#f7f8f3] p-6 text-[#243128] lg:p-10">
        <div className="mx-auto max-w-5xl rounded-3xl border border-[#dfe6db] bg-white p-10 shadow-sm">
          Loading client...
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
            className="text-sm font-semibold text-[#7f9975]"
          >
            ← Back to {clientName}
          </Link>


          <h1 className="mt-4 text-3xl font-bold">
            Add New Service
          </h1>


          <p className="mt-2 text-sm text-[#708075]">
            Add a service and begin the client workflow.
          </p>

        </div>

      </header>




      <div className="mx-auto max-w-5xl p-6 lg:p-10">


        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-[#dfe6db] bg-white shadow-sm"
        >


          <section className="border-b border-[#e4e9df] p-6 lg:p-8">

            <h2 className="text-xl font-bold">
              Service and Price
            </h2>



            <div className="mt-6 grid gap-5 md:grid-cols-2">


              <FormField label="Service">

                <select
                  value={serviceSelection}
                  onChange={(event) => {
                    const value = event.target.value;
                    setServiceSelection(value);
                    setPrice(defaultPrices[value] ?? "");
                  }}
                  className={inputStyle}
                >

                  <option value="">
                    Select service
                  </option>


                  {serviceOptions.map((service) => (
                    <option key={service}>
                      {service}
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
                    value={price}
                    onChange={(event) =>
                      setPrice(event.target.value)
                    }
                    className={`${inputStyle} pl-8`}
                    placeholder="0"
                  />

                </div>

              </FormField>




              {serviceSelection === "Other" && (

                <div className="md:col-span-2">

                  <FormField label="Custom Service">

                    <input
                      value={customService}
                      onChange={(event) =>
                        setCustomService(
                          event.target.value
                        )
                      }
                      className={inputStyle}
                      placeholder="Enter service name"
                    />

                  </FormField>

                </div>

              )}


            </div>

          </section>





          <section className="border-b border-[#e4e9df] p-6 lg:p-8">

            <h2 className="text-xl font-bold">
              Service Details
            </h2>


            <div className="mt-6 grid gap-5 md:grid-cols-2">


              <FormField label="Date Added">

                <input
                  type="date"
                  value={dateAdded}
                  onChange={(event) =>
                    setDateAdded(event.target.value)
                  }
                  className={inputStyle}
                />

              </FormField>




              <FormField label="Scheduled Date (Optional)">

                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(event) =>
                    setScheduledDate(
                      event.target.value
                    )
                  }
                  className={inputStyle}
                />

              </FormField>




              <div className="md:col-span-2">

                <FormField label="Service Notes">

                  <textarea
                    rows={6}
                    value={serviceNotes}
                    onChange={(event) =>
                      setServiceNotes(
                        event.target.value
                      )
                    }
                    placeholder="Add service notes..."
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
                href={`/clients/${clientId}`}
                className="rounded-xl border border-[#d7e1d0] px-5 py-3 text-center text-sm font-semibold text-[#4d6247]"
              >
                Cancel
              </Link>



              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#647d5b] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Service"}
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


      <div className="mt-2">
        {children}
      </div>

    </label>

  );
}
