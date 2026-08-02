import Link from "next/link";
import { createClient } from "@/lib/supabase-server";

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
};

type ClientService = {
  id: number;
  client_id: number | null;
  price: number | null;
  payment_status: string | null;
};

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function isLead(status: string | null | undefined) {
  return ["lead", "free 15 scheduled", "free 15 completed"].includes(
    normalize(status)
  );
}

function isCompleted(status: string | null | undefined) {
  return ["complete", "completed", "closed"].includes(normalize(status));
}

function isArchived(status: string | null | undefined) {
  return normalize(status) === "archived";
}

function isActive(status: string | null | undefined) {
  return !isLead(status) && !isCompleted(status) && !isArchived(status);
}

function getStatusStyle(status: string | null) {
  const normalized = normalize(status);

  if (normalized === "lead") return "bg-[#eef2e9] text-[#647066]";
  if (normalized === "free 15 scheduled") return "bg-[#f6ecd9] text-[#8f6d37]";
  if (normalized === "free 15 completed") return "bg-[#e8eee3] text-[#4d6247]";
  if (normalized === "in process" || normalized === "in progress") {
    return "bg-[#e8eee3] text-[#4d6247]";
  }
  if (normalized === "coaching session scheduled") {
    return "bg-[#e8edf5] text-[#52667d]";
  }
  if (normalized === "waiting on client") return "bg-[#f6ecd9] text-[#8f6d37]";
  if (normalized === "revision") return "bg-[#eee8f3] text-[#6d5878]";
  if (isCompleted(status)) return "bg-[#e7f1e6] text-[#55704f]";
  if (isArchived(status)) return "bg-[#ececec] text-[#686868]";

  return "bg-[#eef2e9] text-[#647066]";
}

function getPaymentStyle(paymentStatus: string | null) {
  const normalized = normalize(paymentStatus);

  if (normalized === "paid") return "bg-[#e7f1e6] text-[#55704f]";
  if (normalized === "invoice sent") return "bg-[#f6ecd9] text-[#8f6d37]";

  return "bg-[#eef2e9] text-[#647066]";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

type ClientsPageProps = {
  searchParams: Promise<{
    view?: string;
    message?: string;
  }>;
};

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const supabase = await createClient();
  const resolvedSearchParams = await searchParams;
  const currentView = resolvedSearchParams.view ?? "all";
  const message = resolvedSearchParams.message;

  const [clientsResult, servicesResult] = await Promise.all([
    supabase.from("clients").select("*").order("id", { ascending: false }),
    supabase
      .from("client_services")
      .select("id, client_id, price, payment_status"),
  ]);

  if (clientsResult.error || servicesResult.error) {
    console.error("Unable to load clients:", {
      clients: clientsResult.error,
      services: servicesResult.error,
    });

    return (
      <main className="min-h-screen bg-[#f7f8f3] p-6 text-[#243128] lg:p-10">
        <div className="mx-auto max-w-5xl">
          <Link href="/" className="text-sm font-semibold text-[#647d5b]">
            ← Back to Dashboard
          </Link>

          <div className="mt-6 rounded-2xl border border-[#ead4d0] bg-[#fbefed] p-6">
            <h1 className="text-xl font-bold text-[#8d4f48]">
              Clients could not be loaded
            </h1>
            <p className="mt-2 text-sm text-[#9a625c]">
              Check the Supabase connection and table policies.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const clients = (clientsResult.data ?? []) as Client[];
  const services = (servicesResult.data ?? []) as ClientService[];

  const leadClients = clients.filter((client) => isLead(client.status));
  const activeClients = clients.filter((client) => isActive(client.status));
  const completedClients = clients.filter((client) => isCompleted(client.status));
  const archivedClients = clients.filter((client) => isArchived(client.status));

  const visibleClients =
    currentView === "leads"
      ? leadClients
      : currentView === "active"
        ? activeClients
        : currentView === "completed"
          ? completedClients
          : currentView === "archived"
            ? archivedClients
            : clients.filter((client) => !isArchived(client.status));

  const totalRevenue = services
    .filter((service) => normalize(service.payment_status) === "paid")
    .reduce((total, service) => total + Number(service.price ?? 0), 0);

  const tabs = [
    {
      label: "All",
      value: "all",
      count: clients.filter((client) => !isArchived(client.status)).length,
    },
    { label: "Leads", value: "leads", count: leadClients.length },
    { label: "Active", value: "active", count: activeClients.length },
    { label: "Completed", value: "completed", count: completedClients.length },
    { label: "Archived", value: "archived", count: archivedClients.length },
  ];

  const currentLabel =
    tabs.find((tab) => tab.value === currentView)?.label ?? "All";

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
              Manage leads, active clients, completed work, payments, and next
              steps in one place.
            </p>
          </div>

          <Link
            href="/clients/new"
            className="w-fit rounded-xl bg-[#647d5b] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#4d6247]"
          >
            + Add New Client
          </Link>
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

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#708075]">Leads</p>
            <p className="mt-3 text-3xl font-bold text-[#243128]">{leadClients.length}</p>
            <p className="mt-3 text-xs font-semibold text-[#7f9975]">
              Lead and Free 15 stages
            </p>
          </div>

          <div className="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#708075]">Active Clients</p>
            <p className="mt-3 text-3xl font-bold text-[#243128]">{activeClients.length}</p>
            <p className="mt-3 text-xs font-semibold text-[#7f9975]">
              Work currently moving forward
            </p>
          </div>

          <div className="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#708075]">Completed</p>
            <p className="mt-3 text-3xl font-bold text-[#243128]">{completedClients.length}</p>
            <p className="mt-3 text-xs font-semibold text-[#7f9975]">
              Finished client work
            </p>
          </div>

          <div className="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#708075]">Total Revenue</p>
            <p className="mt-3 text-3xl font-bold text-[#243128]">
              {formatCurrency(totalRevenue)}
            </p>
            <p className="mt-3 text-xs font-semibold text-[#7f9975]">
              Paid client services
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#dfe6db] bg-white shadow-sm">
          <div className="flex flex-wrap gap-2 border-b border-[#e4e9df] p-4">
            {tabs.map((tab) => {
              const active = currentView === tab.value;

              return (
                <Link
                  key={tab.value}
                  href={
                    tab.value === "all"
                      ? "/clients"
                      : `/clients?view=${tab.value}`
                  }
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-[#647d5b] text-white"
                      : "border border-[#d7e1d0] bg-white text-[#4d6247] hover:bg-[#f5f7f2]"
                  }`}
                >
                  {tab.label} ({tab.count})
                </Link>
              );
            })}
          </div>

          <div className="border-b border-[#e4e9df] px-6 py-5">
            <h3 className="text-xl font-bold text-[#243128]">
              {currentLabel} Clients
            </h3>
            <p className="mt-1 text-sm text-[#708075]">
              Click a client’s name to open their full profile.
            </p>
          </div>

          {visibleClients.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e8eee3] text-2xl text-[#647d5b]">
                +
              </div>
              <h3 className="mt-5 text-xl font-bold text-[#243128]">
                No records in this category
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#708075]">
                Add a new client or update an existing client’s status.
              </p>
              <Link
                href="/clients/new"
                className="mt-6 inline-block rounded-xl bg-[#647d5b] px-5 py-3 text-sm font-semibold text-white hover:bg-[#4d6247]"
              >
                + Add New Client
              </Link>
            </div>
          ) : (
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
                  {visibleClients.map((client) => (
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
                        {client.company || "Not added"}
                      </td>

                      <td className="px-6 py-5 text-sm font-medium text-[#3d4d39]">
                        {client.service || "Not selected"}
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
                            client.payment_status
                          )}`}
                        >
                          {client.payment_status || "Open"}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-sm font-semibold text-[#243128]">
                        {client.price !== null
                          ? formatCurrency(Number(client.price))
                          : "Not added"}
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
          )}
        </section>
      </div>
    </section>
  );
}
