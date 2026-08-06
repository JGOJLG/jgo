import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase-server";
import ClientJourney from "@/components/ClientJourney";
import CalendarScheduler from "@/components/CalendarScheduler";
import ClientHistory from "@/components/ClientHistory";
import ClientFileManager from "./ClientFileManager";
import ClientActions from "./ClientActions";
import ServiceCard from "./ServiceCard";
import SendInvoiceButton from "@/components/SendInvoiceButton";

import { addClientNote, deleteClientNote, convertToActiveClient, revertToLead } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ClientPage({ params }: Props) {
  const { id } = await params;
  const clientId = Number(id);

  if (!Number.isInteger(clientId)) {
    notFound();
  }

  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .maybeSingle();

  if (!client) {
    notFound();
  }

  const { data: services } = await supabase
    .from("client_services")
    .select("*")
    .eq("client_id", clientId)
    .order("date_added", { ascending: false });

  const { data: timeline } = await supabase
    .from("client_timeline")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: true });

  const { data: notes } = await supabase
    .from("client_notes")
    .select("*")
    .eq("client_id", clientId)
    .order("note_date", { ascending: false });

  const { data: calendarEventsRaw } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("client_id", clientId)
    .order("start_at", { ascending: true });

  const calendarEvents = (calendarEventsRaw ?? []).map((e) => ({
    id: e.id,
    client_id: e.client_id,
    event_type: e.event_type,
    event_date: e.start_at ? String(e.start_at).slice(0, 10) : "",
    notes: e.notes ?? null,
  }));

  const totalOwed = (services ?? []).reduce(
    (sum, s) => sum + Number(s.price ?? 0),
    0
  );

  const totalPaid = (services ?? [])
    .filter((s) => s.payment_status === "Paid")
    .reduce((sum, s) => sum + Number(s.price ?? 0), 0);

  const balanceDue = totalOwed - totalPaid;

  const timelineHistory = (timeline ?? [])
    .filter((t) => t.completed_at)
    .map((t) => ({
      date: String(t.completed_at).slice(0, 10),
      label: t.title,
    }));

  const calendarHistory = (calendarEvents ?? []).map((e) => ({
    date: e.event_date,
    label: e.notes ? `${e.event_type} — ${e.notes}` : e.event_type,
  }));

  const combinedHistory = [...timelineHistory, ...calendarHistory].sort(
    (a, b) => a.date.localeCompare(b.date)
  );

  const isLead = ["lead", "free 15 scheduled", "free 15 completed"].includes(
    (client.status || "lead").trim().toLowerCase()
  );

  return (
    <section className="min-w-0 flex-1">
      <header className="border-b border-[#dfe6db] bg-[#fbfaf6] px-6 py-8 lg:px-10">
        <Link
          href="/clients"
          className="text-sm font-semibold text-[#7f9975]"
        >
          Back to Clients
        </Link>

        <div className="mt-6 flex justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-bold text-[#243128]">
                {client.name}
              </h1>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  isLead
                    ? "bg-[#eee8d9] text-[#8f7d37]"
                    : "bg-[#e8eee3] text-[#4d6247]"
                }`}
              >
                {isLead ? "Lead" : "Client"}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[#708075]">
              <span>{client.email}</span>

              {client.phone ? <span>{client.phone}</span> : null}

              {client.city || client.state ? (
                <span>
                  {[client.city, client.state].filter(Boolean).join(", ")}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <form action={isLead ? convertToActiveClient : revertToLead}>
              <input type="hidden" name="clientId" value={clientId} />
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full border border-[#cbd8c4] bg-white px-5 py-2 text-sm font-semibold text-[#4d6247] shadow-sm transition hover:bg-[#f5f7f2]"
              >
                {isLead ? "Mark as Client" : "Mark as Lead"}
              </button>
            </form>

            <SendInvoiceButton
              clientId={clientId}
              clientName={client.name}
              clientEmail={client.email ?? null}
            />

            <Link
              href={`/clients/${clientId}/services/new`}
              className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-[#647d5b]/90 px-7 py-3.5 text-base font-bold text-white shadow-lg backdrop-blur-sm transition hover:bg-[#56683f] hover:shadow-xl"
            >
              + Add Service
            </Link>
          </div>
        </div>
      </header>

      <div className="space-y-7 p-6 lg:p-10">
        <ClientJourney
          clientId={clientId}
          timeline={timeline ?? []}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          {/* LEFT: Services — big, primary */}
          <section className="rounded-2xl border border-[#dfe6db] bg-white p-6">
            <h2 className="text-2xl font-bold text-[#243128]">Services</h2>

            <div className="mt-4 space-y-3">
              {(services ?? []).map((service) => (
                <ServiceCard
                  key={service.id}
                  clientId={clientId}
                  service={service}
                />
              ))}

              {(services ?? []).length === 0 ? (
                <p className="text-sm text-[#708075]">
                  No services added yet.
                </p>
              ) : null}
            </div>
          </section>

          {/* MIDDLE/RIGHT: Payment Summary */}
          <section className="rounded-2xl border border-[#dfe6db] bg-white p-6">
            <h2 className="text-lg font-bold text-[#243128]">
              Payment Summary
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#708075]">
                  Total Owed
                </p>
                <p className="mt-1 text-2xl font-bold text-[#243128]">
                  ${totalOwed.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#708075]">
                  Total Paid
                </p>
                <p className="mt-1 text-2xl font-bold text-[#647d5b]">
                  ${totalPaid.toLocaleString()}
                </p>
              </div>

              <div className="border-t border-[#dfe6db] pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#708075]">
                  Balance Due
                </p>
                <p
                  className={`mt-1 text-2xl font-bold ${
                    balanceDue > 0 ? "text-[#9a554d]" : "text-[#647d5b]"
                  }`}
                >
                  ${balanceDue.toLocaleString()}
                </p>
              </div>
            </div>
          </section>

          {/*
            RIGHT COLUMN REPLACEMENT — TBD
            Options: Notes / To-Do / Recent Activity / Quick Links
            Add a third <section> here once decided.
          */}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* LEFT: Notes */}
          <section className="rounded-2xl border border-[#dfe6db] bg-white p-6">
            <h2 className="text-xl font-bold text-[#243128]">Notes</h2>

            <form
              action={addClientNote}
              className="mt-4 flex flex-col gap-3"
            >
              <input type="hidden" name="clientId" value={clientId} />

              <input
                type="date"
                name="noteDate"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="rounded-xl border border-[#dfe6db] px-3 py-2 text-sm text-[#243128] outline-none focus:border-[#7f9975]"
              />

              <textarea
                name="content"
                rows={2}
                placeholder="Add a note..."
                required
                className="min-w-0 flex-1 rounded-xl border border-[#dfe6db] px-3 py-2 text-sm text-[#243128] outline-none focus:border-[#7f9975]"
              />

              <button
                type="submit"
                className="self-start rounded-xl bg-[#647d5b] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#56683f]"
              >
                Add Note
              </button>
            </form>

            <div className="mt-5 space-y-3">
              {(notes ?? []).map((note) => (
                <div
                  key={note.id}
                  className="flex items-start justify-between gap-4 rounded-xl border border-[#dfe6db] px-4 py-3"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#708075]">
                      {new Date(
                        `${note.note_date}T12:00:00`
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p className="mt-1 text-sm text-[#243128]">
                      {note.content}
                    </p>
                  </div>

                  <form action={deleteClientNote}>
                    <input type="hidden" name="clientId" value={clientId} />
                    <input type="hidden" name="noteId" value={note.id} />
                    <button className="text-xs font-semibold text-[#9a554d] hover:underline">
                      Delete
                    </button>
                  </form>
                </div>
              ))}

              {(notes ?? []).length === 0 ? (
                <p className="text-sm text-[#708075]">No notes yet.</p>
              ) : null}
            </div>
          </section>

          {/* RIGHT: History + Scheduler, stacked */}
          <div className="space-y-6">
            <ClientHistory items={combinedHistory} />

            <CalendarScheduler
              clientId={clientId}
              events={calendarEvents ?? []}
            />
          </div>
        </div>

        {/* Client Info — full width, sits above Client Documents */}
        <section className="rounded-2xl border border-[#dfe6db] bg-white p-6">
          <h2 className="text-lg font-bold text-[#243128]">
            Client Info
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#708075]">
                Email
              </p>
              <p className="mt-1 text-[#243128]">{client.email}</p>
            </div>

            {client.phone ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#708075]">
                  Phone
                </p>
                <p className="mt-1 text-[#243128]">{client.phone}</p>
              </div>
            ) : null}

            {client.address ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#708075]">
                  Address
                </p>
                <p className="mt-1 text-[#243128]">{client.address}</p>
              </div>
            ) : null}

            {client.created_at ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#708075]">
                  Client Since
                </p>
                <p className="mt-1 text-[#243128]">
                  {new Date(client.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <ClientFileManager clientId={clientId} />

        <section className="rounded-2xl border border-[#dfe6db] bg-white p-6">
          <h2 className="text-xl font-bold text-[#243128]">
            Client Actions
          </h2>

          <div className="mt-4 flex gap-3">
            <ClientActions
              clientId={clientId}
              clientName={client.name}
              isArchived={client.status === "Archived"}
            />
          </div>
        </section>
      </div>
    </section>
  );
}
