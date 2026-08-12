import { createClient } from "@/lib/supabase-server";

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((value) => String(value).padStart(2, "0")).join(":");
}

export default async function ClientTimerHistory({ clientId }: { clientId: number }) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("timer_sessions")
    .select("*")
    .eq("client_id", clientId)
    .order("started_at", { ascending: false });

  const sessions = data ?? [];
  const totalSeconds = sessions
    .filter((session) => session.ended_at)
    .reduce((sum, session) => sum + Number(session.duration_seconds ?? 0), 0);

  return (
    <section className="rounded-2xl border border-[#dfe6db] bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#243128]">Time Tracked</h2>
          <p className="mt-1 text-sm text-[#708075]">Consulting timer history for this client.</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#708075]">Total</p>
          <p className="mt-1 font-mono text-lg font-bold text-[#4d6247]">{formatDuration(totalSeconds)}</p>
          <p className="text-[11px] text-[#8a968d]">{(totalSeconds / 3600).toFixed(2)} hrs</p>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {sessions.slice(0, 10).map((session) => (
          <div key={session.id} className="flex items-center justify-between gap-4 rounded-xl border border-[#edf0ea] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[#243128]">
                {new Date(session.started_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <p className="mt-0.5 text-xs text-[#708075]">
                {new Date(session.started_at).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
                {session.ended_at
                  ? ` – ${new Date(session.ended_at).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}`
                  : " – Running"}
              </p>
            </div>

            <div className="text-right">
              <p className="font-mono text-sm font-bold text-[#4d6247]">
                {session.ended_at ? formatDuration(Number(session.duration_seconds ?? 0)) : "Running"}
              </p>
              {session.ended_at ? (
                <p className="text-[11px] text-[#8a968d]">
                  {(Number(session.duration_seconds ?? 0) / 3600).toFixed(2)} hrs
                </p>
              ) : null}
            </div>
          </div>
        ))}

        {!sessions.length ? <p className="text-sm text-[#708075]">No tracked time yet.</p> : null}
      </div>
    </section>
  );
}
