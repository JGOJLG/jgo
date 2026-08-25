import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

export async function GET() {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: events, error: eventsError } = await supabase
    .from("calendar_events")
    .select("id, title, event_type, start_at, client_id, status")
    .not("client_id", "is", null)
    .not("start_at", "is", null)
    .gte("start_at", now)
    .order("start_at", { ascending: true })
    .limit(50);

  if (eventsError) {
    return NextResponse.json(
      { error: eventsError.message },
      { status: 500 }
    );
  }

  const meetings = (events ?? [])
    .filter((event) => {
      const eventType = normalize(event.event_type);
      const status = normalize(event.status);

      if (["cancelled", "canceled", "completed", "complete"].includes(status)) {
        return false;
      }

      return ["free 15", "coaching session", "appointment"].includes(eventType);
    })
    .slice(0, 7);

  const clientIds = Array.from(
    new Set(
      meetings
        .map((event) => event.client_id)
        .filter((id): id is number => typeof id === "number")
    )
  );

  const clientNameById = new Map<number, string>();

  if (clientIds.length > 0) {
    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("id, name")
      .in("id", clientIds);

    if (clientsError) {
      return NextResponse.json(
        { error: clientsError.message },
        { status: 500 }
      );
    }

    for (const client of clients ?? []) {
      clientNameById.set(client.id, client.name || "Client");
    }
  }

  return NextResponse.json({
    meetings: meetings.map((event) => ({
      id: event.id,
      clientId: event.client_id,
      clientName:
        typeof event.client_id === "number"
          ? clientNameById.get(event.client_id) || "Client"
          : "Client",
      title: event.title || event.event_type || "Meeting",
      startAt: event.start_at,
    })),
  });
}
