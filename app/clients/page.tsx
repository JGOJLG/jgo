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
    return "bg-purple-100 text-purple-700";
  }

  if (status === "In Progress") {
    return "bg-blue-100 text-blue-700";
  }

  if (status === "On Hold") {
    return "bg-orange-100 text-orange-700";
  }

  return "bg-slate-100 text-slate-700";
}

export default async function ClientsPage() {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("id", { ascending: false });

  const clients = (data ?? []) as Client[];

  if (error) {
    console.error("Unable to load clients:", error);

    return (
      <main className="min-h-screen bg-[#f7f7fb] p-6 text-slate-900 lg:p-10">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/"
            className="text-sm font-semibold text-purple-700"
          >
            ← Back to Dashboard
          </Link>

          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-xl font-bold text-red-800">
              Clients could not be loaded
            </h1>

            <p className="mt-2 text-sm text-red-700">
              Check the Supabase connection and the clients table policy.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7fb] p-6 text-slate-900 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/"
              className="mb-3 inline-block text-sm font-semibold text-purple-700 hover:text-purple-900"
            >
              ← Back to Dashboard
            </Link>

            <h1 className="text-3xl font-bold">Clients</h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage active clients, services, payments, and next steps.
            </p>
          </div>

          <button className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-700">
            + Add New Client
          </button>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Clients</p>
            <p className="mt-2 text-3xl font-bold">{clients.length}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Paid Clients</p>
            <p className="mt-2 text-3xl font-bold">
              {
                clients.filter(
                  (client) => client.payment_status === "Paid"
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Value</p>
            <p className="mt-2 text-3xl font-bold">
              ${clients
                .reduce((total, client) => total + Number(client.price ?? 0), 0)
                .toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <input
            type="search"
            placeholder="Search clients..."
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-purple-500"
          />
        </div>

        {clients.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-bold">No clients found</h2>
            <p className="mt-2 text-sm text-slate-500">
              Add a client in Supabase and refresh this page.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
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

                <tbody className="divide-y divide-slate-100">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <Link
                          href={`/clients/${client.id}`}
                          className="font-semibold text-slate-900 hover:text-purple-700"
                        >
                          {client.name || "Unnamed Client"}
                        </Link>

                        <p className="mt-1 text-sm text-slate-500">
                          {client.email || "No email"}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {client.company || "Not added"}
                      </td>

                      <td className="px-6 py-4 text-sm">
                        {client.service || "Not selected"}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                            client.status
                          )}`}
                        >
                          {client.status || "New"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            client.payment_status === "Paid"
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {client.payment_status || "Pending"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm font-semibold">
                        {client.price !== null
                          ? `$${Number(client.price).toLocaleString()}`
                          : "Not added"}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {client.next_step || "No next step"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}