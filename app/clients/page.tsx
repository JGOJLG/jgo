import Link from "next/link";
import { supabase } from "@/lib/supabase";

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

const navigation = [
  { label: "Dashboard", href: "/" },
  { label: "Clients", href: "/clients" },
  { label: "Leads", href: "#" },
  { label: "Calendar", href: "#" },
  { label: "Tasks", href: "#" },
  { label: "Revenue", href: "#" },
  { label: "Files", href: "#" },
  { label: "Email Templates", href: "#" },
  { label: "Marketing", href: "#" },
  { label: "Settings", href: "#" },
];

export default async function ClientsPage() {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("id", { ascending: false });

  const clients = (data ?? []) as Client[];

  const paidClients = clients.filter(
    (client) => client.payment_status === "Paid"
  ).length;

  const activeClients = clients.filter(
    (client) =>
      client.status !== "Complete" &&
      client.status !== "Completed" &&
      client.status !== "Closed"
  ).length;

  const totalRevenue = clients.reduce(
    (total, client) => total + Number(client.price ?? 0),
    0
  );

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

  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#243128]">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col border-r border-[#dfe6db] bg-[#f1f4ed] px-5 py-7 lg:flex">
          <div className="mb-10 px-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7f9975]">
              JGO Hire
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#3d4d39]">
              JGO OS
            </h1>

            <p className="mt-2 text-xs leading-5 text-[#708075]">
              Your business command center
            </p>
          </div>

          <nav className="space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`block rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  item.label === "Clients"
                    ? "bg-[#d7e1d0] text-[#3d4d39]"
                    : "text-[#647066] hover:bg-white hover:text-[#3d4d39]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl border border-[#dfe6db] bg-white p-4">
            <p className="text-sm font-semibold text-[#3d4d39]">
              Jennifer Gordon
            </p>

            <p className="mt-1 text-xs text-[#708075]">
              Certified Career Coach and Recruiter
            </p>

            <button className="mt-4 w-full rounded-xl border border-[#d7e1d0] px-4 py-2 text-sm font-semibold text-[#4d6247] hover:bg-[#f5f7f2]">
              Log Out
            </button>
          </div>
        </aside>

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

              <Link
                href="/clients/new"
                className="w-fit rounded-xl bg-[#647d5b] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#4d6247]"
              >
                + Add New Client
              </Link>
            </div>
          </header>

          <div className="space-y-7 p-6 lg:p-10">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-[#708075]">
                  Total Clients
                </p>

                <p className="mt-3 text-3xl font-bold text-[#243128]">
                  {clients.length}
                </p>

                <p className="mt-3 text-xs font-semibold text-[#7f9975]">
                  All client records
                </p>
              </div>

              <div className="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-[#708075]">
                  Active Clients
                </p>

                <p className="mt-3 text-3xl font-bold text-[#243128]">
                  {activeClients}
                </p>

                <p className="mt-3 text-xs font-semibold text-[#7f9975]">
                  Currently in progress
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

              <div className="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-[#708075]">
                  Total Revenue
                </p>

                <p className="mt-3 text-3xl font-bold text-[#243128]">
                  ${totalRevenue.toLocaleString()}
                </p>

                <p className="mt-3 text-xs font-semibold text-[#7f9975]">
                  Based on client services
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <label
                    htmlFor="client-search"
                    className="text-xs font-semibold uppercase tracking-[0.15em] text-[#708075]"
                  >
                    Search Clients
                  </label>

                  <input
                    id="client-search"
                    type="search"
                    placeholder="Search by name, email, company, or service..."
                    className="mt-2 w-full rounded-xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3 text-sm text-[#243128] outline-none placeholder:text-[#9aa59c] focus:border-[#9fb294]"
                  />
                </div>

                <div className="flex flex-wrap gap-3 md:pt-6">
                  <button className="rounded-xl border border-[#d7e1d0] bg-white px-4 py-3 text-sm font-semibold text-[#4d6247] hover:bg-[#f5f7f2]">
                    Filter
                  </button>

                  <button className="rounded-xl border border-[#d7e1d0] bg-white px-4 py-3 text-sm font-semibold text-[#4d6247] hover:bg-[#f5f7f2]">
                    Sort
                  </button>
                </div>
              </div>
            </section>

            {clients.length === 0 ? (
              <section className="rounded-2xl border border-[#dfe6db] bg-white p-12 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e8eee3] text-2xl text-[#647d5b]">
                  +
                </div>

                <h3 className="mt-5 text-xl font-bold text-[#243128]">
                  No clients yet
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
            ) : (
              <section className="overflow-hidden rounded-2xl border border-[#dfe6db] bg-white shadow-sm">
                <div className="border-b border-[#e4e9df] px-6 py-5">
                  <h3 className="text-xl font-bold text-[#243128]">
                    All Clients
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
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#edf0ea]">
                      {clients.map((client) => (
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
                            {client.service || "Not selected"}
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                                client.status
                              )}`}
                            >
                              {client.status || "New"}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentStyle(
                                client.payment_status
                              )}`}
                            >
                              {client.payment_status || "Pending"}
                            </span>
                          </td>

                          <td className="px-6 py-5 text-sm font-semibold text-[#243128]">
                            {client.price !== null
                              ? `$${Number(client.price).toLocaleString()}`
                              : "Not added"}
                          </td>

                          <td className="px-6 py-5 text-sm text-[#647066]">
                            {client.next_step || "No next step added"}
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
      </div>
    </main>
  );
}