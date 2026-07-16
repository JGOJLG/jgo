import Link from "next/link";

const clients = [
  {
    id: "jonathan-taylor",
    name: "Jonathan Taylor",
    email: "jonathan@example.com",
    service: "Resume + Cover Letter",
    status: "Revision",
    payment: "Paid",
    nextStep: "Send final PDF",
  },
  {
    id: "ivana-eatmon",
    name: "Ivana Eatmon",
    email: "ivana@example.com",
    service: "Resume Review",
    status: "In Progress",
    payment: "Paid",
    nextStep: "Interview coaching",
  },
  {
    id: "marc-williams",
    name: "Marc Williams",
    email: "marc@example.com",
    service: "Resume + LinkedIn",
    status: "In Progress",
    payment: "Paid",
    nextStep: "LinkedIn optimization",
  },
  {
    id: "sarah-johnson",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    service: "Career Coaching",
    status: "On Hold",
    payment: "Pending",
    nextStep: "Payment follow-up",
  },
];

function getStatusStyle(status: string) {
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

export default function ClientsPage() {
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

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <input
            type="search"
            placeholder="Search clients..."
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-purple-500"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Service</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Payment</th>
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
                        {client.name}
                      </Link>

                      <p className="mt-1 text-sm text-slate-500">
                        {client.email}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-sm">{client.service}</td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                          client.status
                        )}`}
                      >
                        {client.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          client.payment === "Paid"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {client.payment}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {client.nextStep}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}