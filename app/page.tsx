import Link from "next/link";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Client = {
  id: number;
  name: string | null;
  email: string | null;
  service: string | null;
  status: string | null;
  payment_status: string | null;
  intake_date: string | null;
  due_date: string | null;
  price: number | null;
  next_step: string | null;
};

type Payment = {
  id: number;
  client_id: number | null;
  amount: number | null;
  payment_date: string | null;
  payment_method: string | null;
  payment_status: string | null;
  notes: string | null;
};

type IntakeCall = {
  id: number;
  name: string | null;
  call_date: string | null;
  call_type: string | null;
  status: string | null;
  follow_up_date: string | null;
  needs_help_with: string | null;
  services_discussed: string | null;
  notes: string | null;
  converted_to_client: boolean | null;
};

type FollowUp = {
  id: number;
  client_id: number | null;
  intake_call_id: number | null;
  title: string | null;
  due_date: string | null;
  status: string | null;
  priority: string | null;
  notes: string | null;
};

type ClientService = {
  id: number;
  client_id: number | null;
  service_type: string | null;
  service_date: string | null;
  price: number | null;
  payment_status: string | null;
  payment_method: string | null;
  session_complete: boolean | null;
};


const dailyChecklist = [
  "Post on LinkedIn",
  "Post on social media",
  "Publish on Substack",
];

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function isPaid(status: string | null | undefined) {
  return normalize(status) === "paid";
}

function isCompleted(status: string | null | undefined) {
  return [
    "complete",
    "completed",
    "closed",
    "cancelled",
    "canceled",
  ].includes(normalize(status));
}

function isOpenFollowUp(status: string | null | undefined) {
  return !["completed", "complete", "closed", "cancelled", "canceled"].includes(
    normalize(status)
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "No date added";
  }

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getTodayLabel() {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
}

function getTodayDateString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getMonthStartDateString() {
  const now = new Date();

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";

  return `${year}-${month}-01`;
}

function getStatusStyle(status: string | null | undefined) {
  const normalized = normalize(status);

  if (normalized === "revision") {
    return "bg-[#eee8f3] text-[#6d5878]";
  }

  if (normalized === "in progress") {
    return "bg-[#e8eee3] text-[#4d6247]";
  }

  if (normalized === "on hold") {
    return "bg-[#f6ecd9] text-[#8f6d37]";
  }

  if (isCompleted(status)) {
    return "bg-[#e7f1e6] text-[#55704f]";
  }

  return "bg-[#eef2e9] text-[#647066]";
}

function getPaymentStyle(status: string | null | undefined) {
  const normalized = normalize(status);

  if (normalized === "paid") {
    return "bg-[#e7f1e6] text-[#55704f]";
  }

  if (normalized === "overdue" || normalized === "past due") {
    return "bg-[#f7e7e4] text-[#9a554d]";
  }

  return "bg-[#f6ecd9] text-[#8f6d37]";
}

function getFollowUpStyle(priority: string | null | undefined) {
  if (normalize(priority) === "high") {
    return "bg-[#f7e7e4] text-[#9a554d]";
  }

  return "bg-[#eef2e9] text-[#5c7454]";
}

export default async function Home() {
  const supabase = await createClient();

  const [
    clientsResult,
    paymentsResult,
    intakeCallsResult,
    followUpsResult,
    servicesResult,
  ] = await Promise.all([
    supabase.from("clients").select("*").order("id", { ascending: false }),

    supabase
      .from("payments")
      .select("*")
      .order("payment_date", { ascending: false }),

    supabase
      .from("intake_calls")
      .select("*")
      .order("call_date", { ascending: false }),

    supabase
      .from("follow_ups")
      .select("*")
      .order("due_date", { ascending: true }),

    supabase
      .from("client_services")
      .select("*")
      .order("service_date", { ascending: false }),
  ]);

  const clients = (clientsResult.data ?? []) as Client[];
  const payments = (paymentsResult.data ?? []) as Payment[];
  const intakeCalls = (intakeCallsResult.data ?? []) as IntakeCall[];
  const followUps = (followUpsResult.data ?? []) as FollowUp[];
  const services = (servicesResult.data ?? []) as ClientService[];

  const databaseError =
    clientsResult.error ||
    paymentsResult.error ||
    intakeCallsResult.error ||
    followUpsResult.error ||
    servicesResult.error;

  const today = getTodayDateString();
  const monthStart = getMonthStartDateString();

  const activeClients = clients.filter(
    (client) => !isCompleted(client.status)
  );

  const completedClients = clients.filter((client) =>
    isCompleted(client.status)
  );

  const paidPayments = payments.filter((payment) =>
    isPaid(payment.payment_status)
  );

  const totalPaidRevenue = paidPayments.reduce(
    (total, payment) => total + Number(payment.amount ?? 0),
    0
  );

  const revenueThisMonth = paidPayments
    .filter(
      (payment) =>
        payment.payment_date &&
        payment.payment_date >= monthStart &&
        payment.payment_date <= today
    )
    .reduce(
      (total, payment) => total + Number(payment.amount ?? 0),
      0
    );

  const paidServiceIds = new Set(
    payments
      .filter((payment) => isPaid(payment.payment_status))
      .map((payment) => payment.id)
  );

  const outstandingRevenue = services
    .filter((service) => !isPaid(service.payment_status))
    .reduce(
      (total, service) => total + Number(service.price ?? 0),
      0
    );

  const openFollowUps = followUps.filter((followUp) =>
    isOpenFollowUp(followUp.status)
  );

  const overdueFollowUps = openFollowUps.filter(
    (followUp) => followUp.due_date && followUp.due_date < today
  );

  const intakeCallsNeedingFollowUp = intakeCalls.filter(
    (call) =>
      normalize(call.status) === "follow-up needed" ||
      (call.follow_up_date &&
        call.follow_up_date <= today &&
        !call.converted_to_client)
  );

  const upcomingIntakeCalls = intakeCalls.filter(
    (call) =>
      call.call_date &&
      call.call_date >= today &&
      !call.converted_to_client
  );

  const upcomingServices = services
    .filter(
      (service) =>
        service.service_date &&
        service.service_date >= today &&
        !service.session_complete
    )
    .slice(0, 5);

  const recentClients = clients.slice(0, 5);
  const recentPayments = paidPayments.slice(0, 5);
  const visibleFollowUps = openFollowUps.slice(0, 6);

  const clientNameById = new Map(
    clients.map((client) => [
      client.id,
      client.name || "Unnamed Client",
    ])
  );

  const stats = [
    {
      label: "Paid Revenue",
      value: formatCurrency(totalPaidRevenue),
      detail: `${formatCurrency(revenueThisMonth)} received this month`,
    },
    {
      label: "Outstanding",
      value: formatCurrency(outstandingRevenue),
      detail:
        outstandingRevenue === 0
          ? "Everyone is currently paid"
          : "Payments still owed",
    },
    {
      label: "Total Clients",
      value: clients.length.toString(),
      detail: `${activeClients.length} active, ${completedClients.length} completed`,
    },
    {
      label: "Follow-Ups",
      value: openFollowUps.length.toString(),
      detail:
        overdueFollowUps.length > 0
          ? `${overdueFollowUps.length} overdue`
          : "Nothing overdue",
    },
  ];

  return (
    <section className="min-w-0 flex-1">
          <header className="border-b border-[#dfe6db] bg-[#fbfaf6] px-6 py-7 lg:px-10">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#7f9975]">
                  {getTodayLabel()}
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#243128]">
                  Welcome back, Jen
                </h2>

                <p className="mt-2 text-sm text-[#708075]">
                  Here is what is happening across JGO Hire.
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
         {databaseError ? (
  <section className="rounded-2xl border border-red-300 bg-red-50 p-6">
    <h3 className="text-lg font-bold text-red-700">
      Dashboard Error
    </h3>

    <pre className="mt-4 whitespace-pre-wrap text-sm text-red-700">
      {JSON.stringify(databaseError, null, 2)}
    </pre>
  </section>
) : null}

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

            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl border border-[#dfe6db] bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-[#243128]">
                      Follow-Ups
                    </h3>

                    <p className="mt-1 text-sm text-[#708075]">
                      Clients and intake calls that need your attention.
                    </p>
                  </div>

                  <Link
                    href="/follow-ups"
                    className="text-sm font-semibold text-[#647d5b]"
                  >
                    View All
                  </Link>
                </div>

                {visibleFollowUps.length === 0 ? (
                  <div className="mt-6 rounded-xl border border-[#e4e9df] bg-[#fbfcf9] p-6 text-center">
                    <p className="text-sm font-semibold text-[#3d4d39]">
                      No open follow-ups
                    </p>

                    <p className="mt-2 text-sm text-[#708075]">
                      New reminders will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 divide-y divide-[#edf0ea]">
                    {visibleFollowUps.map((followUp) => (
                      <div
                        key={followUp.id}
                        className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[#243128]">
                            {followUp.title || "Follow-up"}
                          </p>

                          <p className="mt-1 text-sm text-[#708075]">
                            Due {formatDate(followUp.due_date)}
                          </p>

                          {followUp.notes ? (
                            <p className="mt-1 line-clamp-2 text-xs text-[#8a968d]">
                              {followUp.notes}
                            </p>
                          ) : null}
                        </div>

                        <span
                          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${getFollowUpStyle(
                            followUp.priority
                          )}`}
                        >
                          {followUp.priority || "Normal"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[#dfe6db] bg-white p-6 shadow-sm">
                <div>
                  <h3 className="text-xl font-bold text-[#243128]">
                    Intake Calls
                  </h3>

                  <p className="mt-1 text-sm text-[#708075]">
                    Free 15 calls and prospective clients.
                  </p>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#e4e9df] bg-[#fbfcf9] p-4">
                    <p className="text-sm text-[#708075]">
                      Need Follow-Up
                    </p>

                    <p className="mt-2 text-3xl font-bold text-[#243128]">
                      {intakeCallsNeedingFollowUp.length}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#e4e9df] bg-[#fbfcf9] p-4">
                    <p className="text-sm text-[#708075]">
                      Upcoming Calls
                    </p>

                    <p className="mt-2 text-3xl font-bold text-[#243128]">
                      {upcomingIntakeCalls.length}
                    </p>
                  </div>
                </div>

                {intakeCallsNeedingFollowUp.length > 0 ? (
                  <div className="mt-5 space-y-3">
                    {intakeCallsNeedingFollowUp.slice(0, 3).map((call) => (
                      <div
                        key={call.id}
                        className="rounded-xl border border-[#e4e9df] bg-[#fbfcf9] p-4"
                      >
                        <p className="text-sm font-semibold text-[#243128]">
                          {call.name || "Unnamed Intake"}
                        </p>

                        <p className="mt-1 text-xs text-[#708075]">
                          {call.needs_help_with ||
                            call.services_discussed ||
                            "Follow-up needed"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}

                <Link
                  href="/intake-calls"
                  className="mt-5 inline-block text-sm font-semibold text-[#647d5b]"
                >
                  Open Intake Calls
                </Link>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_320px]">
              <div className="overflow-hidden rounded-2xl border border-[#dfe6db] bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-[#e4e9df] p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-[#243128]">
                      Recent Clients
                    </h3>

                    <p className="mt-1 text-sm text-[#708075]">
                      Your most recently added client profiles.
                    </p>
                  </div>

                  <Link
                    href="/clients"
                    className="text-sm font-semibold text-[#647d5b]"
                  >
                    View All Clients
                  </Link>
                </div>

                {recentClients.length === 0 ? (
                  <div className="p-10 text-center">
                    <h4 className="text-lg font-bold text-[#243128]">
                      No clients yet
                    </h4>

                    <p className="mt-2 text-sm text-[#708075]">
                      Add your first client to begin tracking their work.
                    </p>

                    <Link
                      href="/clients/new"
                      className="mt-5 inline-block rounded-xl bg-[#647d5b] px-5 py-3 text-sm font-semibold text-white"
                    >
                      + Add New Client
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] text-left">
                      <thead className="bg-[#f8faf6] text-xs uppercase tracking-wide text-[#708075]">
                        <tr>
                          <th className="px-6 py-4">Client</th>
                          <th className="px-6 py-4">Service</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Payment</th>
                          <th className="px-6 py-4">Total</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-[#edf0ea]">
                        {recentClients.map((client) => (
                          <tr
                            key={client.id}
                            className="transition hover:bg-[#fbfcf9]"
                          >
                            <td className="px-6 py-4">
                              <Link
                                href={`/clients/${client.id}`}
                                className="text-sm font-semibold text-[#243128] hover:text-[#647d5b]"
                              >
                                {client.name || "Unnamed Client"}
                              </Link>

                              <p className="mt-1 text-xs text-[#708075]">
                                {client.email || "No email added"}
                              </p>
                            </td>

                            <td className="px-6 py-4 text-sm text-[#647066]">
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
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentStyle(
                                  client.payment_status
                                )}`}
                              >
                                {client.payment_status || "Pending"}
                              </span>
                            </td>

                            <td className="px-6 py-4 text-sm font-semibold text-[#243128]">
                              {formatCurrency(Number(client.price ?? 0))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[#dfe6db] bg-[#eef2e9] p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7f9975]">
                  Quick Actions
                </p>

                <h3 className="mt-2 text-xl font-bold text-[#243128]">
                  Keep things moving
                </h3>

                <div className="mt-6 space-y-3">
                  <Link
                    href="/clients/new"
                    className="block w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#4d6247] shadow-sm hover:bg-[#f8faf6]"
                  >
                    + Add New Client
                  </Link>

                  <Link
                    href="/intake-calls/new"
                    className="block w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#4d6247] shadow-sm hover:bg-[#f8faf6]"
                  >
                    + Add Intake Call
                  </Link>

                  <Link
                    href="/follow-ups/new"
                    className="block w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#4d6247] shadow-sm hover:bg-[#f8faf6]"
                  >
                    + Add Follow-Up
                  </Link>

                  <Link
                    href="/clients"
                    className="block w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#4d6247] shadow-sm hover:bg-[#f8faf6]"
                  >
                    View All Clients
                  </Link>
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-2xl border border-[#dfe6db] bg-white p-6 shadow-sm">
                <h3 className="text-xl font-bold text-[#243128]">
                  Recent Payments
                </h3>

                <p className="mt-1 text-sm text-[#708075]">
                  Your latest paid client transactions.
                </p>

                {recentPayments.length === 0 ? (
                  <p className="mt-6 text-sm text-[#708075]">
                    No payment records yet.
                  </p>
                ) : (
                  <div className="mt-6 divide-y divide-[#edf0ea]">
                    {recentPayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between gap-4 py-4"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[#243128]">
                            {payment.client_id
                              ? clientNameById.get(payment.client_id) ||
                                "Client"
                              : "Client"}
                          </p>

                          <p className="mt-1 text-xs text-[#708075]">
                            {formatDate(payment.payment_date)}
                            {payment.payment_method
                              ? ` · ${payment.payment_method}`
                              : ""}
                          </p>
                        </div>

                        <p className="text-sm font-bold text-[#55704f]">
                          {formatCurrency(Number(payment.amount ?? 0))}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[#dfe6db] bg-white p-6 shadow-sm">
                <h3 className="text-xl font-bold text-[#243128]">
                  Daily Checklist
                </h3>

                <p className="mt-1 text-sm text-[#708075]">
                  Your recurring JGO Hire business habits.
                </p>

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

                <p className="mt-4 text-xs text-[#8a968d]">
                  Checklist saving and daily resets will be connected next.
                </p>
              </div>
            </section>

            {upcomingServices.length > 0 ? (
              <section className="rounded-2xl border border-[#dfe6db] bg-white p-6 shadow-sm">
                <h3 className="text-xl font-bold text-[#243128]">
                  Upcoming Client Work
                </h3>

                <p className="mt-1 text-sm text-[#708075]">
                  Scheduled services that have not been completed.
                </p>

                <div className="mt-6 divide-y divide-[#edf0ea]">
                  {upcomingServices.map((service) => (
                    <div
                      key={service.id}
                      className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#243128]">
                          {service.client_id
                            ? clientNameById.get(service.client_id) ||
                              "Client"
                            : "Client"}
                        </p>

                        <p className="mt-1 text-sm text-[#708075]">
                          {service.service_type || "Client Service"}
                        </p>
                      </div>

                      <span className="w-fit rounded-full bg-[#eef2e9] px-3 py-1 text-xs font-semibold text-[#5c7454]">
                        {formatDate(service.service_date)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
    </section>
  );
}