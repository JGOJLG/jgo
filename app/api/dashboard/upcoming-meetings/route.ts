import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function easternWeekStartUtc(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  const year = Number(get("year"));
  const month = Number(get("month"));
  const day = Number(get("day"));
  const weekday = get("weekday");
  const dayIndex: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const easternDate = new Date(Date.UTC(year, month - 1, day));
  easternDate.setUTCDate(easternDate.getUTCDate() - (dayIndex[weekday] ?? 0));
  const sundayYear = easternDate.getUTCFullYear();
  const sundayMonth = easternDate.getUTCMonth() + 1;
  const sundayDay = easternDate.getUTCDate();
  const offsetName = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    timeZoneName: "shortOffset",
  }).formatToParts(new Date(Date.UTC(sundayYear, sundayMonth - 1, sundayDay, 12)))
    .find((part) => part.type === "timeZoneName")?.value ?? "GMT-4";
  const match = offsetName.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  const sign = match?.[1] === "+" ? 1 : -1;
  const hours = Number(match?.[2] ?? 4);
  const minutes = Number(match?.[3] ?? 0);
  const offsetMinutes = sign * (hours * 60 + minutes);
  return new Date(Date.UTC(sundayYear, sundayMonth - 1, sundayDay, 0, 0) - offsetMinutes * 60_000);
}

export async function GET() {
  const supabase = await createClient();
  const nowDate = new Date();
  const now = nowDate.toISOString();
  const weekStart = easternWeekStartUtc(nowDate).toISOString();

  const { data: events, error: eventsError } = await supabase
    .from("calendar_events")
    .select("id, title, event_type, start_at, client_id, status")
    .not("client_id", "is", null)
    .not("start_at", "is", null)
    .gte("start_at", weekStart)
    .order("start_at", { ascending: true })
    .limit(200);

  if (eventsError) {
    return NextResponse.json({ error: eventsError.message }, { status: 500 });
  }

  const meetings = (events ?? []).filter((event) => {
    const eventType = normalize(event.event_type);
    const status = normalize(event.status);
    if (["cancelled", "canceled"].includes(status)) return false;
    return ["free 15", "coaching session", "appointment"].includes(eventType);
  });

  const clientIds = Array.from(new Set(meetings.map((event) => event.client_id).filter((id): id is number => typeof id === "number")));
  const clientNameById = new Map<number, string>();

  if (clientIds.length > 0) {
    const { data: clients, error: clientsError } = await supabase.from("clients").select("id, name").in("id", clientIds);
    if (clientsError) return NextResponse.json({ error: clientsError.message }, { status: 500 });
    for (const client of clients ?? []) clientNameById.set(client.id, client.name || "Client");
  }

  const formatted = meetings.map((event) => ({
    id: event.id,
    clientId: event.client_id,
    clientName: typeof event.client_id === "number" ? clientNameById.get(event.client_id) || "Client" : "Client",
    title: event.title || event.event_type || "Meeting",
    startAt: event.start_at,
  }));

  return NextResponse.json({
    meetings: formatted.filter((meeting) => meeting.startAt >= now),
    pastMeetings: formatted.filter((meeting) => meeting.startAt >= weekStart && meeting.startAt < now).sort((a, b) => b.startAt.localeCompare(a.startAt)),
  });
}
