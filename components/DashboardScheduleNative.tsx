import Link from "next/link";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type RawMeeting = {
  id: number;
  title: string | null;
  event_type: string | null;
  start_at: string;
  client_id: number | null;
  status: string | null;
};

type Meeting = {
  id: number;
  clientId: number;
  clientName: string;
  title: string;
  startAt: string;
};

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function isMeeting(event: RawMeeting) {
  const eventType = normalize(event.event_type);
  const status = normalize(event.status);
  if (["cancelled", "canceled"].includes(status)) return false;
  return ["free 15", "coaching session", "appointment"].includes(eventType);
}

function easternWeekStartUtc(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(now);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  const year = Number(get("year"));
  const month = Number(get("month"));
  const day = Number(get("day"));
  const weekday = get("weekday");
  const dayIndex: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const easternDate = new Date(Date.UTC(year, month - 1, day));
  easternDate.setUTCDate(easternDate.getUTCDate() - (dayIndex[weekday] ?? 0));

  const sy = easternDate.getUTCFullYear();
  const sm = easternDate.getUTCMonth() + 1;
  const sd = easternDate.getUTCDate();
  const offsetName =
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      timeZoneName: "shortOffset",
    })
      .formatToParts(new Date(Date.UTC(sy, sm - 1, sd, 12)))
      .find((part) => part.type === "timeZoneName")?.value ?? "GMT-4";
  const match = offsetName.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  const sign = match?.[1] === "+" ? 1 : -1;
  const hours = Number(match?.[2] ?? 4);
  const minutes = Number(match?.[3] ?? 0);
  const offsetMinutes = sign * (hours * 60 + minutes);

  return new Date(Date.UTC(sy, sm - 1, sd, 0, 0) - offsetMinutes * 60_000);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  }).format(new Date(value));
}

function MeetingRow({ meeting, past = false }: { meeting: Meeting; past?: boolean }) {
  return (
    <Link
      href={`/clients/${meeting.clientId}`}
      className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-4 transition hover:border-[#bdcdb7] ${
        past ? "border-[#dfe5dc] bg-white/60" : "border-[#d8e1d3] bg-white"
      }`}
    >
      <div className="min-w-0">
        <p className={`truncate text-sm font-bold ${past ? "text-[#566259]" : "text-[#243128]"}`}>
          {meeting.clientName}
        </p>
        <p className="mt-1 truncate text-xs text-[#708075]">{meeting.title}</p>
      </div>
      <div className="shrink-0 text-right">
        <span
          className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            past ? "bg-[#f0f2ee] text-[#7a857c]" : "bg-[#eef2e9] text-[#5c7454]"
          }`}
        >
          {formatTime(meeting.startAt)}
        </span>
        <p className="mt-1 text-[11px] text-[#7d897f]">{formatDate(meeting.startAt)}</p>
      </div>
    </Link>
  );
}

export default async function DashboardScheduleNative() {
  const supabase = await createClient();
  const now = new Date();
  const nowIso = now.toISOString();
  const weekStartIso = easternWeekStartUtc(now).toISOString();
  const futureEnd = new Date(now);
  futureEnd.setDate(futureEnd.getDate() + 120);

  const { data: events, error } = await supabase
    .from("calendar_events")
    .select("id,title,event_type,start_at,client_id,status")
    .not("client_id", "is", null)
    .not("start_at", "is", null)
    .gte("start_at", weekStartIso)
    .lte("start_at", futureEnd.toISOString())
    .order("start_at", { ascending: true })
    .limit(200);

  const filtered = ((events ?? []) as RawMeeting[]).filter(isMeeting);
  const clientIds = Array.from(
    new Set(
      filtered
        .map((event) => event.client_id)
        .filter((id): id is number => typeof id === "number")
    )
  );

  const clientNameById = new Map<number, string>();
  if (clientIds.length) {
    const { data: clients } = await supabase.from("clients").select("id,name").in("id", clientIds);
    for (const client of clients ?? []) clientNameById.set(client.id, client.name || "Client");
  }

  const meetings: Meeting[] = filtered.map((event) => ({
    id: event.id,
    clientId: event.client_id as number,
    clientName: clientNameById.get(event.client_id as number) || "Client",
    title: event.title || event.event_type || "Meeting",
    startAt: event.start_at,
  }));

  const upcoming = meetings.filter((meeting) => meeting.startAt >= nowIso);
  const past = meetings
    .filter((meeting) => meeting.startAt >= weekStartIso && meeting.startAt < nowIso)
    .sort((a, b) => b.startAt.localeCompare(a.startAt));

  return (
    <section className="mt-5 rounded-3xl border border-[#d8e1d3] bg-[#eef4ea]/85 p-4 shadow-[0_12px_35px_rgba(71,91,66,0.08)] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f8966]">Schedule</p>
          <h3 className="mt-2 text-2xl font-bold text-[#243128]">Upcoming Meetings</h3>
          <p className="mt-1 text-sm text-[#637166]">Free 15s and coaching sessions coming up.</p>
        </div>
        <Link href="/calendar" className="text-sm font-semibold text-[#4d6247]">
          View calendar
        </Link>
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-[#d2ddcd] bg-white/70 p-5 text-sm text-[#708075]">
          Unable to load meetings right now.
        </div>
      ) : (
        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <div>
            <div className="space-y-3">
              {upcoming.length ? (
                upcoming.map((meeting) => <MeetingRow key={meeting.id} meeting={meeting} />)
              ) : (
                <div className="rounded-2xl border border-[#d2ddcd] bg-white/70 p-5 text-center text-sm font-semibold text-[#3d4d39]">
                  No upcoming meetings
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-[#cfd9c9] pt-5 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7d897f]">This Week</p>
                <h4 className="mt-1 text-lg font-bold text-[#344239]">Past Meetings</h4>
              </div>
              <span className="text-xs text-[#7d897f]">Resets Sunday</span>
            </div>
            <div className="mt-4 max-h-[320px] space-y-3 overflow-y-auto pr-1">
              {past.length ? (
                past.map((meeting) => <MeetingRow key={meeting.id} meeting={meeting} past />)
              ) : (
                <p className="rounded-2xl border border-dashed border-[#d2ddcd] bg-white/45 p-4 text-center text-sm text-[#708075]">
                  No past meetings yet this week.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
