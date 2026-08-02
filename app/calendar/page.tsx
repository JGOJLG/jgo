import Link from "next/link";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Client = {
  id: number;
  name: string | null;
};

type IntakeCall = {
  id: number;
  name: string | null;
  call_date: string | null;
  call_type: string | null;
  status: string | null;
  converted_to_client: boolean | null;
};

type ClientService = {
  id: number;
  client_id: number | null;
  service: string | null;
  scheduled_date: string | null;
  status: string | null;
};

type FollowUp = {
  id: number;
  client_id: number | null;
  intake_call_id: number | null;
  title: string | null;
  due_date: string | null;
  status: string | null;
  priority: string | null;
};

type StoredCalendarEvent = {
  id: number;
  title: string | null;
  event_type: string | null;
  start_at: string | null;
  end_at: string | null;
  client_id: number | null;
  status: string | null;
  notes: string | null;
};

type CalendarEvent = {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  time: string | null;
  category: "free15" | "client" | "followup" | "interview";
  href: string;
  priority?: string | null;
};

type CalendarPageProps = {
  searchParams?: Promise<{
    month?: string;
    filter?: string;
  }>;
};

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function isOpenFollowUp(status: string | null | undefined) {
  return !["completed", "complete", "closed", "cancelled", "canceled"].includes(
    normalize(status)
  );
}

function toDateKey(value: string | null | undefined) {
  if (!value) return null;
  return value.slice(0, 10);
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

function formatLongDate(value: string) {
  const date = new Date(`${value}T12:00:00`);

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatShortDate(value: string) {
  const date = new Date(`${value}T12:00:00`);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function getTodayDateString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getCurrentMonthString() {
  return getTodayDateString().slice(0, 7);
}

function parseMonth(value: string | undefined) {
  const fallback = getCurrentMonthString();

  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    return fallback;
  }

  const [year, month] = value.split("-").map(Number);

  if (month < 1 || month > 12 || year < 2000 || year > 2100) {
    return fallback;
  }

  return value;
}

function shiftMonth(monthValue: string, amount: number) {
  const [year, month] = monthValue.split("-").map(Number);
  const date = new Date(year, month - 1 + amount, 1);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(monthValue: string) {
  const [year, month] = monthValue.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

function getMonthDays(monthValue: string) {
  const [year, month] = monthValue.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startOffset = firstDay.getDay();

  const days: Array<{
    date: string | null;
    dayNumber: number | null;
  }> = [];

  for (let index = 0; index < startOffset; index += 1) {
    days.push({ date: null, dayNumber: null });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push({
      date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      dayNumber: day,
    });
  }

  while (days.length % 7 !== 0) {
    days.push({ date: null, dayNumber: null });
  }

  return days;
}

function getCategoryStyles(category: CalendarEvent["category"]) {
  if (category === "free15") {
    return {
      card: "border-[#d7e2ed] bg-[#f1f6fa] text-[#506779]",
      dot: "bg-[#7893a8]",
      label: "Free 15",
    };
  }

  if (category === "followup") {
    return {
      card: "border-[#eadfc8] bg-[#faf5e9] text-[#826b3f]",
      dot: "bg-[#b99a5b]",
      label: "Follow-Up",
    };
  }

  if (category === "interview") {
    return {
      card: "border-[#dcd8ef] bg-[#f4f1fb] text-[#65567f]",
      dot: "bg-[#8a78ad]",
      label: "Client Interview",
    };
  }

  return {
    card: "border-[#d7e1d0] bg-[#eef3ea] text-[#4f6749]",
    dot: "bg-[#6f8966]",
    label: "Client Session",
  };
}

function buildCalendarHref(month: string, filter: string) {
  const params = new URLSearchParams();
  params.set("month", month);

  if (filter !== "all") {
    params.set("filter", filter);
  }

  return `/calendar?${params.toString()}`;
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = (await searchParams) ?? {};
  const month = parseMonth(params.month);
  const selectedFilter = [
    "all",
    "free15",
    "client",
    "followup",
    "interview",
  ].includes(params.filter ?? "")
    ? params.filter ?? "all"
    : "all";

  const monthStart = `${month}-01`;
  const [year, monthNumber] = month.split("-").map(Number);
  const monthEnd = `${month}-${String(
    new Date(year, monthNumber, 0).getDate()
  ).padStart(2, "0")}`;

  const supabase = await createClient();

  const [
    clientsResult,
    callsResult,
    servicesResult,
    followUpsResult,
    calendarEventsResult,
  ] = await Promise.all([
      supabase.from("clients").select("id, name"),
      supabase
        .from("intake_calls")
        .select("id, name, call_date, call_type, status, converted_to_client")
        .gte("call_date", `${monthStart}T00:00:00`)
        .lte("call_date", `${monthEnd}T23:59:59`)
        .order("call_date", { ascending: true }),
      supabase
        .from("client_services")
        .select("id, client_id, service, scheduled_date, status")
        .gte("scheduled_date", monthStart)
        .lte("scheduled_date", monthEnd)
        .order("scheduled_date", { ascending: true }),
      supabase
        .from("follow_ups")
        .select(
          "id, client_id, intake_call_id, title, due_date, status, priority"
        )
        .gte("due_date", monthStart)
        .lte("due_date", monthEnd)
        .order("due_date", { ascending: true }),
      supabase
        .from("calendar_events")
        .select(
          "id, title, event_type, start_at, end_at, client_id, status, notes"
        )
        .gte("start_at", `${monthStart}T00:00:00`)
        .lte("start_at", `${monthEnd}T23:59:59`)
        .order("start_at", { ascending: true }),
    ]);

  const clients = (clientsResult.data ?? []) as Client[];
  const calls = (callsResult.data ?? []) as IntakeCall[];
  const services = (servicesResult.data ?? []) as ClientService[];
  const followUps = (followUpsResult.data ?? []) as FollowUp[];
  const storedCalendarEvents = (calendarEventsResult.data ?? []) as StoredCalendarEvent[];

  const databaseErrors = {
    clients: clientsResult.error,
    intakeCalls: callsResult.error,
    clientServices: servicesResult.error,
    followUps: followUpsResult.error,
    calendarEvents: calendarEventsResult.error,
  };

  const clientNameById = new Map(
    clients.map((client) => [client.id, client.name || "Unnamed Client"])
  );

  const leadNameById = new Map(
    calls.map((call) => [call.id, call.name || "Unnamed Lead"])
  );

  const events: CalendarEvent[] = [
    ...calls
      .filter((call) => Boolean(call.call_date))
      .map((call) => ({
        id: `call-${call.id}`,
        title: call.name || "Unnamed Lead",
        subtitle: call.call_type || "Free 15",
        date: toDateKey(call.call_date) || monthStart,
        time: formatTime(call.call_date),
        category: "free15" as const,
        href: `/leads/${call.id}`,
      })),
    ...services
      .filter((service) => Boolean(service.scheduled_date))
      .map((service) => ({
        id: `service-${service.id}`,
        title: service.client_id
          ? clientNameById.get(service.client_id) || "Client"
          : "Client",
        subtitle: service.service || "Client session",
        date: toDateKey(service.scheduled_date) || monthStart,
        time: null,
        category: "client" as const,
        href: service.client_id
          ? `/clients/${service.client_id}`
          : "/clients",
      })),
    ...storedCalendarEvents
      .filter(
        (event) =>
          Boolean(event.start_at) &&
          !["cancelled", "canceled"].includes(normalize(event.status))
      )
      .map((event) => {
        const isInterview = normalize(event.event_type) === "interview";

        return {
          id: `calendar-${event.id}`,
          title: event.client_id
            ? clientNameById.get(event.client_id) || event.title || "Client"
            : event.title || "Calendar Item",
          subtitle: isInterview
            ? event.title || "Client Interview"
            : event.title || "Calendar Item",
          date: toDateKey(event.start_at) || monthStart,
          time: formatTime(event.start_at),
          category: isInterview ? ("interview" as const) : ("client" as const),
          href: event.client_id
            ? `/clients/${event.client_id}`
            : `/calendar/${event.id}`,
        };
      }),
    ...followUps
      .filter(
        (followUp) =>
          Boolean(followUp.due_date) && isOpenFollowUp(followUp.status)
      )
      .map((followUp) => ({
        id: `follow-up-${followUp.id}`,
        title: followUp.client_id
          ? clientNameById.get(followUp.client_id) || "Client"
          : followUp.intake_call_id
            ? leadNameById.get(followUp.intake_call_id) || "Lead"
            : followUp.title || "Follow-Up",
        subtitle: followUp.title || "Follow-Up",
        date: toDateKey(followUp.due_date) || monthStart,
        time: formatTime(followUp.due_date),
        category: "followup" as const,
        href: followUp.client_id
          ? `/clients/${followUp.client_id}`
          : followUp.intake_call_id
            ? `/leads/${followUp.intake_call_id}`
            : "/follow-ups",
        priority: followUp.priority,
      })),
  ].sort((a, b) => {
    const dateComparison = a.date.localeCompare(b.date);
    if (dateComparison !== 0) return dateComparison;
    return (a.time || "23:59").localeCompare(b.time || "23:59");
  });

  const filteredEvents =
    selectedFilter === "all"
      ? events
      : events.filter((event) => event.category === selectedFilter);

  const eventsByDate = new Map<string, CalendarEvent[]>();

  for (const event of filteredEvents) {
    const existing = eventsByDate.get(event.date) ?? [];
    existing.push(event);
    eventsByDate.set(event.date, existing);
  }

  const today = getTodayDateString();
  const todayEvents = filteredEvents.filter((event) => event.date === today);
  const upcomingEvents = filteredEvents
    .filter((event) => event.date > today)
    .slice(0, 6);

  const weekEndDate = new Date(`${today}T12:00:00`);
  weekEndDate.setDate(weekEndDate.getDate() + 7);
  const weekEnd = weekEndDate.toISOString().slice(0, 10);

  const thisWeekEvents = events.filter(
    (event) => event.date >= today && event.date <= weekEnd
  );

  const free15Count = events.filter(
    (event) => event.category === "free15"
  ).length;
  const clientSessionCount = events.filter(
    (event) => event.category === "client"
  ).length;
  const followUpCount = events.filter(
    (event) => event.category === "followup"
  ).length;
  const interviewCount = events.filter(
    (event) => event.category === "interview"
  ).length;

  const monthDays = getMonthDays(month);
  const previousMonth = shiftMonth(month, -1);
  const nextMonth = shiftMonth(month, 1);

  const filters = [
    { label: "All", value: "all" },
    { label: "Clients", value: "client" },
    { label: "Interviews", value: "interview" },
    { label: "Free 15s", value: "free15" },
    { label: "Follow-Ups", value: "followup" },
  ];

  return (
    <section className="min-w-0 flex-1 bg-[#f6f5ef]">
      <header className="border-b border-[#dfe6db] bg-[#fbfaf6] px-6 py-7 lg:px-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#7f9975]">
              {formatLongDate(today)}
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#243128]">
              Calendar
            </h2>
            <p className="mt-2 text-sm text-[#708075]">
              Your Free 15s, client sessions, and follow-ups in one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-xl border border-[#cbd8c4] bg-white px-5 py-3 text-sm font-semibold text-[#4d6247] shadow-sm transition hover:bg-[#f5f7f2]"
            >
              Back to Dashboard
            </Link>
            <Link
              href="/calendar/new"
              className="rounded-xl bg-[#647d5b] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4d6247]"
            >
              + Add Calendar Item
            </Link>
          </div>
        </div>
      </header>

      <div className="space-y-7 p-6 lg:p-10">
        {Object.values(databaseErrors).some(Boolean) ? (
          <section className="rounded-2xl border border-red-300 bg-red-50 p-6">
            <h3 className="text-lg font-bold text-red-700">Calendar Error</h3>
            <pre className="mt-4 whitespace-pre-wrap text-sm text-red-700">
              {JSON.stringify(databaseErrors, null, 2)}
            </pre>
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {[
            {
              label: "Today",
              value: todayEvents.length,
              detail: "Items on your agenda",
            },
            {
              label: "Next 7 Days",
              value: thisWeekEvents.length,
              detail: "Upcoming schedule",
            },
            {
              label: "Free 15s",
              value: free15Count,
              detail: "This month",
            },
            {
              label: "Client Sessions",
              value: clientSessionCount,
              detail: "This month",
            },
            {
              label: "Client Interviews",
              value: interviewCount,
              detail: "Wish them luck!",
            },
            {
              label: "Follow-Ups",
              value: followUpCount,
              detail: "Open this month",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-medium text-[#708075]">{stat.label}</p>
              <p className="mt-3 text-3xl font-bold text-[#243128]">
                {stat.value}
              </p>
              <p className="mt-3 text-xs font-semibold text-[#7f9975]">
                {stat.detail}
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="overflow-hidden rounded-3xl border border-[#dfe6db] bg-white shadow-sm">
            <div className="flex flex-col gap-5 border-b border-[#e4e9df] p-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <Link
                  href={buildCalendarHref(previousMonth, selectedFilter)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dfe6db] bg-white text-lg font-semibold text-[#4d6247] transition hover:bg-[#f5f7f2]"
                  aria-label="Previous month"
                >
                  ‹
                </Link>

                <h3 className="min-w-[190px] text-center text-xl font-bold text-[#243128]">
                  {getMonthLabel(month)}
                </h3>

                <Link
                  href={buildCalendarHref(nextMonth, selectedFilter)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dfe6db] bg-white text-lg font-semibold text-[#4d6247] transition hover:bg-[#f5f7f2]"
                  aria-label="Next month"
                >
                  ›
                </Link>

                {month !== getCurrentMonthString() ? (
                  <Link
                    href={buildCalendarHref(
                      getCurrentMonthString(),
                      selectedFilter
                    )}
                    className="ml-1 text-sm font-semibold text-[#647d5b]"
                  >
                    Today
                  </Link>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => {
                  const active = selectedFilter === filter.value;

                  return (
                    <Link
                      key={filter.value}
                      href={buildCalendarHref(month, filter.value)}
                      className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                        active
                          ? "bg-[#647d5b] text-white"
                          : "border border-[#dfe6db] bg-[#fbfcf9] text-[#647066] hover:bg-white"
                      }`}
                    >
                      {filter.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-[#e4e9df] bg-[#f8faf6]">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                (day) => (
                  <div
                    key={day}
                    className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[#708075]"
                  >
                    {day}
                  </div>
                )
              )}
            </div>

            <div className="grid grid-cols-7">
              {monthDays.map((day, index) => {
                if (!day.date || !day.dayNumber) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="min-h-[128px] border-b border-r border-[#edf0ea] bg-[#fafbf8]"
                    />
                  );
                }

                const dayEvents = eventsByDate.get(day.date) ?? [];
                const isToday = day.date === today;

                return (
                  <div
                    key={day.date}
                    className={`min-h-[128px] border-b border-r border-[#edf0ea] p-2 ${
                      isToday ? "bg-[#f4f8f1]" : "bg-white"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          isToday
                            ? "bg-[#647d5b] text-white"
                            : "text-[#506057]"
                        }`}
                      >
                        {day.dayNumber}
                      </span>

                      {dayEvents.length > 0 ? (
                        <span className="text-[10px] font-semibold text-[#9aa49c]">
                          {dayEvents.length}
                        </span>
                      ) : null}
                    </div>

                    <div className="space-y-1.5">
                      {dayEvents.slice(0, 3).map((event) => {
                        const styles = getCategoryStyles(event.category);

                        return (
                          <Link
                            key={event.id}
                            href={event.href}
                            className={`block rounded-lg border px-2 py-1.5 transition hover:brightness-[0.98] ${styles.card}`}
                          >
                            <p className="truncate text-[11px] font-bold">
                              {event.time ? `${event.time} ` : ""}
                              {event.title}
                            </p>
                            <p className="mt-0.5 truncate text-[10px] opacity-80">
                              {event.subtitle}
                            </p>
                          </Link>
                        );
                      })}

                      {dayEvents.length > 3 ? (
                        <p className="px-1 text-[10px] font-semibold text-[#7f9975]">
                          +{dayEvents.length - 3} more
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-[#dce4d7] bg-[#eaf0e5] p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f8966]">
                Today
              </p>
              <h3 className="mt-2 text-xl font-bold text-[#243128]">
                Today&apos;s Agenda
              </h3>
              <p className="mt-1 text-sm text-[#637166]">
                {formatShortDate(today)}
              </p>

              {todayEvents.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-[#d2ddcd] bg-white/75 p-5 text-center">
                  <p className="text-sm font-semibold text-[#3d4d39]">
                    Your day is open
                  </p>
                  <p className="mt-2 text-sm text-[#708075]">
                    Nothing is scheduled for today.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {todayEvents.map((event) => {
                    const styles = getCategoryStyles(event.category);

                    return (
                      <Link
                        key={event.id}
                        href={event.href}
                        className="block rounded-2xl border border-[#d8e1d3] bg-white p-4 transition hover:border-[#bdcdb7]"
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${styles.dot}`}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#7d897f]">
                              {event.time || "Any time"}
                            </p>
                            <p className="mt-1 truncate text-sm font-bold text-[#243128]">
                              {event.title}
                            </p>
                            <p className="mt-1 truncate text-xs text-[#708075]">
                              {event.subtitle}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-[#dfe6db] bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold text-[#243128]">Coming Up</h3>
              <p className="mt-1 text-sm text-[#708075]">
                Your next scheduled items.
              </p>

              {upcomingEvents.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-[#cfd9c9] bg-[#fbfcf9] p-5 text-center">
                  <p className="text-sm text-[#708075]">
                    Nothing else is scheduled this month.
                  </p>
                </div>
              ) : (
                <div className="mt-5 divide-y divide-[#edf0ea]">
                  {upcomingEvents.map((event) => {
                    const styles = getCategoryStyles(event.category);

                    return (
                      <Link
                        key={event.id}
                        href={event.href}
                        className="flex gap-3 py-4 transition hover:bg-[#fbfcf9]"
                      >
                        <span
                          className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${styles.dot}`}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#7f9975]">
                            {formatShortDate(event.date)}
                            {event.time ? ` at ${event.time}` : ""}
                          </p>
                          <p className="mt-1 truncate text-sm font-bold text-[#243128]">
                            {event.title}
                          </p>
                          <p className="mt-1 truncate text-xs text-[#708075]">
                            {event.subtitle}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-[#dfe6db] bg-[#eef2e9] p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7f9975]">
                Calendar Key
              </p>

              <div className="mt-4 space-y-3">
                {(["client", "interview", "free15", "followup"] as const).map(
                  (category) => {
                    const styles = getCategoryStyles(category);

                    return (
                      <div
                        key={category}
                        className="flex items-center gap-3 text-sm font-semibold text-[#4d6247]"
                      >
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${styles.dot}`}
                        />
                        {styles.label}
                      </div>
                    );
                  }
                )}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </section>
  );
}
