import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function toIcsDate(value: string) {
  return new Date(value)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function sanitizeFilename(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "calendar-invite"
  );
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const eventId = Number(id);

  if (!Number.isInteger(eventId) || eventId <= 0) {
    return new Response("Invalid calendar event.", { status: 400 });
  }

  const supabase = await createClient();

  const { data: event, error } = await supabase
    .from("calendar_events")
    .select(
      "id, title, start_at, end_at, guest_email, notes, status, created_at"
    )
    .eq("id", eventId)
    .maybeSingle();

  if (error || !event) {
    return new Response("Calendar event not found.", { status: 404 });
  }

  const endAt =
    event.end_at ||
    new Date(new Date(event.start_at).getTime() + 60 * 60 * 1000).toISOString();

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  const uid = `jgo-calendar-${event.id}@jgohire.com`;
  const now = toIcsDate(new Date().toISOString());

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//JGO Hire//JGO OS Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${toIcsDate(event.start_at)}`,
    `DTEND:${toIcsDate(endAt)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    event.notes ? `DESCRIPTION:${escapeIcsText(event.notes)}` : null,
    `URL:${siteUrl}/calendar/${event.id}`,
    event.guest_email
      ? `ATTENDEE;CN=Guest;ROLE=REQ-PARTICIPANT:mailto:${event.guest_email}`
      : null,
    `STATUS:${event.status === "cancelled" ? "CANCELLED" : "CONFIRMED"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  const body = `${lines.join("\r\n")}\r\n`;
  const filename = `${sanitizeFilename(event.title)}.ics`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
