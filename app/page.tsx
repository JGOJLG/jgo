import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import JGODailyFour from "@/components/JGODailyFour";
import HeaderTimeClocks from "@/components/HeaderTimeClocks";
import InterviewCompleteButton from "@/components/InterviewCompleteButton";
import DashboardTaskCheckbox from "@/components/DashboardTaskCheckbox";
import { getRecruiterTopicOfTheDay } from "@/lib/recruiterTopics";

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
  follow_up_status: string | null;
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

type Task = {
  id: number;
  client_id: number | null;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  due_date: string | null;
  due_time: string | null;
  recurrence: string;
  completed_at: string | null;
  created_at: string;
};

type CalendarEvent = {
  id: number;
  title: string | null;
  event_type: string | null;
  start_at: string | null;
  end_at: string | null;
  client_id: number | null;
  intake_call_id: number | null;
  status: string | null;
  notes: string | null;
};


type QueryResult<T> = {
  data: T[];
  error: { message: string } | null;
};

async function safeQuery<T>(
  label: string,
  query: PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>,
  timeoutMs = 8000
): Promise<QueryResult<T>> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    const result = await Promise.race([
      Promise.resolve(query),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          reject(new Error(`${label} timed out after ${timeoutMs / 1000} seconds`));
        }, timeoutMs);
      }),
    ]);

    return {
      data: result.data ?? [],
      error: result.error,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : `Unable to load ${label}`;

    console.error(`Dashboard ${label} query failed:`, error);

    return {
      data: [],
      error: { message },
    };
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function isPaid(status: string | null | undefined) {
  return normalize(status) === "paid";
}

function isCompleted(status: string | null | undefined) {
  return ["complete", "completed", "closed", "cancelled", "canceled"].includes(
    normalize(status)
  );
}

function isLeadStatus(status: string | null | undefined) {
  return ["lead", "free 15 scheduled", "free 15 completed"].includes(
    normalize(status)
  );
}

function isActiveClientStatus(status: string | null | undefined) {
  const normalized = normalize(status);

  return (
    !isLeadStatus(status) &&
    !isCompleted(status) &&
    normalized !== "archived"
  );
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
  if (!value) return "No date added";

  const date = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatTime(value: string | null | undefined) {
  if (!value || !value.includes("T")) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  }).format(date);
}

function formatEventType(value: string | null | undefined) {
  const normalized = normalize(value);

  if (normalized === "follow_up") return "Follow-Up";
  if (normalized === "appointment") return "Appointment";
  if (normalized === "reminder") return "Reminder";

  return value || "Calendar Item";
}

function getMinutesUntil(value: string | null | undefined) {
  if (!value) return null;

  const eventTime = new Date(value).getTime();
  if (Number.isNaN(eventTime)) return null;

  return Math.round((eventTime - Date.now()) / 60000);
}

function getStartingSoonLabel(minutesUntil: number) {
  if (minutesUntil <= 0 && minutesUntil >= -15) return "Starting now";
  if (minutesUntil === 1) return "Starts in 1 minute";
  return `Starts in ${minutesUntil} minutes`;
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

  if (normalized === "revision") return "bg-[#eee8f3] text-[#6d5878]";
  if (normalized === "in progress") return "bg-[#e8eee3] text-[#4d6247]";
  if (normalized === "on hold") return "bg-[#f6ecd9] text-[#8f6d37]";
  if (isCompleted(status)) return "bg-[#e7f1e6] text-[#55704f]";
  return "bg-[#eef2e9] text-[#647066]";
}

function getPaymentStyle(status: string | null | undefined) {
  const normalized = normalize(status);
  if (normalized === "paid") return "bg-[#e7f1e6] text-[#55704f]";
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

function formatTaskTime(value: string | null | undefined) {
  if (!value) return null;

  const [hours, minutes] = value.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getTaskPriorityStyle(priority: string | null | undefined) {
  const normalized = normalize(priority);

  if (normalized === "urgent") {
    return "bg-[#f5dedd] text-[#9a4f48]";
  }

  if (normalized === "high") {
    return "bg-[#f7e7e4] text-[#9a554d]";
  }

  if (normalized === "low") {
    return "bg-[#eef2e9] text-[#647066]";
  }

  return "bg-[#f6ecd9] text-[#8f6d37]";
}

export default async function Home() {
  const supabase = await createClient();

  const calendarStart = new Date();
  calendarStart.setDate(calendarStart.getDate() - 30);

  const calendarEnd = new Date();
  calendarEnd.setDate(calendarEnd.getDate() + 120);

  const [
    clientsResult,
    intakeCallsResult,
    followUpsResult,
    servicesResult,
    tasksResult,
    calendarEventsResult,
    undatedInterviewsResult,
  ] = await Promise.all([
    safeQuery<Client>(
      "clients",
      supabase
        .from("clients")
        .select("*")
        .order("id", { ascending: false })
        .limit(150)
    ),
    safeQuery<IntakeCall>(
      "intake calls",
      supabase
        .from("intake_calls")
        .select("*")
        .order("call_date", { ascending: false })
        .limit(100)
    ),
    safeQuery<FollowUp>(
      "follow ups",
      supabase
        .from("follow_ups")
        .select("*")
        .order("due_date", { ascending: true })
        .limit(100)
    ),
    safeQuery<ClientService>(
      "client services",
      supabase
        .from("client_services")
        .select("*")
        .order("date_added", { ascending: false })
        .limit(250)
    ),
    safeQuery<Task>(
      "tasks",
      supabase
        .from("tasks")
        .select("*")
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("due_time", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(100)
    ),
    safeQuery<CalendarEvent>(
      "calendar events",
      supabase
        .from("calendar_events")
        .select(
          "id, title, event_type, start_at, end_at, client_id, intake_call_id, status, notes"
        )
        .gte("start_at", calendarStart.toISOString())
        .lte("start_at", calendarEnd.toISOString())
        .order("start_at", { ascending: true })
        .limit(150)
    ),
    safeQuery<CalendarEvent>(
      "undated interviews",
      supabase
        .from("calendar_events")
        .select(
          "id, title, event_type, start_at, end_at, client_id, intake_call_id, status, notes"
        )
        .eq("event_type", "interview")
        .is("start_at", null)
        .order("id", { ascending: false })
        .limit(50)
    ),
  ]);

  const allClients = clientsResult.data;
  const clients = allClients.filter(
    (client) => normalize(client.status) !== "archived"
  );
  const intakeCalls = intakeCallsResult.data;
  const followUps = followUpsResult.data;
  const services = servicesResult.data;
  const tasks = tasksResult.data;
  const calendarEvents = [
    ...calendarEventsResult.data,
    ...undatedInterviewsResult.data,
  ];

  const databaseErrors = {
    clients: clientsResult.error,
    intakeCalls: intakeCallsResult.error,
    followUps: followUpsResult.error,
    clientServices: servicesResult.error,
    tasks: tasksResult.error,
    calendarEvents: calendarEventsResult.error,
    undatedInterviews: undatedInterviewsResult.error,
  };

  const today = getTodayDateString();
  const monthStart = getMonthStartDateString();
  const recruiterTopic = getRecruiterTopicOfTheDay();

  const leadClients = clients.filter((client) => isLeadStatus(client.status));
  const free15Clients = clients.filter((client) =>
    ["free 15 scheduled", "free 15 completed"].includes(
      normalize(client.status)
    )
  );
  const activeClients = clients.filter((client) =>
    isActiveClientStatus(client.status)
  );
  const completedClients = clients.filter((client) =>
    isCompleted(client.status)
  );
  const paidServices = services.filter((service) =>
    isPaid(service.payment_status)
  );

  // Revenue now comes from client_services so a paid service counts
  // whether it was added during Add New Client or Add New Service.
  const totalRevenue = paidServices.reduce(
    (total, service) => total + Number(service.price ?? 0),
    0
  );

  const revenueThisMonth = paidServices
    .filter(
      (service) =>
        service.date_added &&
        service.date_added >= monthStart &&
        service.date_added <= today
    )
    .reduce((total, service) => total + Number(service.price ?? 0), 0);

  const outstandingRevenue = services
    .filter((service) => !isPaid(service.payment_status))
    .reduce((total, service) => total + Number(service.price ?? 0), 0);

  const openTasks = tasks.filter(
    (task) =>
      normalize(task.status) !== "completed" &&
      normalize(task.status) !== "cancelled" &&
      normalize(task.status) !== "canceled"
  );

  const sortedOpenTasks = [...openTasks].sort((a, b) => {
    const aOverdue = Boolean(a.due_date && a.due_date < today);
    const bOverdue = Boolean(b.due_date && b.due_date < today);

    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    const aToday = a.due_date === today;
    const bToday = b.due_date === today;

    if (aToday && !bToday) return -1;
    if (!aToday && bToday) return 1;

    return `${a.due_date || "9999-12-31"} ${a.due_time || "23:59"}`
      .localeCompare(
        `${b.due_date || "9999-12-31"} ${b.due_time || "23:59"}`
      );
  });

  const dashboardTasks = sortedOpenTasks.slice(0, 7);

  const overdueTaskCount = openTasks.filter(
    (task) => task.due_date && task.due_date < today
  ).length;

  const openFollowUps = followUps.filter((followUp) =>
    isOpenFollowUp(followUp.status)
  );

  const overdueFollowUps = openFollowUps.filter(
    (followUp) => followUp.due_date && followUp.due_date < today
  );

  const activeLeads = intakeCalls.filter((call) => !call.converted_to_client);
  const newLeads = activeLeads.filter((call) => normalize(call.status) === "new lead");
  const free15Leads = activeLeads.filter((call) =>
    ["free 15 scheduled", "free 15 completed"].includes(normalize(call.status))
  );
  const followUpLeads = activeLeads.filter((call) =>
    ["follow up needed", "follow-up needed"].includes(normalize(call.status))
  );

  const clientNameById = new Map(
    clients.map((client) => [client.id, client.name || "Unnamed Client"])
  );

  const servicesByClientId = new Map<number, ClientService[]>();

  services.forEach((service) => {
    if (!service.client_id) return;

    const existing = servicesByClientId.get(service.client_id) ?? [];
    existing.push(service);
    servicesByClientId.set(service.client_id, existing);
  });

  function getClientServiceNames(client: Client) {
    const clientServices = servicesByClientId.get(client.id) ?? [];
    const names = clientServices
      .map((service) => service.service)
      .filter((service): service is string => Boolean(service));

    if (names.length > 0) {
      return names.join(" • ");
    }

    return client.service || "Not selected";
  }

  function getClientServiceTotal(client: Client) {
    const clientServices = servicesByClientId.get(client.id) ?? [];

    if (clientServices.length > 0) {
      return clientServices.reduce(
        (total, service) => total + Number(service.price ?? 0),
        0
      );
    }

    return Number(client.price ?? 0);
  }

  function getClientPaymentStatus(client: Client) {
    const clientServices = servicesByClientId.get(client.id) ?? [];

    if (clientServices.length === 0) {
      return client.payment_status || "Open";
    }

    if (clientServices.every((service) => isPaid(service.payment_status))) {
      return "Paid";
    }

    if (
      clientServices.some(
        (service) => normalize(service.payment_status) === "invoice sent"
      )
    ) {
      return "Invoice Sent";
    }

    return "Open";
  }
  const leadNameById = new Map(
    intakeCalls.map((call) => [call.id, call.name || "Unnamed Lead"])
  );

  const activeCalendarEvents = calendarEvents.filter(
    (event) =>
      !["cancelled", "canceled", "completed", "complete"].includes(
        normalize(event.status)
      )
  );

  const nonInterviewCalendarEvents = activeCalendarEvents.filter(
    (event) => normalize(event.event_type) !== "interview"
  );

  const todayCalendarEvents = nonInterviewCalendarEvents
    .filter((event) => {
      if (!event.start_at) return false;

      const easternDate = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/New_York",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(event.start_at));

      return easternDate === today;
    })
    .sort((a, b) => (a.start_at || "").localeCompare(b.start_at || ""));

  const startingSoonEvents = todayCalendarEvents
    .map((event) => ({
      ...event,
      minutesUntil: getMinutesUntil(event.start_at),
    }))
    .filter(
      (event) =>
        event.minutesUntil !== null &&
        event.minutesUntil >= -15 &&
        event.minutesUntil <= 60
    );

  const nextCalendarEvent =
    nonInterviewCalendarEvents.find(
      (event) =>
        event.start_at && new Date(event.start_at).getTime() >= Date.now()
    ) ?? null;

  const upcomingClientInterviews = activeCalendarEvents
    .filter((event) => {
      if (normalize(event.event_type) !== "interview") {
        return false;
      }

      if (!event.start_at) {
        return true;
      }

      return new Date(event.start_at).getTime() >= Date.now();
    })
    .sort((a, b) => {
      if (!a.start_at && !b.start_at) return b.id - a.id;
      if (!a.start_at) return 1;
      if (!b.start_at) return -1;
      return a.start_at.localeCompare(b.start_at);
    })
    .slice(0, 6);

  const peopleToReachOutTo = leadClients
    .filter(
      (client) =>
        normalize(client.follow_up_status) === "needs follow-up"
    )
    .map((client) => ({
      key: `lead-client-${client.id}`,
      name: client.name || "Unnamed Lead",
      label: client.next_step || "Follow-up needed",
      date: client.due_date,
      priority: "Normal",
      href: `/clients/${client.id}`,
      overdue: Boolean(client.due_date && client.due_date < today),
    }))
    .sort((a, b) => {
      if (a.overdue && !b.overdue) return -1;
      if (!a.overdue && b.overdue) return 1;

      return (a.date || "9999-12-31").localeCompare(
        b.date || "9999-12-31"
      );
    })
    .slice(0, 7);

  const todayCalls = intakeCalls
    .filter(
      (call) =>
        call.call_date &&
        call.call_date.slice(0, 10) === today &&
        !call.converted_to_client
    )
    .sort((a, b) => (a.call_date || "").localeCompare(b.call_date || ""));

  const todayServices = services
    .filter(
      (service) =>
        service.scheduled_date &&
        service.scheduled_date.slice(0, 10) === today &&
        !isCompleted(service.status)
    )
    .sort((a, b) =>
      (a.scheduled_date || "").localeCompare(b.scheduled_date || "")
    );

  const scheduleItems = [
    ...todayCalendarEvents.map((event) => {
      const attachedName = event.client_id
        ? clientNameById.get(event.client_id)
        : event.intake_call_id
          ? leadNameById.get(event.intake_call_id)
          : null;

      return {
        key: `calendar-${event.id}`,
        name: event.title || "Calendar Item",
        detail: attachedName
          ? `${formatEventType(event.event_type)} · ${attachedName}`
          : formatEventType(event.event_type),
        date: event.start_at,
        href: `/calendar/${event.id}`,
        minutesUntil: getMinutesUntil(event.start_at),
      };
    }),
    ...todayCalls.map((call) => ({
      key: `call-${call.id}`,
      name: call.name || "Unnamed Lead",
      detail: call.call_type || "Free 15",
      date: call.call_date,
      href: `/leads/${call.id}`,
      minutesUntil: getMinutesUntil(call.call_date),
    })),
    ...todayServices.map((service) => ({
      key: `service-${service.id}`,
      name: service.client_id
        ? clientNameById.get(service.client_id) || "Client"
        : "Client",
      detail: service.service || "Client service",
      date: service.scheduled_date,
      href: service.client_id ? `/clients/${service.client_id}` : "/clients",
      minutesUntil: getMinutesUntil(service.scheduled_date),
    })),
  ].sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  const recentClients = clients.slice(0, 5);

  const priorityStats = [
    {
      label: "Leads",
      value: leadClients.length,
      detail: "Lead and Free 15 stages",
      href: "/clients?view=leads",
    },
    {
      label: "Outstanding",
      value: formatCurrency(outstandingRevenue),
      detail: "Open or invoice sent",
      href: "/revenue",
    },
    {
      label: "Active Clients",
      value: activeClients.length,
      detail: "Currently moving forward",
      href: "/clients?view=active",
    },
    {
      label: "Free 15s",
      value: free15Clients.length,
      detail: "Scheduled or completed",
      href: "/clients?view=leads",
    },
  ];

  return (
    <section className="relative min-w-0 flex-1 overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(217,229,210,0.95),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(241,226,209,0.8),_transparent_30%),linear-gradient(180deg,_#f7f8f3_0%,_#f3f5ef_100%)] before:pointer-events-none before:absolute before:left-[-120px] before:top-[220px] before:h-80 before:w-80 before:rounded-full before:bg-white/45 before:blur-3xl after:pointer-events-none after:absolute after:right-[-140px] after:top-[520px] after:h-96 after:w-96 after:rounded-full after:bg-[#dfead9]/55 after:blur-3xl">
      <header className="relative z-10 border-b border-white/70 bg-white/62 px-6 py-5 shadow-[0_12px_35px_rgba(71,91,66,0.08)] backdrop-blur-2xl lg:px-10">
        <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7f9975]">
              JGO Hire Command Center
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#243128]">
              Welcome back, Jen
            </h2>

            <p className="mt-1.5 text-sm text-[#708075]">
              Here is what needs your attention today.
            </p>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <HeaderTimeClocks />

            <Link
              href="/clients/new"
              className="inline-flex min-h-12 w-full shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-[#647d5b] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_35px_rgba(80,104,72,0.20)] transition hover:-translate-y-0.5 hover:bg-[#526b4b] sm:w-auto"
            >
              + Add Client
            </Link>
          </div>
        </div>
      </header>

      <div className="relative z-20 px-6 pt-5 lg:px-10">
        <JGODailyFour />
      </div>

      <div className="relative z-10 space-y-7 p-6 pt-5 lg:p-10 lg:pt-6">
        {Object.values(databaseErrors).some(Boolean) ? (
          <section className="rounded-2xl border border-red-300 bg-red-50 p-6">
            <h3 className="text-lg font-bold text-red-700">Dashboard Error</h3>
            <pre className="mt-4 whitespace-pre-wrap text-sm text-red-700">
              {JSON.stringify(databaseErrors, null, 2)}
            </pre>
          </section>
        ) : null}

        <section className="relative overflow-hidden rounded-[34px] border border-white/75 bg-white/48 p-3 shadow-[0_34px_100px_rgba(64,86,60,0.16)] backdrop-blur-3xl">
          <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-[#dce9d5]/75 blur-3xl" />
          <div className="pointer-events-none absolute right-[-70px] top-[-80px] h-72 w-72 rounded-full bg-[#eadff2]/70 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-110px] left-[38%] h-64 w-64 rounded-full bg-[#f3e4cf]/70 blur-3xl" />

          <div className="relative grid gap-3 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="grid gap-3">
              <section className="relative overflow-hidden rounded-[28px] border border-[#d9e8f7]/90 bg-[linear-gradient(145deg,rgba(242,248,255,0.96),rgba(250,253,255,0.88),rgba(233,243,253,0.92))] p-6 shadow-[0_22px_65px_rgba(86,125,162,0.15)] backdrop-blur-2xl lg:p-8">
                <div className="pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full bg-[#d8ebfb]/70 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 right-[-40px] h-56 w-56 rounded-full bg-white/80 blur-3xl" />

                <div className="relative flex flex-col gap-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#cfe1f2] bg-white/82 text-lg font-bold text-[#4f6f8f] shadow-[0_10px_28px_rgba(86,125,162,0.12)]">
                          JG
                        </span>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6f8eac]">
                            JGO Hire Command Center
                          </p>
                          <h3 className="mt-2 text-4xl font-bold leading-[1.05] tracking-[-0.035em] text-[#243128] lg:text-5xl">
                            Welcome back, Jen
                          </h3>
                        </div>
                      </div>

                      <p className="mt-5 max-w-xl text-sm leading-6 text-[#667989]">
                        Your clients, content ideas, interviews, and business priorities are all ready for you.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[#d5e5f4] bg-white/72 px-5 py-4 text-right shadow-[0_12px_30px_rgba(86,125,162,0.11)] backdrop-blur-xl">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f8eac]">
                        Today
                      </p>
                      <p className="mt-1 text-sm font-bold text-[#344f68]">
                        {getTodayLabel()}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-[#dbe8f4] bg-[linear-gradient(135deg,rgba(255,255,255,0.82),rgba(237,246,254,0.80))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_32px_rgba(86,125,162,0.08)]">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f8eac]">
                          Recruiter Tip of the Day
                        </p>
                        <p className="mt-2 text-xl font-bold text-[#243128]">
                          {recruiterTopic.title}
                        </p>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#647066]">
                          {recruiterTopic.prompt}
                        </p>
                        <Link
                          href="/recruiter-tips"
                          className="mt-3 inline-block text-xs font-semibold text-[#647d5b] hover:text-[#4d6247]"
                        >
                          View all →
                        </Link>
                      </div>

                      <span className="w-fit rounded-full border border-white/80 bg-white/75 px-3 py-1.5 text-xs font-semibold text-[#647d5b] shadow-sm">
                        Daily inspiration
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <Link
                href="/revenue"
                className="group block overflow-hidden rounded-[28px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,252,246,0.88),rgba(255,255,255,0.66))] p-6 shadow-[0_18px_55px_rgba(112,83,42,0.10)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:bg-white/88 lg:p-7"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff4df] text-lg shadow-sm">
                        $
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9b7a46]">
                          Needs Attention
                        </p>
                        <h3 className="mt-1 text-2xl font-bold text-[#243128]">
                          Outstanding Revenue
                        </h3>
                      </div>
                    </div>

                    <p className="mt-3 max-w-xl text-sm leading-6 text-[#708075]">
                      Open balances and invoices that have not been marked paid.
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="rounded-[22px] border border-white/85 bg-white/78 px-6 py-4 text-right shadow-[0_12px_35px_rgba(112,83,42,0.10)]">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9b7a46]">
                        Outstanding
                      </p>
                      <p className="mt-1 text-4xl font-bold tracking-tight text-[#5f4a2d]">
                        {formatCurrency(outstandingRevenue)}
                      </p>
                    </div>

                    <span className="text-sm font-semibold text-[#647d5b] transition group-hover:translate-x-1">
                      View revenue →
                    </span>
                  </div>
                </div>
              </Link>
            </div>

            <section className="relative h-full overflow-hidden rounded-[28px] border border-white/80 bg-[linear-gradient(145deg,rgba(244,241,251,0.94),rgba(255,255,255,0.70))] p-6 shadow-[0_22px_65px_rgba(92,76,126,0.14)] backdrop-blur-2xl lg:p-7">
              <div className="pointer-events-none absolute right-[-50px] top-[-50px] h-48 w-48 rounded-full bg-[#e3d8f0]/75 blur-3xl" />
              <div className="relative">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white/70 text-lg shadow-sm">
                        ★
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7b6997]">
                          Client Interviews
                        </p>
                        <h3 className="mt-1 text-3xl font-bold tracking-tight text-[#2f2938]">
                          Wish Them Luck!
                        </h3>
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-[#756c7d]">
                      Upcoming interviews for your clients.
                    </p>
                  </div>

                  <Link
                    href="/calendar?filter=interview"
                    className="w-fit rounded-full border border-white/85 bg-white/76 px-3 py-1.5 text-xs font-semibold text-[#65567f] shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
                  >
                    View calendar
                  </Link>
                </div>

                {upcomingClientInterviews.length === 0 ? (
                  <div className="mt-7 rounded-[24px] border border-dashed border-[#d7d0e5] bg-white/55 p-8 text-center">
                    <p className="text-sm font-semibold text-[#4d425c]">
                      No upcoming client interviews
                    </p>
                    <p className="mt-2 text-sm text-[#7d7386]">
                      Interviews added from a client profile will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="mt-7 grid gap-3 md:grid-cols-2">
                    {upcomingClientInterviews.map((interview) => {
                      const clientName = interview.client_id
                        ? clientNameById.get(interview.client_id) || "Client"
                        : "Client";

                      return (
                        <div
                          key={interview.id}
                          className="group rounded-[22px] border border-white/85 bg-white/72 p-4 shadow-[0_10px_30px_rgba(92,76,126,0.09)] transition hover:-translate-y-1 hover:bg-white"
                        >
                          <Link
                            href={
                              interview.client_id
                                ? `/clients/${interview.client_id}`
                                : `/calendar/${interview.id}`
                            }
                            className="block"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a78ad]">
                                  Wish them luck!
                                </p>
                                <p className="mt-2 text-base font-bold text-[#2f2938]">
                                  {clientName}
                                </p>
                              </div>

                              <span className="rounded-full bg-[#eee8f6] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#79659b]">
                                Interview
                              </span>
                            </div>

                            <p className="mt-3 text-sm text-[#6f6578]">
                              {interview.start_at
                                ? `${formatDate(interview.start_at)} · ${
                                    formatTime(interview.start_at) || "Time not added"
                                  }`
                                : "Date and time not added"}
                            </p>

                            {interview.notes ? (
                              <p className="mt-3 line-clamp-2 text-xs leading-5 text-[#81768a]">
                                {interview.notes}
                              </p>
                            ) : null}
                          </Link>

                          <div className="mt-4 border-t border-[#e9e2f1] pt-3">
                            <InterviewCompleteButton
                              eventId={interview.id}
                              compact
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>
        </section>



        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[30px] border border-white/70 bg-white/64 p-7 shadow-[0_26px_70px_rgba(71,91,66,0.14)] backdrop-blur-2xl transition hover:-translate-y-0.5 hover:bg-white/78 lg:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7f9975]">
                  Today
                </p>
                <h3 className="mt-2 text-2xl font-bold text-[#243128]">
                  Tasks
                </h3>
                <p className="mt-1 text-sm text-[#708075]">
                  Overdue tasks appear first, followed by today and upcoming work.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {overdueTaskCount > 0 ? (
                  <span className="rounded-full bg-[#f7e7e4] px-3 py-1.5 text-xs font-semibold text-[#9a554d]">
                    {overdueTaskCount} overdue
                  </span>
                ) : null}

                <Link
                  href="/tasks"
                  className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#4d6247] shadow-sm transition hover:bg-white"
                >
                  View all
                </Link>
              </div>
            </div>

            {dashboardTasks.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-[#cfd9c9] bg-white/55 p-7 text-center">
                <p className="text-sm font-semibold text-[#3d4d39]">
                  No tasks to show
                </p>
                <p className="mt-2 text-sm text-[#708075]">
                  Tasks added on the Tasks page will appear here automatically.
                </p>
                <Link
                  href="/tasks"
                  className="mt-4 inline-block rounded-xl bg-[#647d5b] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  + Add Task
                </Link>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {dashboardTasks.map((task) => {
                  const completed = normalize(task.status) === "completed";
                  const overdue =
                    !completed &&
                    Boolean(task.due_date && task.due_date < today);
                  const dueToday = !completed && task.due_date === today;
                  const clientName = task.client_id
                    ? clientNameById.get(task.client_id)
                    : null;

                  return (
                    <div
                      key={task.id}
                      className={`flex flex-col gap-3 rounded-2xl border px-4 py-4 transition hover:-translate-y-0.5 hover:bg-white sm:flex-row sm:items-center sm:justify-between ${
                        completed
                          ? "border-[#d7e1d0] bg-[#f3f5f0]/80 opacity-75"
                          : overdue
                            ? "border-[#e8c8c4] bg-[#fff8f7]/80"
                            : dueToday
                              ? "border-[#ddd4b7] bg-[#fffdf4]/80"
                              : "border-white/75 bg-white/60"
                      }`}
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <DashboardTaskCheckbox
                          taskId={task.id}
                          completed={completed}
                        />

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p
                              className={`truncate text-sm font-bold ${
                                completed
                                  ? "text-[#8a968d] line-through"
                                  : "text-[#243128]"
                              }`}
                            >
                              {task.title}
                            </p>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getTaskPriorityStyle(
                                task.priority
                              )}`}
                            >
                              {task.priority}
                            </span>
                          </div>

                          <div
                            className={`mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs ${
                              completed
                                ? "text-[#9aa59c] line-through"
                                : "text-[#708075]"
                            }`}
                          >
                            <span
                              className={
                                overdue
                                  ? "font-semibold text-[#9a554d]"
                                  : dueToday
                                    ? "font-semibold text-[#8f6d37]"
                                    : ""
                              }
                            >
                              {completed
                                ? "Completed today"
                                : overdue
                                  ? `Overdue · ${formatDate(task.due_date)}`
                                  : dueToday
                                    ? "Due today"
                                    : formatDate(task.due_date)}
                              {!completed && formatTaskTime(task.due_time)
                                ? ` at ${formatTaskTime(task.due_time)}`
                                : ""}
                            </span>

                            {clientName ? (
                              <Link
                                href={`/clients/${task.client_id}`}
                                className={`font-semibold ${
                                  completed
                                    ? "text-[#9aa59c]"
                                    : "text-[#647d5b] hover:text-[#4d6247]"
                                }`}
                              >
                                {clientName}
                              </Link>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-white/70 bg-[#eaf0e5]/72 p-6 shadow-[0_22px_60px_rgba(71,91,66,0.12)] backdrop-blur-2xl transition hover:-translate-y-0.5 hover:bg-[#eaf0e5]/88 lg:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f8966]">
                  Priority
                </p>
                <h3 className="mt-2 text-2xl font-bold text-[#243128]">
                  People to Reach Out To
                </h3>
                <p className="mt-1 text-sm text-[#637166]">
                  Leads and clients who need a response.
                </p>
              </div>
              <Link href="/follow-ups" className="shrink-0 text-sm font-semibold text-[#4d6247]">
                View all
              </Link>
            </div>

            {peopleToReachOutTo.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-[#d2ddcd] bg-white/70 p-6 text-center">
                <p className="text-sm font-semibold text-[#3d4d39]">You are all caught up</p>
                <p className="mt-2 text-sm text-[#708075]">No open outreach items right now.</p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {peopleToReachOutTo.map((person) => (
                  <Link
                    key={person.key}
                    href={person.href}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-[#d8e1d3] bg-white px-4 py-4 transition hover:border-[#bdcdb7]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#243128]">{person.name}</p>
                      <p className="mt-1 truncate text-xs text-[#708075]">{person.label}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          person.overdue
                            ? "bg-[#f7e7e4] text-[#9a554d]"
                            : getFollowUpStyle(person.priority)
                        }`}
                      >
                        {person.overdue ? "Overdue" : "Reach out"}
                      </span>
                      <span className="text-[11px] text-[#7d897f]">{formatDate(person.date)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {priorityStats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="group rounded-[24px] border border-white/70 bg-white/56 p-5 shadow-[0_18px_45px_rgba(71,91,66,0.11)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/78"
            >
              <p className="text-sm font-medium text-[#708075]">{stat.label}</p>
              <p className="mt-3 text-3xl font-bold text-[#243128]">{stat.value}</p>
              <p className="mt-3 text-xs font-semibold text-[#7f9975]">{stat.detail}</p>
            </Link>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-[28px] border border-white/70 bg-white/58 p-6 shadow-[0_22px_60px_rgba(71,91,66,0.12)] backdrop-blur-2xl transition hover:-translate-y-0.5 hover:bg-white/72">
            <h3 className="text-xl font-bold text-[#243128]">Today&apos;s Schedule</h3>
            <p className="mt-1 text-sm text-[#708075]">
              Calendar appointments, Free 15s, and client work scheduled for today.
            </p>

            {scheduleItems.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-[#cfd9c9] bg-[#fbfcf9] p-6 text-center">
                <p className="text-sm font-semibold text-[#3d4d39]">Nothing scheduled today</p>
                <p className="mt-2 text-sm text-[#708075]">Your day is currently open.</p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {scheduleItems.map((item) => {
                  const isStartingSoon =
                    item.minutesUntil !== null &&
                    item.minutesUntil >= -15 &&
                    item.minutesUntil <= 60;

                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-4 transition hover:bg-white ${
                        isStartingSoon
                          ? "border-[#d8d2b6] bg-[#f8f3df]"
                          : "border-[#e4e9df] bg-[#fbfcf9] hover:border-[#cbd8c4]"
                      }`}
                    >
                      <div className="min-w-0">
                        {isStartingSoon && item.minutesUntil !== null ? (
                          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#8a7747]">
                            {getStartingSoonLabel(item.minutesUntil)}
                          </p>
                        ) : null}
                        <p className="truncate text-sm font-bold text-[#243128]">
                          {item.name}
                        </p>
                        <p className="mt-1 truncate text-xs text-[#708075]">
                          {item.detail}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                          isStartingSoon
                            ? "bg-white text-[#7b6942]"
                            : "bg-[#eef2e9] text-[#5c7454]"
                        }`}
                      >
                        {formatTime(item.date) || "Today"}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-white/70 bg-white/58 p-6 shadow-[0_22px_60px_rgba(71,91,66,0.12)] backdrop-blur-2xl transition hover:-translate-y-0.5 hover:bg-white/72">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#243128]">Active Client Work</h3>
                <p className="mt-1 text-sm text-[#708075]">
                  The client projects currently moving forward.
                </p>
              </div>
              <Link href="/clients" className="text-sm font-semibold text-[#647d5b]">
                View all clients
              </Link>
            </div>

            {activeClients.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-[#cfd9c9] bg-[#fbfcf9] p-6 text-center">
                <p className="text-sm text-[#708075]">No active client work right now.</p>
              </div>
            ) : (
              <div className="mt-6 divide-y divide-[#edf0ea]">
                {activeClients.slice(0, 5).map((client) => (
                  <Link
                    key={client.id}
                    href={`/clients/${client.id}`}
                    className="flex flex-col gap-3 py-4 transition hover:bg-[#fbfcf9] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#243128]">
                        {client.name || "Unnamed Client"}
                      </p>
                      <p className="mt-1 truncate text-xs text-[#708075]">
                        {client.next_step || client.service || "No next step added"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(client.status)}`}>
                        {client.status || "Lead"}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentStyle(getClientPaymentStatus(client))}`}>
                        {getClientPaymentStatus(client)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/58 shadow-[0_22px_60px_rgba(71,91,66,0.12)] backdrop-blur-2xl transition hover:-translate-y-0.5 hover:bg-white/72">
            <div className="flex flex-col gap-4 border-b border-[#e4e9df] p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#243128]">Recent Clients</h3>
                <p className="mt-1 text-sm text-[#708075]">Your newest client profiles and current status.</p>
              </div>
              <Link href="/clients" className="text-sm font-semibold text-[#647d5b]">View all</Link>
            </div>

            {recentClients.length === 0 ? (
              <div className="p-10 text-center">
                <h4 className="text-lg font-bold text-[#243128]">No clients yet</h4>
                <p className="mt-2 text-sm text-[#708075]">Add your first client to begin tracking their work.</p>
                <Link href="/clients/new" className="mt-5 inline-block rounded-xl bg-[#647d5b] px-5 py-3 text-sm font-semibold text-white">
                  + Add New Client
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
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
                      <tr key={client.id} className="transition hover:bg-[#fbfcf9]">
                        <td className="px-6 py-4">
                          <Link href={`/clients/${client.id}`} className="text-sm font-semibold text-[#243128] hover:text-[#647d5b]">
                            {client.name || "Unnamed Client"}
                          </Link>
                          <p className="mt-1 text-xs text-[#708075]">{client.email || "No email added"}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#647066]">{getClientServiceNames(client)}</td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(client.status)}`}>
                            {client.status || "Lead"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentStyle(getClientPaymentStatus(client))}`}>
                            {getClientPaymentStatus(client)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-[#243128]">
                          {formatCurrency(getClientServiceTotal(client))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-white/70 bg-[#eef2e9]/76 p-6 shadow-[0_22px_60px_rgba(71,91,66,0.12)] backdrop-blur-2xl transition hover:-translate-y-0.5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7f9975]">Quick Actions</p>
            <h3 className="mt-2 text-xl font-bold text-[#243128]">Keep things moving</h3>
            <div className="mt-6 space-y-3">
              <Link href="/clients/new" className="block w-full rounded-xl bg-white/80 px-4 py-3 text-sm font-semibold text-[#4d6247] shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white">+ Add Client</Link>
              <Link href="/follow-ups/new" className="block w-full rounded-xl bg-white/80 px-4 py-3 text-sm font-semibold text-[#4d6247] shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white">+ Add Follow-Up</Link>
              <Link href="/clients?view=leads" className="block w-full rounded-xl bg-white/80 px-4 py-3 text-sm font-semibold text-[#4d6247] shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white">View Leads</Link>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/70 bg-white/58 p-6 shadow-[0_22px_60px_rgba(71,91,66,0.12)] backdrop-blur-2xl transition hover:-translate-y-0.5 hover:bg-white/72">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7f9975]">Business Overview</p>
            <h3 className="mt-2 text-xl font-bold text-[#243128]">Revenue and progress</h3>
            <p className="mt-1 text-sm text-[#708075]">
              A quieter view of the business numbers, lower on the dashboard.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Link
              href="/revenue"
              className="rounded-2xl border border-[#e4e9df] bg-[#fbfcf9] p-5 transition hover:-translate-y-0.5 hover:border-[#cbd8c4] hover:bg-white"
            >
              <p className="text-sm text-[#708075]">Total Revenue</p>
              <p className="mt-3 text-2xl font-bold text-[#243128]">{formatCurrency(totalRevenue)}</p>
              <p className="mt-2 text-xs font-semibold text-[#7f9975]">View Revenue →</p>
            </Link>
            <div className="rounded-2xl border border-[#e4e9df] bg-[#fbfcf9] p-5">
              <p className="text-sm text-[#708075]">This Month Revenue</p>
              <p className="mt-3 text-2xl font-bold text-[#243128]">{formatCurrency(revenueThisMonth)}</p>
            </div>
            <div className="rounded-2xl border border-[#e4e9df] bg-[#fbfcf9] p-5">
              <p className="text-sm text-[#708075]">Active Clients</p>
              <p className="mt-3 text-2xl font-bold text-[#243128]">{activeClients.length}</p>
            </div>
            <div className="rounded-2xl border border-[#e4e9df] bg-[#fbfcf9] p-5">
              <p className="text-sm text-[#708075]">Past Clients</p>
              <p className="mt-3 text-2xl font-bold text-[#243128]">{completedClients.length}</p>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
