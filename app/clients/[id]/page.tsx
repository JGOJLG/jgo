import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import ClientFileManager from "./ClientFileManager";
import InterviewCompleteButton from "@/components/InterviewCompleteButton";
import {
  archiveClient,
  restoreClient,
  deleteClientPermanently,
  markServicePaid,
} from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Client = {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  status: string | null;
  payment_status: string | null;
  next_step: string | null;
  project_notes: string | null;
  intake_date: string | null;
  due_date: string | null;
};

type ClientService = {
  id: number;
  client_id: number;
  service: string | null;
  price: number | null;
  status: string | null;
  payment_status: string | null;
  date_added: string | null;
  scheduled_date: string | null;
  due_date: string | null;
  completed_date: string | null;
  next_step: string | null;
  notes: string | null;
};

type Payment = {
  id: number;
  client_id: number | null;
  client_service_id: number | null;
  amount: number | null;
  payment_date: string | null;
  payment_method: string | null;
  payment_status: string | null;
  notes: string | null;
};



type CalendarEvent = {
  id: number;
  title: string | null;
  event_type: string | null;
  start_at: string | null;
  end_at: string | null;
  status: string | null;
  client_id: number | null;
  notes: string | null;
};

type Lead = {
  id: number;
  name: string | null;
  status: string | null;
  call_date: string | null;
  call_type: string | null;
  notes: string | null;
  converted_client_id: number | null;
};


type Props = {
  params: Promise<{
    id: string;
  }>;
};


function getInitials(name: string | null) {
  return (name || "Client")
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(date: string | null) {
  if (!date) {
    return "Not scheduled";
  }

  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusStyle(status: string | null) {
  if (status === "Completed" || status === "Complete") {
    return "bg-[#e7f1e6] text-[#55704f]";
  }

  if (status === "In Progress") {
    return "bg-[#e8eee3] text-[#4d6247]";
  }

  if (status === "Scheduled") {
    return "bg-[#e8edf3] text-[#52697b]";
  }

  if (status === "Revision") {
    return "bg-[#eee8f3] text-[#6d5878]";
  }

  if (status === "Waiting on Client") {
    return "bg-[#f6ecd9] text-[#8f6d37]";
  }

  if (status === "On Hold") {
    return "bg-[#f6e6df] text-[#935f4c]";
  }

  return "bg-[#eef2e9] text-[#647066]";
}

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function isInterviewCompleted(interview: CalendarEvent) {
  return ["completed", "complete", "cancelled", "canceled"].includes(
    normalize(interview.status)
  );
}

function isInterviewPast(interview: CalendarEvent) {
  if (!interview.start_at) {
    return false;
  }

  const interviewTime = new Date(interview.start_at).getTime();

  if (Number.isNaN(interviewTime)) {
    return false;
  }

  return interviewTime < Date.now();
}

function formatInterviewDate(value: string | null) {
  if (!value) {
    return "Date and time not added";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  }).format(date);
}

function getPaymentStyle(paymentStatus: string | null) {
  if (paymentStatus === "Paid") {
    return "bg-[#e7f1e6] text-[#55704f]";
  }

  if (paymentStatus === "Invoice Sent") {
    return "bg-[#e8edf3] text-[#52697b]";
  }

  if (paymentStatus === "Pending") {
    return "bg-[#f6ecd9] text-[#8f6d37]";
  }

  return "bg-[#eef2e9] text-[#647066]";
}

export default async function ClientPage({ params }: Props) {
  const supabase = await createClient();

  const { id } = await params;
  const clientId = Number(id);

  if (!Number.isInteger(clientId)) {
    notFound();
  }

  const { data: clientData, error: clientError } = await supabase
    .from("clients")
    .select(
      "id, name, email, phone, address_line1, address_line2, city, state, postal_code, status, payment_status, next_step, project_notes, intake_date, due_date"
    )
    .eq("id", clientId)
    .maybeSingle();

  if (clientError) {
    console.error("Unable to load client:", clientError);
    throw new Error(`Unable to load client: ${clientError.message}`);
  }

  if (!clientData) {
    notFound();
  }

  const { data: serviceData, error: serviceError } = await supabase
    .from("client_services")
    .select("*")
    .eq("client_id", clientId)
    .order("date_added", { ascending: false })
    .order("id", { ascending: false });

  if (serviceError) {
    console.error("Unable to load client services:", serviceError);
  }

  const { data: paymentData, error: paymentError } =
    await supabase
      .from("payments")
      .select("*")
      .eq("client_id", clientId)
      .order("payment_date", { ascending: false });

  if (paymentError) {
    console.error("Unable to load payments:", paymentError);
  }

  const { data: interviewData, error: interviewError } = await supabase
    .from("calendar_events")
    .select(
      "id, title, event_type, start_at, end_at, status, client_id, notes"
    )
    .eq("client_id", clientId)
    .eq("event_type", "interview")
    .order("start_at", { ascending: true });

  if (interviewError) {
    console.error("Unable to load interviews:", interviewError);
  }

  const { data: leadData, error: leadError } = await supabase
    .from("intake_calls")
    .select("*")
    .eq("converted_client_id", clientId)
    .maybeSingle();

  if (leadError) {
    console.error("Unable to load original lead:", leadError);
  }

  const originalLead = leadData as Lead | null;

  const client = clientData as Client;
  const services = (serviceData ?? []) as ClientService[];
  const payments = (paymentData ?? []) as Payment[];
  const interviews = (interviewData ?? []) as CalendarEvent[];

  const upcomingInterviews = interviews
    .filter(
      (interview) =>
        !isInterviewCompleted(interview) &&
        !isInterviewPast(interview)
    )
    .sort((a, b) => {
      if (!a.start_at && !b.start_at) return b.id - a.id;
      if (!a.start_at) return 1;
      if (!b.start_at) return -1;
      return a.start_at.localeCompare(b.start_at);
    });

  const completedInterviews = interviews
    .filter(
      (interview) =>
        isInterviewCompleted(interview) ||
        isInterviewPast(interview)
    )
    .sort((a, b) => {
      if (!a.start_at && !b.start_at) return b.id - a.id;
      if (!a.start_at) return 1;
      if (!b.start_at) return -1;
      return b.start_at.localeCompare(a.start_at);
    });

  const activeServices = services.filter(
    (service) =>
      service.status !== "Completed" && service.status !== "Complete"
  );

  const paidRevenue = services
    .filter((service) => service.payment_status === "Paid")
    .reduce(
      (total, service) => total + Number(service.price ?? 0),
      0
    );

  const moneyOwed = services
    .filter((service) => service.payment_status !== "Paid")
    .reduce(
      (total, service) => total + Number(service.price ?? 0),
      0
    );

  const totalPurchased = services.reduce(
    (total, service) => total + Number(service.price ?? 0),
    0
  );

  const totalPaymentsReceived = payments
    .filter((payment) => payment.payment_status === "Paid")
    .reduce(
      (total, payment) => total + Number(payment.amount ?? 0),
      0
    );

  const isArchived = normalize(client.status) === "archived";

  const allServicesComplete =
    services.length > 0 &&
    services.every(
      (service) =>
        service.status === "Completed" || service.status === "Complete"
    );

  const overallServiceStatus =
    services.length === 0
      ? "No Services Yet"
      : allServicesComplete
        ? "Services Complete"
        : "Services In Progress";

  const serviceNames = services
    .map((service) => service.service)
    .filter((service): service is string => Boolean(service))
    .join(" • ");

  const cityState = [client.city, client.state]
    .filter(Boolean)
    .join(", ");

  const mailingAddress = [
    client.address_line1,
    client.address_line2,
    cityState
      ? `${cityState}${client.postal_code ? ` ${client.postal_code}` : ""}`
      : client.postal_code,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <section className="min-w-0 flex-1">
          <header className="border-b border-[#dfe6db] bg-[#fbfaf6] px-6 py-8 lg:px-10">
            <Link
              href="/clients"
              className="text-sm font-semibold text-[#7f9975] hover:text-[#4d6247]"
            >
              ← Back to Clients
            </Link>

            <div className="mt-6 flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-start gap-5">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#dfe6db] text-2xl font-bold text-[#4d6247]">
                  {getInitials(client.name)}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-4xl font-bold tracking-tight text-[#243128] lg:text-5xl">
                      {client.name || "Unnamed Client"}
                    </h1>

                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        allServicesComplete
                          ? "bg-[#e7f1e6] text-[#55704f]"
                          : services.length === 0
                            ? "bg-[#eef2e9] text-[#647066]"
                            : "bg-[#f6ecd9] text-[#8f6d37]"
                      }`}
                    >
                      {overallServiceStatus}
                    </span>
                  </div>

                  <p className="mt-3 text-base font-semibold text-[#4d6247]">
                    {serviceNames || "No services have been added"}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#708075]">
                    {client.email ? (
                      <span>{client.email}</span>
                    ) : null}

                    {client.phone ? (
                      <span>{client.phone}</span>
                    ) : null}

                    {cityState ? (
                      <span>{cityState}</span>
                    ) : null}

                    {!client.email && !client.phone && !cityState ? (
                      <span>No contact information added</span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-3">
                {originalLead && (
                  <Link
                    href={`/leads/${originalLead.id}`}
                    className="rounded-xl border border-[#d7e1d0] bg-white px-5 py-3 text-sm font-semibold text-[#4d6247] hover:bg-[#f5f7f2]"
                  >
                    ← View Original Lead
                  </Link>
                )}

                <Link
                  href={`/clients/${client.id}/edit`}
                  className="rounded-xl border border-[#d7e1d0] bg-white px-5 py-3 text-sm font-semibold text-[#4d6247] hover:bg-[#f5f7f2]"
                >
                  Edit Client
                </Link>

                <Link
                  href={`/clients/${client.id}/services/new`}
                  className="rounded-xl bg-[#647d5b] px-5 py-3 text-sm font-semibold text-white hover:bg-[#4d6247]"
                >
                  + Add New Service
                </Link>
              </div>
            </div>
          </header>

          <div className="space-y-7 p-6 lg:p-10">
            <section className="overflow-hidden rounded-2xl border border-[#dfe6db] bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-[#e4e9df] p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#243128]">
                    Services
                  </h2>

                  <p className="mt-1 text-sm text-[#708075]">
                    Everything this client has purchased, all in one place.
                  </p>
                </div>

                <Link
                  href={`/clients/${client.id}/services/new`}
                  className="w-fit rounded-xl bg-[#647d5b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4d6247]"
                >
                  + Add New Service
                </Link>
              </div>

              {services.length === 0 ? (
                <EmptyServices
                  message="No services have been added yet."
                  href={`/clients/${client.id}/services/new`}
                />
              ) : (
                <div className="grid gap-4 p-6 lg:grid-cols-2">
                  {services.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      clientId={client.id}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                label="Total Purchased"
                value={`$${totalPurchased.toLocaleString()}`}
                description={`${services.length} ${
                  services.length === 1 ? "service" : "services"
                }`}
              />

              <SummaryCard
                label="Paid"
                value={`$${paidRevenue.toLocaleString()}`}
                description="Payments received"
              />

              <SummaryCard
                label="Money Owed"
                value={`$${moneyOwed.toLocaleString()}`}
                description="Open or unpaid services"
              />

              <SummaryCard
                label="Active Services"
                value={activeServices.length.toString()}
                description="Still in progress"
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
              <div className="rounded-2xl border border-[#dfe6db] bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-[#243128]">
                      Client Overview
                    </h3>

                    <p className="mt-1 text-sm text-[#708075]">
                      Contact information and general client details.
                    </p>
                  </div>

                  <Link
                    href={`/clients/${client.id}/edit`}
                    className="text-sm font-semibold text-[#647d5b] hover:text-[#4d6247]"
                  >
                    Edit Details
                  </Link>
                </div>

                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  <Detail
                    label="Mailing Address"
                    value={mailingAddress || "Not added"}
                  />

                  <Detail
                    label="Date Reached Out"
                    value={formatDate(client.intake_date)}
                  />

                  <Detail
                    label="General Status"
                    value={client.status || "Active"}
                  />

                  <Detail
                    label="Service Progress"
                    value={overallServiceStatus}
                  />

                  <div className="sm:col-span-2">
                    <Detail
                      label="General Notes"
                      value={
                        client.project_notes ||
                        "No general client notes have been added yet."
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#dfe6db] bg-[#eef2e9] p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7f9975]">
                  Next Step
                </p>

                <h3 className="mt-2 text-xl font-bold text-[#243128]">
                  Keep the relationship moving
                </h3>

                <p className="mt-5 rounded-xl bg-white p-4 text-sm font-semibold leading-6 text-[#4d6247]">
                  {client.next_step ||
                    "No general next step has been added yet."}
                </p>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <WorkspaceCard
                title="Client Notes"
                description="Keep overall relationship notes and follow-up details together."
                action="+ Add Note"
                actionHref={`/clients/${client.id}/edit`}
              >
                <p className="text-sm leading-6 text-[#647066]">
                  {client.project_notes ||
                    "No general notes have been added for this client yet."}
                </p>
              </WorkspaceCard>

              <WorkspaceCard
                title="Interview Details"
                description="Track upcoming interviews and keep completed interviews in the client history."
                action="+ Add Interview"
                actionHref={`/clients/${client.id}/interviews/new`}
              >
                {interviews.length === 0 ? (
                  <SimpleEmptyState text="No interviews have been added yet." />
                ) : (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7f9975]">
                            Upcoming
                          </p>
                          <p className="mt-1 text-sm text-[#708075]">
                            Scheduled and undated interviews that still need attention.
                          </p>
                        </div>

                        <span className="rounded-full bg-[#eef2e9] px-3 py-1 text-xs font-semibold text-[#647d5b]">
                          {upcomingInterviews.length}
                        </span>
                      </div>

                      {upcomingInterviews.length === 0 ? (
                        <div className="mt-4">
                          <SimpleEmptyState text="No upcoming interviews." />
                        </div>
                      ) : (
                        <div className="mt-4 space-y-3">
                          {upcomingInterviews.map((interview) => (
                            <div
                              key={interview.id}
                              className="rounded-xl border border-[#dfe6db] bg-[#fbfcf9] p-4 transition hover:border-[#bdcdb7] hover:bg-white"
                            >
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-semibold text-[#243128]">
                                      {interview.title || "Interview"}
                                    </p>

                                    {!interview.start_at ? (
                                      <span className="rounded-full bg-[#f6ecd9] px-2.5 py-1 text-[11px] font-semibold text-[#8f6d37]">
                                        Date Needed
                                      </span>
                                    ) : null}
                                  </div>

                                  <p className="mt-1 text-sm text-[#708075]">
                                    {formatInterviewDate(interview.start_at)}
                                  </p>

                                  {interview.notes ? (
                                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#647066]">
                                      {interview.notes}
                                    </p>
                                  ) : null}
                                </div>

                                <span className="w-fit rounded-full bg-[#e8edf3] px-3 py-1 text-xs font-semibold text-[#52697b]">
                                  {interview.status || "Scheduled"}
                                </span>
                              </div>

                              <div className="mt-4 flex flex-wrap gap-2 border-t border-[#e4e9df] pt-4">
                                <Link
                                  href={`/calendar/${interview.id}`}
                                  className="rounded-xl border border-[#d7e1d0] bg-white px-3 py-2 text-xs font-semibold text-[#4d6247] hover:bg-[#f5f7f2]"
                                >
                                  View Interview
                                </Link>

                                <InterviewCompleteButton
                                  eventId={interview.id}
                                  compact
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-[#e4e9df] pt-6">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b6997]">
                            Completed Interviews
                          </p>
                          <p className="mt-1 text-sm text-[#708075]">
                            Past and completed interviews stay here for reference.
                          </p>
                        </div>

                        <span className="rounded-full bg-[#eee8f3] px-3 py-1 text-xs font-semibold text-[#6d5878]">
                          {completedInterviews.length}
                        </span>
                      </div>

                      {completedInterviews.length === 0 ? (
                        <div className="mt-4">
                          <SimpleEmptyState text="No completed interviews yet." />
                        </div>
                      ) : (
                        <div className="mt-4 space-y-3">
                          {completedInterviews.map((interview) => (
                            <Link
                              key={interview.id}
                              href={`/calendar/${interview.id}`}
                              className="block rounded-xl border border-[#e4e9df] bg-[#f8f9f6] p-4 opacity-80 transition hover:border-[#cbd8c4] hover:bg-white hover:opacity-100"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#647d5b] text-xs font-bold text-white">
                                      ✓
                                    </span>

                                    <p className="font-semibold text-[#243128]">
                                      {interview.title || "Interview"}
                                    </p>
                                  </div>

                                  <p className="mt-2 text-sm text-[#708075]">
                                    {formatInterviewDate(interview.start_at)}
                                  </p>

                                  {interview.notes ? (
                                    <p className="mt-3 line-clamp-2 whitespace-pre-line text-sm leading-6 text-[#647066]">
                                      {interview.notes}
                                    </p>
                                  ) : null}
                                </div>

                                <span className="rounded-full bg-[#e7f1e6] px-3 py-1 text-xs font-semibold text-[#55704f]">
                                  Completed
                                </span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </WorkspaceCard>

              <WorkspaceCard
                title="Revenue Summary"
                description="Paid revenue and money still owed by this client."
                action="View Revenue"
                actionHref="/revenue"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#e4e9df] bg-[#fbfcf9] p-4">
                    <p className="text-sm text-[#708075]">
                      Money Owed
                    </p>

                    <p className="mt-2 text-2xl font-bold text-[#243128]">
                      ${moneyOwed.toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#e4e9df] bg-[#fbfcf9] p-4">
                    <p className="text-sm text-[#708075]">
                      Paid Revenue
                    </p>

                    <p className="mt-2 text-2xl font-bold text-[#243128]">
                      ${paidRevenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </WorkspaceCard>
            </section>


            <section className="rounded-2xl border border-[#dfe6db] bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#243128]">
                    Payments
                  </h3>
                  <p className="mt-1 text-sm text-[#708075]">
                    Track payments received from this client.
                  </p>
                </div>

                <Link
                  href={`/clients/${client.id}/payments/new`}
                  className="rounded-xl bg-[#647d5b] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  + Add Payment
                </Link>
              </div>

              <div className="mt-5 rounded-xl bg-[#eef2e9] p-5">
                <p className="text-sm text-[#708075]">
                  Total Payments Received
                </p>
                <p className="mt-2 text-3xl font-bold text-[#243128]">
                  ${totalPaymentsReceived.toLocaleString()}
                </p>
              </div>

              <div className="mt-5 space-y-3">
                {payments.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#cfd9c9] p-5 text-center text-sm text-[#708075]">
                    No payments recorded yet.
                  </div>
                ) : (
                  payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="rounded-2xl border border-[#dfe6db] bg-[#fbfcf9] p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-xl font-bold text-[#243128]">
                            ${Number(payment.amount ?? 0).toLocaleString()}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#708075]">
                            <span>
                              {payment.payment_method || "No payment method"}
                            </span>

                            <span className="hidden sm:inline">•</span>

                            <span>{formatDate(payment.payment_date)}</span>
                          </div>

                          {payment.notes ? (
                            <p className="mt-3 text-sm leading-6 text-[#708075]">
                              {payment.notes}
                            </p>
                          ) : null}
                        </div>

                        <span
                          className={`inline-flex h-8 shrink-0 items-center justify-center self-start rounded-full px-4 text-xs font-semibold sm:self-center ${getPaymentStyle(
                            payment.payment_status
                          )}`}
                        >
                          {payment.payment_status || "Pending"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <ClientFileManager clientId={client.id} />

            <section className="rounded-2xl border border-[#dfe6db] bg-white p-6 shadow-sm">
              <div>
                <h3 className="text-xl font-bold text-[#243128]">
                  Client Timeline
                </h3>

                <p className="mt-1 text-sm text-[#708075]">
                  A running history of the client relationship.
                </p>
              </div>

              <div className="mt-6 space-y-5">
                {originalLead && (
                  <TimelineItem
                    title="Converted from Lead"
                    description={`${originalLead.status || "Lead"}${originalLead.call_type ? ` · ${originalLead.call_type}` : ""}`}
                    date={formatDate(originalLead.call_date)}
                  />
                )}

                <TimelineItem
                  title="Client record created"
                  description="The client was added to JGO OS."
                  date={formatDate(client.intake_date)}
                />

                {services.map((service) => (
                  <TimelineItem
                    key={service.id}
                    title={`${service.service || "Service"} added`}
                    description={`${service.status || "New"} · ${
                      service.payment_status || "Open"
                    } · $${Number(service.price ?? 0).toLocaleString()}`}
                    date={formatDate(service.date_added)}
                  />
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[#e4e9df] bg-[#fbfaf6] p-6">
              <div>
                <h3 className="text-lg font-bold text-[#243128]">
                  Client Record Actions
                </h3>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-[#708075]">
                  Archive this client to remove them from the active client list.
                  Permanent deletion removes the client record and related data.
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-3 border-t border-[#e4e9df] pt-5">
                {isArchived ? (
                  <form action={restoreClient}>
                    <input type="hidden" name="clientId" value={client.id} />
                    <button
                      type="submit"
                      className="rounded-xl border border-[#cbd8c4] bg-white px-4 py-2.5 text-sm font-semibold text-[#4d6247] hover:bg-[#f5f7f2]"
                    >
                      Restore Client
                    </button>
                  </form>
                ) : (
                  <form action={archiveClient}>
                    <input type="hidden" name="clientId" value={client.id} />
                    <button
                      type="submit"
                      className="rounded-xl border border-[#d7e1d0] bg-white px-4 py-2.5 text-sm font-semibold text-[#647066] hover:bg-[#f5f7f2]"
                    >
                      Archive Client
                    </button>
                  </form>
                )}

                <form action={deleteClientPermanently}>
                  <input type="hidden" name="clientId" value={client.id} />
                  <button
                    type="submit"
                    className="rounded-xl border border-[#ead4d0] bg-white px-4 py-2.5 text-sm font-semibold text-[#a45f58] hover:bg-[#fbefed]"
                  >
                    Delete Permanently
                  </button>
                </form>
              </div>
            </section>
          </div>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-[#708075]">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold text-[#243128]">
        {value}
      </p>

      <p className="mt-3 text-xs font-semibold text-[#7f9975]">
        {description}
      </p>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7f8d82]">
        {label}
      </p>

      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#3d4d39]">
        {value}
      </p>
    </div>
  );
}

function ServiceCard({
  service,
  clientId,
}: {
  service: ClientService;
  clientId: number;
}) {
  return (
    <div className="rounded-2xl border border-[#dfe6db] bg-[#fbfcf9] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-lg font-bold text-[#243128]">
            {service.service || "Unnamed Service"}
          </p>

          <p className="mt-1 text-sm text-[#708075]">
            Added {formatDate(service.date_added)}
          </p>
        </div>

        <p className="text-xl font-bold text-[#243128]">
          ${Number(service.price ?? 0).toLocaleString()}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
            service.status
          )}`}
        >
          {service.status || "New"}
        </span>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentStyle(
            service.payment_status
          )}`}
        >
          {service.payment_status || "Open"}
        </span>
      </div>

      <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8a968d]">
            Scheduled
          </p>

          <p className="mt-1 text-[#4d5c50]">
            {formatDate(service.scheduled_date)}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8a968d]">
            Due Date
          </p>

          <p className="mt-1 text-[#4d5c50]">
            {formatDate(service.due_date)}
          </p>
        </div>
      </div>

      {service.next_step && (
        <div className="mt-5 rounded-xl bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#7f9975]">
            Next Step
          </p>

          <p className="mt-2 text-sm font-medium text-[#3d4d39]">
            {service.next_step}
          </p>
        </div>
      )}

      {service.notes && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8a968d]">
            Notes
          </p>

          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#647066]">
            {service.notes}
          </p>
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {service.payment_status !== "Paid" ? (
          <form action={markServicePaid}>
            <input type="hidden" name="clientId" value={clientId} />
            <input type="hidden" name="serviceId" value={service.id} />
            <button
              type="submit"
              className="w-full rounded-xl bg-[#647d5b] px-4 py-3 text-sm font-semibold text-white hover:bg-[#4d6247]"
            >
              Mark Paid
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-center rounded-xl bg-[#e7f1e6] px-4 py-3 text-sm font-semibold text-[#55704f]">
            Paid
          </div>
        )}

        <Link
          href={`/clients/${clientId}/services/${service.id}/edit`}
          className="block w-full rounded-xl border border-[#d7e1d0] bg-white px-4 py-3 text-center text-sm font-semibold text-[#4d6247] hover:bg-[#f5f7f2]"
        >
          Edit Service
        </Link>
      </div>
    </div>
  );
}

function EmptyServices({
  message,
  href,
}: {
  message: string;
  href: string;
}) {
  return (
    <div className="p-6">
      <div className="rounded-xl border border-dashed border-[#cfd9c9] bg-[#fbfcf9] p-8 text-center">
        <p className="text-sm text-[#708075]">
          {message}
        </p>

        <Link
          href={href}
          className="mt-4 inline-block text-sm font-semibold text-[#647d5b]"
        >
          + Add the first service
        </Link>
      </div>
    </div>
  );
}

function WorkspaceCard({
  title,
  description,
  action,
  actionHref,
  children,
}: {
  title: string;
  description: string;
  action?: string;
  actionHref?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#dfe6db] bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-[#243128]">
            {title}
          </h3>

          <p className="mt-1 text-sm leading-6 text-[#708075]">
            {description}
          </p>
        </div>

        {action && actionHref ? (
          <Link
            href={actionHref}
            className="shrink-0 text-sm font-semibold text-[#647d5b] hover:text-[#4d6247]"
          >
            {action}
          </Link>
        ) : null}
      </div>

      <div className="mt-6">{children}</div>
    </div>
  );
}

function SimpleEmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[#cfd9c9] bg-[#fbfcf9] p-6 text-center">
      <p className="text-sm text-[#708075]">
        {text}
      </p>
    </div>
  );
}

function TimelineItem({
  title,
  description,
  date,
}: {
  title: string;
  description: string;
  date: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-[#7f9975]" />

      <div>
        <p className="font-semibold text-[#243128]">
          {title}
        </p>

        <p className="mt-1 text-sm text-[#708075]">
          {description}
        </p>

        <p className="mt-2 text-xs font-semibold text-[#9aa59c]">
          {date}
        </p>
      </div>
    </div>
  );
}