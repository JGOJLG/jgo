import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import ClientFileManager from "./ClientFileManager";
import {
  archiveClient,
  restoreClient,
  deleteClientPermanently,
} from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Client = {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
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
      "id, name, email, phone, company, status, payment_status, next_step, project_notes, intake_date, due_date"
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

  const client = clientData as Client;
  const services = (serviceData ?? []) as ClientService[];

  const activeServices = services.filter(
    (service) =>
      service.status !== "Completed" && service.status !== "Complete"
  );

  const completedServices = services.filter(
    (service) =>
      service.status === "Completed" || service.status === "Complete"
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

  const isArchived = normalize(client.status) === "archived";

  return (
    <section className="min-w-0 flex-1">
          <header className="border-b border-[#dfe6db] bg-[#fbfaf6] px-6 py-7 lg:px-10">
            <Link
              href="/clients"
              className="text-sm font-semibold text-[#7f9975] hover:text-[#4d6247]"
            >
              ← Back to Clients
            </Link>

            <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-5">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#dfe6db] text-2xl font-bold text-[#4d6247]">
                  {getInitials(client.name)}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-3xl font-bold tracking-tight text-[#243128]">
                      {client.name || "Unnamed Client"}
                    </h2>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                        client.status
                      )}`}
                    >
                      {client.status || "Active"}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-[#708075]">
                    {client.email || "No email added"}
                  </p>

                  <p className="mt-1 text-sm text-[#708075]">
                    {client.phone || "No phone number added"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
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

            <div className="mt-6 flex flex-wrap gap-3 border-t border-[#e4e9df] pt-5">
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
          </header>

          <div className="space-y-7 p-6 lg:p-10">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                label="Total Services"
                value={services.length.toString()}
                description="All service history"
              />

              <SummaryCard
                label="Active Services"
                value={activeServices.length.toString()}
                description="Currently open"
              />

              <SummaryCard
                label="Money Owed"
                value={`$${moneyOwed.toLocaleString()}`}
                description="Open or unpaid services"
              />

              <SummaryCard
                label="Paid Revenue"
                value={`$${paidRevenue.toLocaleString()}`}
                description="Payments received"
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
                    label="Company"
                    value={client.company || "Not added"}
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
                    label="Total Purchased"
                    value={`$${totalPurchased.toLocaleString()}`}
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

                <Link
                  href={`/clients/${client.id}/services/new`}
                  className="mt-4 block w-full rounded-xl bg-[#647d5b] px-4 py-3 text-center text-sm font-semibold text-white hover:bg-[#4d6247]"
                >
                  + Add New Service
                </Link>
              </div>
            </section>

            <section className="rounded-2xl border border-[#dfe6db] bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-[#e4e9df] p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#243128]">
                    Active Services
                  </h3>

                  <p className="mt-1 text-sm text-[#708075]">
                    Current projects, sessions, and unpaid services.
                  </p>
                </div>

                <Link
                  href={`/clients/${client.id}/services/new`}
                  className="w-fit rounded-xl bg-[#647d5b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4d6247]"
                >
                  + Add New Service
                </Link>
              </div>

              {activeServices.length === 0 ? (
                <EmptyServices
                  message="No active services yet."
                  href={`/clients/${client.id}/services/new`}
                />
              ) : (
                <div className="grid gap-4 p-6 lg:grid-cols-2">
                  {activeServices.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      clientId={client.id}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-[#dfe6db] bg-white shadow-sm">
              <div className="border-b border-[#e4e9df] p-6">
                <h3 className="text-xl font-bold text-[#243128]">
                  Completed Service History
                </h3>

                <p className="mt-1 text-sm text-[#708075]">
                  Previous services remain here instead of being overwritten.
                </p>
              </div>

              {completedServices.length === 0 ? (
                <div className="p-6">
                  <div className="rounded-xl border border-dashed border-[#cfd9c9] bg-[#fbfcf9] p-6 text-center">
                    <p className="text-sm text-[#708075]">
                      No completed services yet.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 p-6 lg:grid-cols-2">
                  {completedServices.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      clientId={client.id}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <WorkspaceCard
                title="Client Notes"
                description="Keep overall relationship notes and follow-up details together."
                action="+ Add Note"
              >
                <p className="text-sm leading-6 text-[#647066]">
                  {client.project_notes ||
                    "No general notes have been added for this client yet."}
                </p>
              </WorkspaceCard>

              <WorkspaceCard
                title="Interview Details"
                description="Track upcoming interviews and good-luck reminders."
                action="+ Add Interview"
              >
                <SimpleEmptyState text="No upcoming interviews added." />
              </WorkspaceCard>

              <WorkspaceCard
                title="Revenue Summary"
                description="Paid revenue and money still owed by this client."
                action="View Revenue"
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

      <Link
        href={`/clients/${clientId}/services/${service.id}/edit`}
        className="mt-5 block w-full rounded-xl border border-[#d7e1d0] bg-white px-4 py-3 text-center text-sm font-semibold text-[#4d6247] hover:bg-[#f5f7f2]"
      >
        Edit Service
      </Link>
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
  children,
}: {
  title: string;
  description: string;
  action?: string;
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

        {action ? (
          <button
            type="button"
            className="shrink-0 text-sm font-semibold text-[#647d5b]"
          >
            {action}
          </button>
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