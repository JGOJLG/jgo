import { createClient } from "@/lib/supabase-server";
import DashboardSchedulePortalClient from "@/components/DashboardSchedulePortalClient";

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
  const dayIndex: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

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

export default async function DashboardScheduleSwap() {
  const supabase = await createClient();
  const now = new Date();
  const nowIso = now.toISOString();
  const weekStartIso = easternWeekStartUtc(now).toISOString();
  const futureEnd = new Date(now);
  futureEnd.setDate(futureEnd.getDate() + 120);

  const { data: events } = await supabase
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

  return <DashboardSchedulePortalClient upcoming={upcoming} past={past} />;
}
