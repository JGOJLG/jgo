const stats = [
  {
    label: "Active Clients",
    value: "14",
    detail: "+2 from last month",
    icon: "👥",
  },
  {
    label: "Projects in Progress",
    value: "6",
    detail: "+1 from last week",
    icon: "📄",
  },
  {
    label: "Upcoming Calls",
    value: "4",
    detail: "2 calls today",
    icon: "📅",
  },
  {
    label: "Follow-Ups Due",
    value: "8",
    detail: "Next: Sarah M.",
    icon: "✓",
  },
  {
    label: "Revenue This Month",
    value: "$4,750",
    detail: "+18% from last month",
    icon: "$",
  },
];

const clients = [
  {
    name: "Jonathan Taylor",
    initials: "JT",
    service: "Resume + Cover Letter",
    status: "Revision",
    nextStep: "Send final PDF",
    payment: "Paid",
  },
  {
    name: "Ivana Eatmon",
    initials: "IE",
    service: "Resume Review",
    status: "In Progress",
    nextStep: "Interview coaching",
    payment: "Paid",
  },
  {
    name: "Marc Williams",
    initials: "MW",
    service: "Resume + LinkedIn",
    status: "In Progress",
    nextStep: "LinkedIn optimization",
    payment: "Paid",
  },
  {
    name: "Sarah Johnson",
    initials: "SJ",
    service: "Career Coaching",
    status: "On Hold",
    nextStep: "Payment pending",
    payment: "Pending",
  },
];

const tasks = [
  { task: "Send revised resume to Jonathan", due: "Today" },
  { task: "Follow up with Sarah about payment", due: "Today" },
  { task: "Schedule discovery call with Mike", due: "Tomorrow" },
  { task: "Review Ivana's LinkedIn profile", due: "Tomorrow" },
];

const schedule = [
  {
    time: "9:00 AM",
    client: "Jonathan Taylor",
    service: "Resume Review Call",
  },
  {
    time: "11:30 AM",
    client: "Ivana Eatmon",
    service: "Interview Coaching",
  },
  {
    time: "2:00 PM",
    client: "Marc Williams",
    service: "Resume Strategy Call",
  },
];

const navigation = [
  ["▦", "Dashboard"],
  ["👥", "Clients"],
  ["◎", "Leads"],
  ["▣", "Projects"],
  ["□", "Calendar"],
  ["✓", "Tasks"],
  ["$", "Payments"],
  ["▤", "Documents"],
  ["▧", "Templates"],
  ["✦", "Resources"],
  ["▥", "Reports"],
  ["⚙", "Settings"],
];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Revision: "bg-purple-100 text-purple-700",
    "In Progress": "bg-blue-100 text-blue-700",
    "On Hold": "bg-orange-100 text-orange-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f7fb] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col bg-[#071525] px-5 py-7 text-white lg:flex">
          <div className="mb-10 px-2">
            <div className="text-4xl font-bold tracking-tight text-purple-400">
              JGO
            </div>
            <div className="text-2xl tracking-[0.28em]">HIRE</div>
            <p className="mt-2 text-[10px] uppercase tracking-wider text-slate-400">
              Career Coach + Recruiter
            </p>
          </div>

          <nav className="space-y-2">
            {navigation.map(([icon, label], index) => (
              <button
                key={label}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                  index === 0
                    ? "bg-purple-600 text-white"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="w-5 text-center">{icon}</span>
                {label}
              </button>
            ))}
          </nav>

          <div className="mt-auto border-t border-white/10 pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500 font-semibold">
                JG
              </div>
              <div>
                <p className="text-sm font-semibold">Jen Gordon</p>
                <p className="text-xs text-slate-400">
                  Career Coach & Recruiter
                </p>
              </div>
            </div>

            <button className="mt-5 w-full rounded-xl border border-white/20 px-4 py-3 text-sm text-slate-300 hover:bg-white/10">
              Log Out
            </button>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="border-b border-slate-200 bg-white px-6 py-5 lg:px-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Good Evening, Jen! 👋
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Here’s what’s happening with your clients and business today.
                </p>
              </div>

              <div className="flex gap-3">
                <button className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
                  + New Client
                </button>
                <button className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold hover:bg-slate-50">
                  Schedule Call
                </button>
              </div>
            </div>
          </header>

          <div className="space-y-6 p-6 lg:p-10">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        {stat.label}
                      </p>
                      <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-100 text-lg font-bold text-purple-700">
                      {stat.icon}
                    </div>
                  </div>

                  <p className="mt-4 text-xs font-medium text-purple-700">
                    {stat.detail}
                  </p>
                </div>
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-bold">Today’s Schedule</h2>
                  <button className="text-sm font-semibold text-purple-700">
                    View Calendar
                  </button>
                </div>

                <div className="space-y-5">
                  {schedule.map((item) => (
                    <div
                      key={`${item.time}-${item.client}`}
                      className="flex items-start gap-4"
                    >
                      <p className="w-20 text-sm font-semibold text-purple-700">
                        {item.time}
                      </p>

                      <div className="mt-1.5 h-3 w-3 rounded-full bg-purple-600" />

                      <div>
                        <p className="text-sm font-semibold">{item.client}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.service}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-bold">Client Snapshot</h2>
                  <button className="text-sm font-semibold text-purple-700">
                    View Clients
                  </button>
                </div>

                <div className="flex min-h-52 items-center justify-center">
                  <div className="relative flex h-44 w-44 items-center justify-center rounded-full bg-[conic-gradient(#7c3aed_0_43%,#22c55e_43%_79%,#f59e0b_79%_93%,#3b82f6_93%_100%)]">
                    <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">
                      <span className="text-3xl font-bold">14</span>
                      <span className="text-xs text-slate-500">Total Clients</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <p>
                    <span className="mr-2 text-purple-600">●</span>In Progress
                  </p>
                  <p>
                    <span className="mr-2 text-green-500">●</span>Completed
                  </p>
                  <p>
                    <span className="mr-2 text-amber-500">●</span>On Hold
                  </p>
                  <p>
                    <span className="mr-2 text-blue-500">●</span>Discovery
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-bold">Tasks Due</h2>
                  <button className="text-sm font-semibold text-purple-700">
                    View Tasks
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {tasks.map((item) => (
                    <label
                      key={item.task}
                      className="flex cursor-pointer items-start gap-3 py-4"
                    >
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 accent-purple-600"
                      />

                      <span className="flex-1 text-sm">{item.task}</span>

                      <span
                        className={`text-xs font-semibold ${
                          item.due === "Today"
                            ? "text-red-500"
                            : "text-slate-500"
                        }`}
                      >
                        {item.due}
                      </span>
                    </label>
                  ))}
                </div>

                <button className="mt-4 text-sm font-semibold text-purple-700">
                  + New Task
                </button>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_260px]">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-lg font-bold">Recent Clients</h2>

                  <div className="flex gap-3">
                    <input
                      placeholder="Search clients..."
                      className="min-w-0 rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-purple-500"
                    />

                    <button className="rounded-xl bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-700">
                      View All
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-left">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-6 py-4">Client</th>
                        <th className="px-6 py-4">Service</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Next Step</th>
                        <th className="px-6 py-4">Payment</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {clients.map((client) => (
                        <tr key={client.name} className="hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                                {client.initials}
                              </div>
                              <span className="text-sm font-semibold">
                                {client.name}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-600">
                            {client.service}
                          </td>

                          <td className="px-6 py-4">
                            <StatusBadge status={client.status} />
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-600">
                            {client.nextStep}
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-lg font-bold">Quick Actions</h2>

                <div className="space-y-3">
                  {[
                    "Add New Client",
                    "Create New Project",
                    "Send Email",
                    "Upload Document",
                    "Create Invoice",
                    "New Task",
                  ].map((action) => (
                    <button
                      key={action}
                      className="w-full rounded-xl bg-purple-50 px-4 py-3 text-left text-sm font-semibold text-purple-700 transition hover:bg-purple-100"
                    >
                      + {action}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}