import { createClient } from "@/lib/supabase-server";
import TimerClient, { type TimerClientOption, type TimerSession } from "./TimerClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TimerPage() {
  const supabase = await createClient();

  const [clientsResult, sessionsResult] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, status")
      .neq("status", "Archived")
      .order("name", { ascending: true }),
    supabase
      .from("timer_sessions")
      .select("*")
      .order("started_at", { ascending: false }),
  ]);

  const clients: TimerClientOption[] = (clientsResult.data ?? [])
    .filter((client) => client.name)
    .map((client) => ({
      clientId: Number(client.id),
      name: String(client.name),
      source: "client",
    }));

  const sessions = (sessionsResult.data ?? []) as TimerSession[];

  const remembered = Array.from(
    new Map(
      sessions
        .filter((session) => !session.client_id && session.client_name)
        .map((session) => [
          session.client_name.trim().toLowerCase(),
          {
            clientId: null,
            name: session.client_name.trim(),
            source: "remembered" as const,
          },
        ]),
    ).values(),
  );

  return (
    <TimerClient
      options={[...clients, ...remembered]}
      initialSessions={sessions}
      initialActiveSession={sessions.find((session) => !session.ended_at) ?? null}
    />
  );
}
