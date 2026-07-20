import Link from "next/link";

const stats = [
  {
    label: "Active Clients",
    value: "14",
    detail: "2 added this month",
  },
  {
    label: "New Leads",
    value: "6",
    detail: "3 need follow-up",
  },
  {
    label: "Upcoming Sessions",
    value: "4",
    detail: "2 scheduled today",
  },
  {
    label: "Revenue This Month",
    value: "$4,750",
    detail: "18% above last month",
  },
];

const dailyChecklist = [
  "Post on LinkedIn",
  "Post on social media",
  "Publish on Substack",
];

const clientTasks = [
  {
    client: "Jonathan Taylor",
    task: "Send final resume and cover letter",
    due: "Today",
  },
  {
    client: "Sarah Johnson",
    task: "Follow up regarding payment",
    due: "Today",
  },
  {
    client: "Ivana Eatmon",
    task: "Prepare interview coaching notes",
    due: "Tomorrow",
  },
];

const interviews = [
  {
    client: "Sarah Johnson",
    role: "Account Executive",
    company: "ABC Insurance",
    date: "Tomorrow",
    time: "2:00 PM",
  },
  {
    client: "Jonathan Taylor",
    role: "Deputy CTO",
    company: "City Leadership Team",
    date: "Friday",
    time: "10:30 AM",
  },
];

const recentClients = [
  {
    name: "Jonathan Taylor",
    service: "Resume + Cover Letter",
    status: "Revision",
    payment: "Paid",
  },
  {
    name: "Ivana Eatmon",
    service: "Resume Review",
    status: "In Progress",
    payment: "Paid",
  },
  {
    name: "Sarah Johnson",
    service: "Career Coaching",
    status: "On Hold",
    payment: "Pending",
  },
];

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

const quickActions = [
  {
    label: "Add New Client",
    href: "/clients/new",
  },
  {
    label: "Add New Lead",
    href: "#",
  },
  {
    label: "Schedule Free15",
    href: "#",
  },
  {
    label: "Send Invoice",
    href: "#",
  },
  {
    label: "Create Email",
    href: "#",
  },
  {
    label: "Upload Client File",
    href: "#",
  },
];

export default function Home() {
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
            {navigation.map((item, index) => (
              <Link
                key={item.label}
                href={item.href}
                className={`block rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  index === 0
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

            <button
              type="button"
              className="mt-4 w-full rounded-xl border border-[#d7e1d0] px-4 py-2 text-sm font-semibold text-[#4d6247] hover:bg-[#f5f7f2]"
            >
              Log Out
            </button>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="border-b border-[#dfe6db] bg-[#fbfaf6] px-6 py-7 lg:px-10">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#7f9975]">
                  Thursday, July 16
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#243128]">
                  Good morning, Jen
                </h2>

                <p className="mt-2 text-sm text-[#708075]">
                  Here is what needs your attention today.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/clients"
                  className="rounded-xl border border-[#cbd8c4] bg-white px-5 py-3 text-sm font-semibold text-[#4d6247] shadow-sm hover:bg-[#f5f7f2]"
                >
                  View Clients
                </Link>

                <Link
                  href="/clients/new"
                  className="rounded-xl bg-[#647d5b] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#4d6247]"
                >
                  + Add New Client
                </Link>
              </div>
            </div>
          </header>

          <div className="space-y-7 p-6 lg:p-10">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm"
                >
                  <p className="text-sm font-medium text-[#708075]">
                    {stat.label}
                  </p>

                  <p className="mt-3 text-3xl font-bold text-[#243128]">
                    {stat.value}
                  </p>

                  <p className="mt-3 text-xs font-semibold text-[#7f9975]">
                    {stat.detail}
                  </p>
                </div>
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
              <div className="rounded-2xl border border-[#dfe6db] bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-[#243128]">
                      Daily Checklist
                    </h3>

                    <p className="mt-1 text-sm text-[#708075]">
                      Your recurring daily business habits.
                    </p>
                  </div>

                  <span className="rounded-full bg-[#e8eee3] px-3 py-1 text-xs font-semibold text-[#4d6247]">
                    0 of 3
                  </span>
                </div>

                <div className="mt-6 space-y-3">
                  {dailyChecklist.map((item) => (
                    <label
                      key={item}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#e4e9df] bg-[#fbfcf9] px-4 py-4"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[#647d5b]"
                      />

                      <span className="text-sm font-medium text-[#3d4d39]">
                        {item}
                      </span>
                    </label>
                  ))}
                </div>

                <button
                  type="button"
                  className="mt-5 text-sm font-semibold text-[#647d5b]"
                >
                  Manage Daily Checklist
                </button>
              </div>

              <div className="rounded-2xl border border-[#dfe6db] bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-[#243128]">
                      Upcoming Client Interviews
                    </h3>

                    <p className="mt-1 text-sm text-[#708075]">
                      Remember to send a good-luck message.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="text-sm font-semibold text-[#647d5b]"
                  >
                    View Calendar
                  </button>
                </div>

                <div className="mt-6 space-y-4">
                  {interviews.map((interview) => (
                    <div
                      key={`${interview.client}-${interview.time}`}
                      className="rounded-xl border border-[#e4e9df] bg-[#fbfcf9] p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-[#243128]">
                            {interview.client}
                          </p>

                          <p className="mt-1 text-sm text-[#708075]">
                            {interview.role} at {interview.company}
                          </p>

                          <p className="mt-2 text-xs font-semibold text-[#7f9975]">
                            {interview.date} at {interview.time}
                          </p>
                        </div>

                        <button
                          type="button"
                          className="rounded-xl bg-[#e8eee3] px-4 py-2 text-sm font-semibold text-[#4d6247] hover:bg-[#d7e1d0]"
                        >
                          Send Good Luck Text
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_320px]">
              <div className="rounded-2xl border border-[#dfe6db] bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-[#243128]">
                      Client Tasks
                    </h3>

                    <p className="mt-1 text-sm text-[#708075]">
                      Work tied directly to client projects.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="text-sm font-semibold text-[#647d5b]"
                  >
                    View All Tasks
                  </button>
                </div>

                <div className="mt-6 divide-y divide-[#edf0ea]">
                  {clientTasks.map((item) => (
                    <div
                      key={`${item.client}-${item.task}`}
                      className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#243128]">
                          {item.client}
                        </p>

                        <p className="mt-1 text-sm text-[#708075]">
                          {item.task}
                        </p>
                      </div>

                      <span
                        className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                          item.due === "Today"
                            ? "bg-[#f7e7e4] text-[#9a554d]"
                            : "bg-[#eef2e9] text-[#5c7454]"
                        }`}
                      >
                        {item.due}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#dfe6db] bg-[#eef2e9] p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7f9975]">
                  Quick Actions
                </p>

                <h3 className="mt-2 text-xl font-bold text-[#243128]">
                  Keep things moving
                </h3>

                <div className="mt-6 space-y-3">
                  {quickActions.map((action) =>
                    action.href === "#" ? (
                      <button
                        key={action.label}
                        type="button"
                        className="w-full rounded-xl bg-white px-4 py-3 text-left text-sm font-semibold text-[#4d6247] shadow-sm transition hover:bg-[#f8faf6]"
                      >
                        + {action.label}
                      </button>
                    ) : (
                      <Link
                        key={action.label}
                        href={action.href}
                        className="block w-full rounded-xl bg-white px-4 py-3 text-left text-sm font-semibold text-[#4d6247] shadow-sm transition hover:bg-[#f8faf6]"
                      >
                        + {action.label}
                      </Link>
                    )
                  )}
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-[#dfe6db] bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-[#e4e9df] p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#243128]">
                    Recent Clients
                  </h3>

                  <p className="mt-1 text-sm text-[#708075]">
                    A quick look at active client work.
                  </p>
                </div>

                <Link
                  href="/clients"
                  className="text-sm font-semibold text-[#647d5b]"
                >
                  View All Clients
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px] text-left">
                  <thead className="bg-[#f8faf6] text-xs uppercase tracking-wide text-[#708075]">
                    <tr>
                      <th className="px-6 py-4">Client</th>
                      <th className="px-6 py-4">Service</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Payment</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#edf0ea]">
                    {recentClients.map((client) => (
                      <tr key={client.name} className="hover:bg-[#fbfcf9]">
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-[#243128]">
                            {client.name}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-sm text-[#647066]">
                          {client.service}
                        </td>

                        <td className="px-6 py-4">
                          <span className="rounded-full bg-[#e8eee3] px-3 py-1 text-xs font-semibold text-[#4d6247]">
                            {client.status}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              client.payment === "Paid"
                                ? "bg-[#e7f1e6] text-[#55704f]"
                                : "bg-[#f6ecd9] text-[#8f6d37]"
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
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}