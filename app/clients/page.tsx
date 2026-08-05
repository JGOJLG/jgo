import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import LeadFollowUpSelect from "@/components/LeadFollowUpSelect";


type Client = {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  service: string | null;
  status: string | null;
  payment_status: string | null;
  next_step: string | null;
  project_notes: string | null;
  intake_date: string | null;
  due_date: string | null;
  price: number | null;
  lead_source: string | null;
  follow_up_status: string | null;
};

type ClientService = {
  id: number;
  client_id: number | null;
  service: string | null;
  price: number | null;
  status: string | null;
  payment_status: string | null;
  date_added: string | null;
};

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function isLeadStatus(status: string | null) {
  return ["lead", "free 15 scheduled", "free 15 completed"].includes(
    normalize(status)
  );
}

function getStatusStyle(status: string | null) {
  if (status === "Revision") {
    return "bg-[#eee8f3] text-[#6d5878]";
  }

  if (status === "In Progress") {
    return "bg-[#e8eee3] text-[#4d6247]";
  }

  if (status === "On Hold") {
    return "bg-[#f6ecd9] text-[#8f6d37]";
  }

  if (status === "Complete" || status === "Completed") {
    return "bg-[#e7f1e6] text-[#55704f]";
  }

  if (status === "Archived") {
    return "bg-[#ececec] text-[#686868]";
  }

  if (isLeadStatus(status)) {
    return "bg-[#eee8d9] text-[#8f7d37]";
  }

  return "bg-[#eef2e9] text-[#647066]";
}

function getPaymentStyle(paymentStatus: string | null) {
  if (paymentStatus === "Paid") {
    return "bg-[#e7f1e6] text-[#55704f]";
  }

  if (paymentStatus === "Pending") {
    return "bg-[#f6ecd9] text-[#8f6d37]";
  }

  return "bg-[#eef2e9] text-[#647066]";
}

type LeadRow = Client & {
  displayService: string;
  displayPrice: number;
  displayPaymentStatus: string | null;
};

function LeadsTable({
  title,
  rows,
}: {
  title: string;
  rows: LeadRow[];
}) {
  if (rows.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-[#dfe6db] bg-white shadow-sm">
      <div className="border-b border-[#e4e9df] px-6 py-5">
        <h3 className="text-xl font-bold text-[#243128]">{title}</h3>
        <p className="mt-1 text-sm text-[#708075]">
          Click a client’s name to open their full profile.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] text-left">
          <thead className="bg-[#f8faf6] text-xs uppercase tracking-wide text-[#708075]">
            <tr>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Lead Source</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Date Reached Out</th>
              <th className="px-6 py-4">Next Step</th>
              <th className="px-6 py-4">Follow-Up</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#edf0ea]">
            {rows.map((client) => (
              <tr key={client.id} className="transition hover:bg-[#fbfcf9]">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8eee3] text-sm font-bold text-[#4d6247]">
                      {(client.name || "C")
                        .split(" ")
                        .map((word) => word[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>

                    <div>
                      <Link
                        href={`/clients/${client.id}`}
                        className="font-semibold text-[#243128] hover:text-[#647d5b]"
                      >
                        {client.name || "Unnamed Client"}
                      </Link>

                      <p className="mt-1 text-sm text-[#708075]">
                        {client.email || "No email added"}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-5 text-sm text-[#647066]">
                  {client.lead_source || "Not added"}
                </td>

                <td className="px-6 py-5">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                      client.status
                    )}`}
                  >
                    {client.status || "Lead"}
                  </span>
                </td>

                <td className="px-6 py-5 text-sm text-[#647066]">
                  {client.intake_date
                    ? new Date(
                        `${client.intake_date}T12:00:00`
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Not added"}
                </td>

                <td className="px-6 py-5 text-sm text-[#647066]">
                  {client.next_step || "No next step added"}
                </td>

                <td className="px-6 py-5">
                  <LeadFollowUpSelect
                    clientId={client.id}
                    value={client.follow_up_status}
                  />
                </td>

                <td className="px-6 py-5 text-right">
                  <Link
                    href={`/clients/${client.id}`}
                    className="inline-block rounded-lg border border-[#d7e1d0] bg-white px-3 py-2 text-xs font-semibold text-[#4d6247] hover:bg-[#f5f7f2]"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}


type ClientsPageProps = {
  searchParams: Promise<{
    showArchived?: string;
    view?: string;
    message?: string;
  }>;
};

export default async function ClientsPage({
  searchParams,
}: ClientsPageProps) {
  const supabase = await createClient();
  const resolvedSearchParams = await searchParams;
  const showArchived = resolvedSearchParams.showArchived === "true";
  const view = resolvedSearchParams.view || "all";
  const message = resolvedSearchParams.message;

  let clientQuery = supabase
    .from("clients")
    .select("*");

  if (!showArchived) {
    clientQuery = clientQuery.neq("status", "Archived");
  } else {
    clientQuery = clientQuery.eq("status", "Archived");
  }

  clientQuery = clientQuery.order("id", { ascending: false });

  const [clientsResult, servicesResult] = await Promise.all([
    clientQuery,
    supabase
      .from("client_services")
      .select("id, client_id, service, price, status, payment_status, date_added")
      .order("date_added", { ascending: false })
      .order("id", { ascending: false }),
  ]);

  const allClients = (clientsResult.data ?? []) as Client[];
  const services = (servicesResult.data ?? []) as ClientService[];

  // Leads never have a status set on the row itself in a few edge cases
  // (null instead of "Lead"), so treat a null/blank status as a lead too
  // rather than letting it silently fall through the cracks.
  const clients = allClients.filter((client) => {
    if (view === "leads") {
      return isLeadStatus(client.status) || !client.status;
    }

    if (view === "active") {
      return !isLeadStatus(client.status) && Boolean(client.status);
    }

    return true;
  });

  const servicesByClient = new Map<number, ClientService[]>();

  services.forEach((service) => {
    if (!service.client_id) return;

    const current = servicesByClient.get(service.client_id) ?? [];
    current.push(service);
    servicesByClient.set(service.client_id, current);
  });

  const clientRows = clients.map((client) => {
    const clientServices = servicesByClient.get(client.id) ?? [];

    const serviceNames = clientServices
      .map((service) => service.service)
      .filter((service): service is string => Boolean(service));

    const totalPrice = clientServices.reduce(
      (total, service) => total + Number(service.price ?? 0),
      0
    );

    const paymentStatus =
      clientServices.length === 0
        ? client.payment_status
        : clientServices.every(
              (service) => service.payment_status === "Paid"
            )
          ? "Paid"
          : clientServices.some(
                (service) => service.payment_status === "Invoice Sent"
              )
            ? "Invoice Sent"
            : "Open";

    return {
      ...client,
      displayService:
        serviceNames.length > 0
          ? serviceNames.join(" • ")
          : client.service || "Not selected",
      displayPrice:
        clientServices.length > 0
          ? totalPrice
          : Number(client.price ?? 0),
      displayPaymentStatus: paymentStatus,
    };
  });

  const leadCount = allClients.filter(
    (c) => isLeadStatus(c.status) || !c.status
  ).length;

  const activeCount = allClients.filter(
    (c) => !isLeadStatus(c.status) && Boolean(c.status)
  ).length;

  const weekAgoStr = new Date(Date.now() - 7 * 86400000)
    .toISOString()
    .slice(0, 10);

  const leadsOnly = allClients.filter(
    (c) => isLeadStatus(c.status) || !c.status
  );

  const newThisWeekCount = leadsOnly.filter(
    (c) => c.intake_date && c.intake_date >= weekAgoStr
  ).length;

  const paidClients = clientRows.filter(
    (client) => client.displayPaymentStatus === "Paid"
  ).length;

  const activeLeadRows = clientRows.filter(
    (client) =>
      normalize(client.follow_up_status) === "needs follow-up"
  );

  const noFollowUpRows = clientRows.filter(
    (client) =>
      normalize(client.follow_up_status) ===
      "no follow-up necessary"
  );

  const error = clientsResult.error || servicesResult.error;

  if (error) {
    console.error("Unable to load clients:", error);

    return (
      <main className="min-h-screen bg-[#f7f8f3] p-6 text-[#243128] lg:p-10">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/"
            className="text-sm font-semibold text-[#647d5b]"
          >
            ← Back to Dashboard
          </Link>

          <div className="mt-6 rounded-2xl border border-[#ead4d0] bg-[#fbefed] p-6">
            <h1 className="text-xl font-bold text-[#8d4f48]">
              Clients could not be loaded
            </h1>

            <p className="mt-2 text-sm text-[#9a625c]">
              Check the Supabase connection and clients table policy.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const viewTabs = [
    { key: "all", label: "All" },
    { key: "leads", label: `Leads (${leadCount})` },
    { key: "active", label: `Clients (${activeCount})` },
  ];

  return (
    <section className="min-w-0 flex-1">
          <header className="border-b border-[#dfe6db] bg-[#fbfaf6] px-6 py-7 lg:px-10">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <Link
                  href="/"
                  className="text-sm font-semibold text-[#7f9975] hover:text-[#4d6247]"
                >
                  ← Back to Dashboard
                </Link>

                <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#243128]">
                  Clients
                </h2>

                <p className="mt-2 text-sm text-[#708075]">
                  Manage client services, payments, progress, and next steps.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={showArchived ? "/clients" : "/clients?showArchived=true"}
                  className="w-fit rounded-xl border border-[#d7e1d0] bg-white px-5 py-3 text-sm font-semibold text-[#4d6247] hover:bg-[#f5f7f2]"
                >
                  {showArchived ? "Hide Archived" : "Show Archived"}
                </Link>

                <Link
                  href="/clients/new"
                  className="w-fit rounded-xl bg-[#647d5b] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#4d6247]"
                >
                  + Add Client
                </Link>
              </div>
            </div>

            <div className="mt-6 flex w-fit gap-1 rounded-full border border-[#d7e1d0] bg-white p-1">
              {viewTabs.map((tab) => {
                const isActive = view === tab.key;
                const href =
                  tab.key === "all" ? "/clients" : `/clients?view=${tab.key}`;

                return (
                  <Link
                    key={tab.key}
                    href={href}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "bg-[#647d5b] text-white"
                        : "text-[#4d6247] hover:bg-[#f5f7f2]"
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </header>

          <div className="space-y-7 p-6 lg:p-10">
            {message === "archived" ? (
              <div className="rounded-2xl border border-[#d7e1d0] bg-[#eef2e9] px-5 py-4 text-sm font-semibold text-[#4d6247]">
                Client archived successfully.
              </div>
            ) : null}

            {message === "deleted" ? (
              <div className="rounded-2xl border border-[#d7e1d0] bg-[#eef2e9] px-5 py-4 text-sm font-semibold text-[#4d6247]">
                Client permanently deleted.
              </div>
            ) : null}

            <section
              className={`grid gap-4 sm:grid-cols-2 ${
                view === "all" ? "xl:grid-cols-3" : "xl:grid-cols-2"
              }`}
            >
              {view === "all" ? (
                <div className="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm">
                  <p className="text-sm font-medium text-[#708075]">
                    Total People
                  </p>

                  <p className="mt-3 text-3xl font-bold text-[#243128]">
                    {allClients.length}
                  </p>

                  <p className="mt-3 text-xs font-semibold text-[#7f9975]">
                    All records
                  </p>
                </div>
              ) : null}

              {view === "leads" ? (
                <>
                  <div className="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-[#708075]">
                      New This Week
                    </p>

                    <p className="mt-3 text-3xl font-bold text-[#243128]">
                      {newThisWeekCount}
                    </p>

                    <p className="mt-3 text-xs font-semibold text-[#7f9975]">
                      Reached out in the last 7 days
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-[#708075]">
                      Total Leads
                    </p>

                    <p className="mt-3 text-3xl font-bold text-[#243128]">
                      {leadCount}
                    </p>

                    <p className="mt-3 text-xs font-semibold text-[#7f9975]">
                      Not yet converted
                    </p>
                  </div>
                </>
              ) : view === "active" ? (
                <>
                  <div className="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-[#708075]">
                      Leads
                    </p>

                    <p className="mt-3 text-3xl font-bold text-[#243128]">
                      {leadCount}
                    </p>

                    <p className="mt-3 text-xs font-semibold text-[#7f9975]">
                      Not yet converted
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-[#708075]">
                      Paid Clients
                    </p>

                    <p className="mt-3 text-3xl font-bold text-[#243128]">
                      {paidClients}
                    </p>

                    <p className="mt-3 text-xs font-semibold text-[#7f9975]">
                      Payment received
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-[#708075]">
                      Leads
                    </p>

                    <p className="mt-3 text-3xl font-bold text-[#243128]">
                      {leadCount}
                    </p>

                    <p className="mt-3 text-xs font-semibold text-[#7f9975]">
                      Not yet converted
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-[#708075]">
                      Paid Clients
                    </p>

                    <p className="mt-3 text-3xl font-bold text-[#243128]">
                      {paidClients}
                    </p>

                    <p className="mt-3 text-xs font-semibold text-[#7f9975]">
                      Payment received
                    </p>
                  </div>
                </>
              )}
            </section>

            {clientRows.length === 0 ? (
              <section className="rounded-2xl border border-[#dfe6db] bg-white p-12 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e8eee3] text-2xl text-[#647d5b]">
                  +
                </div>

                <h3 className="mt-5 text-xl font-bold text-[#243128]">
                  {view === "leads"
                    ? "No leads right now"
                    : view === "active"
                      ? "No active or completed clients yet"
                      : "No clients yet"}
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#708075]">
                  Add your first client to begin tracking their service,
                  payment, progress, and next steps.
                </p>

                <Link
                  href="/clients/new"
                  className="mt-6 inline-block rounded-xl bg-[#647d5b] px-5 py-3 text-sm font-semibold text-white hover:bg-[#4d6247]"
                >
                  + Add New Client
                </Link>
              </section>
            ) : view === "leads" ? (
              <>
                {activeLeadRows.length === 0 ? (
                  <section className="rounded-2xl border border-[#dfe6db] bg-white p-12 text-center shadow-sm">
                    <h3 className="text-xl font-bold text-[#243128]">
                      Everyone is caught up
                    </h3>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#708075]">
                      No leads currently need follow-up.
                    </p>
                  </section>
                ) : (
                  <LeadsTable title="Leads" rows={activeLeadRows} />
                )}

                <LeadsTable
                  title="No Follow-Up Necessary"
                  rows={noFollowUpRows}
                />
              </>
            ) : (
              <section className="overflow-hidden rounded-2xl border border-[#dfe6db] bg-white shadow-sm">
                <div className="border-b border-[#e4e9df] px-6 py-5">
                  <h3 className="text-xl font-bold text-[#243128]">
                    {view === "active" ? "Active & Completed Clients" : "All People"}
                  </h3>

                  <p className="mt-1 text-sm text-[#708075]">
                    Click a client’s name to open their full profile.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1050px] text-left">
                    <thead className="bg-[#f8faf6] text-xs uppercase tracking-wide text-[#708075]">
                      <tr>
                        <th className="px-6 py-4">Client</th>
                        <th className="px-6 py-4">Company</th>
                        <th className="px-6 py-4">Service</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Payment</th>
                        <th className="px-6 py-4">Price</th>
                        <th className="px-6 py-4">Next Step</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#edf0ea]">
                      {clientRows.map((client) => (
                        <tr
                          key={client.id}
                          className="transition hover:bg-[#fbfcf9]"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8eee3] text-sm font-bold text-[#4d6247]">
                                {(client.name || "C")
                                  .split(" ")
                                  .map((word) => word[0])
                                  .slice(0, 2)
                                  .join("")
                                  .toUpperCase()}
                              </div>

                              <div>
                                <Link
                                  href={`/clients/${client.id}`}
                                  className="font-semibold text-[#243128] hover:text-[#647d5b]"
                                >
                                  {client.name || "Unnamed Client"}
                                </Link>

                                <p className="mt-1 text-sm text-[#708075]">
                                  {client.email || "No email added"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5 text-sm text-[#647066]">
                            {client.company || "Not added"}
                          </td>

                          <td className="px-6 py-5 text-sm font-medium text-[#3d4d39]">
                            {client.displayService}
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                                client.status
                              )}`}
                            >
                              {client.status || "Lead"}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentStyle(
                                client.displayPaymentStatus
                              )}`}
                            >
                              {client.displayPaymentStatus || "Pending"}
                            </span>
                          </td>

                          <td className="px-6 py-5 text-sm font-semibold text-[#243128]">
                            {client.displayPrice > 0
                              ? `$${client.displayPrice.toLocaleString()}`
                              : "$0"}
                          </td>

                          <td className="px-6 py-5 text-sm text-[#647066]">
                            {client.next_step || "No next step added"}
                          </td>

                          <td className="px-6 py-5 text-right">
                            <Link
                              href={`/clients/${client.id}`}
                              className="inline-block rounded-lg border border-[#d7e1d0] bg-white px-3 py-2 text-xs font-semibold text-[#4d6247] hover:bg-[#f5f7f2]"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
    </section>
  );
}
