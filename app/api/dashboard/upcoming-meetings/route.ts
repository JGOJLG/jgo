import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function easternWeekStartUtc(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  const year = Number(get("year")), month = Number(get("month")), day = Number(get("day")), weekday = get("weekday");
  const dayIndex: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const easternDate = new Date(Date.UTC(year, month - 1, day));
  easternDate.setUTCDate(easternDate.getUTCDate() - (dayIndex[weekday] ?? 0));
  const sy = easternDate.getUTCFullYear(), sm = easternDate.getUTCMonth() + 1, sd = easternDate.getUTCDate();
  const offsetName = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", timeZoneName: "shortOffset" }).formatToParts(new Date(Date.UTC(sy, sm - 1, sd, 12))).find((part) => part.type === "timeZoneName")?.value ?? "GMT-4";
  const match = offsetName.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  const sign = match?.[1] === "+" ? 1 : -1, hours = Number(match?.[2] ?? 4), minutes = Number(match?.[3] ?? 0);
  return new Date(Date.UTC(sy, sm - 1, sd, 0, 0) - sign * (hours * 60 + minutes) * 60_000);
}

export async function GET() {
  const supabase = await createClient();
  const nowDate = new Date();
  const nowMs = nowDate.getTime();
  const weekStartDate = easternWeekStartUtc(nowDate);
  const weekStartMs = weekStartDate.getTime();

  const { data: events, error: eventsError } = await supabase
    .from("calendar_events")
    .select("id, title, event_type, start_at, client_id, status")
    .not("client_id", "is", null)
    .not("start_at", "is", null)
    .gte("start_at", weekStartDate.toISOString())
    .order("start_at", { ascending: true })
    .limit(200);

  if (eventsError) return NextResponse.json({ error: eventsError.message }, { status: 500, headers: { "Cache-Control": "no-store" } });

  const meetings = (events ?? []).filter((event) => {
    const eventType = normalize(event.event_type), status = normalize(event.status);
    if (["cancelled", "canceled"].includes(status)) return false;
    return ["free 15", "coaching session", "appointment"].includes(eventType);
  });

  const clientIds = Array.from(new Set(meetings.map((event) => event.client_id).filter((id): id is number => typeof id === "number")));
  const clientNameById = new Map<number, string>();
  if (clientIds.length) {
    const { data: clients, error: clientsError } = await supabase.from("clients").select("id, name").in("id", clientIds);
    if (clientsError) return NextResponse.json({ error: clientsError.message }, { status: 500, headers: { "Cache-Control": "no-store" } });
    for (const client of clients ?? []) clientNameById.set(client.id, client.name || "Client");
  }

  const formatted = meetings.map((event) => {
    const startMs = new Date(event.start_at).getTime();
    return {
      id: event.id,
      clientId: event.client_id,
      clientName: typeof event.client_id === "number" ? clientNameById.get(event.client_id) || "Client" : "Client",
      title: event.title || event.event_type || "Meeting",
      startAt: event.start_at,
      startMs,
      isPast: Number.isFinite(startMs) && startMs < nowMs,
    };
  }).filter((meeting) => Number.isFinite(meeting.startMs));

  const upcoming = formatted.filter((meeting) => meeting.startMs >= nowMs).sort((a, b) => a.startMs - b.startMs);
  const past = formatted.filter((meeting) => meeting.startMs >= weekStartMs && meeting.startMs < nowMs).sort((a, b) => b.startMs - a.startMs);

  return NextResponse.json(
    { meetings: upcoming, pastMeetings: past, serverNow: nowDate.toISOString(), weekStart: weekStartDate.toISOString() },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate", Pragma: "no-cache", Expires: "0" } }
  );
}
