"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { startTimer, stopTimer } from "./actions";

export type TimerClientOption = {
  clientId: number | null;
  name: string;
  source: "client" | "remembered";
};

export type TimerSession = {
  id: number;
  client_id: number | null;
  client_name: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  created_at: string;
};

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((value) => String(value).padStart(2, "0")).join(":");
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function timeLabel(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TimerClient({
  options,
  initialSessions,
  initialActiveSession,
}: {
  options: TimerClientOption[];
  initialSessions: TimerSession[];
  initialActiveSession: TimerSession | null;
}) {
  const [query, setQuery] = useState(initialActiveSession?.client_name ?? "");
  const [selected, setSelected] = useState<TimerClientOption | null>(null);
  const [active, setActive] = useState(initialActiveSession);
  const [sessions, setSessions] = useState(initialSessions);
  const [filterName, setFilterName] = useState("All");
  const [notice, setNotice] = useState("");
  const [toast, setToast] = useState("");
  const [now, setNow] = useState(Date.now());
  const [pending, startTransition] = useTransition();
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || active) return [];
    return options.filter((o) => o.name.toLowerCase().includes(q)).slice(0, 8);
  }, [query, options, active]);

  const names = useMemo(
    () => Array.from(new Set(sessions.map((s) => s.client_name))).sort(),
    [sessions],
  );

  const visible = useMemo(
    () =>
      filterName === "All"
        ? sessions
        : sessions.filter((s) => s.client_name === filterName),
    [sessions, filterName],
  );

  const activeSeconds = active
    ? Math.max(0, Math.floor((now - new Date(active.started_at).getTime()) / 1000))
    : 0;

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 1800);
  }

  function choose(option: TimerClientOption) {
    setSelected(option);
    setQuery(option.name);
    setNotice("");
  }

  function start() {
    const name = query.trim();
    if (!name) return setNotice("Enter a client or name first.");

    const exact =
      selected ??
      options.find((option) => option.name.toLowerCase() === name.toLowerCase()) ??
      null;

    setNotice("");
    startTransition(async () => {
      const result = await startTimer({
        clientId: exact?.clientId ?? null,
        clientName: exact?.name ?? name,
      });

      if (!result.ok || !result.session) {
        setNotice(result.error || "Could not start timer.");
        return;
      }

      const session = result.session as TimerSession;
      setActive(session);
      setSessions((current) => [
        session,
        ...current.filter((item) => item.id !== session.id),
      ]);
      setQuery(session.client_name);
      showToast("Timer started");
    });
  }

  function stop() {
    if (!active) return;

    startTransition(async () => {
      const result = await stopTimer(active.id);

      if (!result.ok || !result.session) {
        setNotice(result.error || "Could not stop timer.");
        return;
      }

      const stopped = result.session as TimerSession;
      setSessions((current) =>
        current.map((item) => (item.id === stopped.id ? stopped : item)),
      );
      setActive(null);
      setSelected(null);
      setQuery("");
      setNotice("");
      showToast("Time saved");
    });
  }

  return (
    <section className="min-h-screen bg-[#f7f8f3] text-[#243128]">
      {toast ? (
        <div className="fixed left-1/2 top-6 z-[100] -translate-x-1/2 rounded-2xl bg-[#52684b] px-6 py-4 text-sm font-bold text-white shadow-2xl">
          ✓ {toast}
        </div>
      ) : null}

      <header className="border-b border-[#dfe6db] bg-[#fbfaf6] px-6 py-7 lg:px-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8aa080]">JGO OS</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Timer</h1>
        <p className="mt-2 text-sm text-[#708075]">
          Track consulting time by client. JGO clients link to their profile, and manually entered names are remembered.
        </p>
      </header>

      <div className="mx-auto max-w-7xl space-y-7 p-6 lg:p-10">
        <section className="rounded-3xl border border-[#dfe6db] bg-white p-6 shadow-sm lg:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.12em] text-[#708075]">Client / Name</label>
              <div className="relative mt-2">
                <input
                  value={query}
                  disabled={Boolean(active)}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setSelected(null);
                  }}
                  placeholder="Start typing a client name..."
                  className="w-full rounded-2xl border border-[#d7e1d0] bg-[#fbfcf9] px-5 py-4 outline-none focus:border-[#9fb294] disabled:bg-[#f1f4ef]"
                />
                {matches.length ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-2xl border border-[#d7e1d0] bg-white shadow-xl">
                    {matches.map((option) => (
                      <button
                        key={`${option.source}-${option.clientId ?? option.name}`}
                        type="button"
                        onClick={() => choose(option)}
                        className="flex w-full items-center justify-between border-b border-[#edf0ea] px-4 py-3 text-left text-sm last:border-b-0 hover:bg-[#f7f9f5]"
                      >
                        <span className="font-semibold">{option.name}</span>
                        <span className="text-[10px] font-bold uppercase text-[#8a968d]">
                          {option.source === "client" ? "JGO Client" : "Remembered"}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-[#7b887d]">
                Not a JGO client? Just type the name and start. It will be remembered after time is saved.
              </p>
              {notice ? (
                <div className="mt-4 rounded-xl border border-[#ead4d0] bg-[#fbefed] px-4 py-3 text-sm text-[#9a554d]">
                  {notice}
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-[#dfe6db] bg-[#f8faf6] p-6 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7b887d]">
                {active ? "Running" : "Ready"}
              </p>
              <p className="mt-3 font-mono text-4xl font-bold">{formatDuration(activeSeconds)}</p>
              {active ? (
                <>
                  <p className="mt-2 truncate text-sm font-semibold text-[#647d5b]">{active.client_name}</p>
                  <button
                    onClick={stop}
                    disabled={pending}
                    className="mt-5 w-full rounded-2xl bg-[#9a554d] px-5 py-3.5 text-sm font-bold text-white disabled:opacity-60"
                  >
                    {pending ? "Stopping..." : "Stop Timer"}
                  </button>
                </>
              ) : (
                <button
                  onClick={start}
                  disabled={pending || !query.trim()}
                  className="mt-5 w-full rounded-2xl bg-[#647d5b] px-5 py-3.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  {pending ? "Starting..." : "Start Timer"}
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-[#dfe6db] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#dfe6db] bg-[#fbfaf6] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">Time History</h2>
              <p className="mt-1 text-sm text-[#708075]">Completed consulting sessions, newest first.</p>
            </div>
            <select
              value={filterName}
              onChange={(event) => setFilterName(event.target.value)}
              className="rounded-xl border border-[#d7e1d0] bg-white px-4 py-2.5 text-sm font-semibold text-[#4d6247]"
            >
              <option value="All">All Clients</option>
              {names.map((name) => <option key={name}>{name}</option>)}
            </select>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[780px]">
              <div className="grid grid-cols-[1.5fr_140px_130px_130px_130px] border-b border-[#dfe6db] bg-[#eef2ea] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[#647066]">
                <span>Client / Name</span><span>Date</span><span>Start</span><span>Stop</span><span className="text-right">Time</span>
              </div>

              {visible.map((session) => {
                const live = !session.ended_at;
                const seconds = live
                  ? Math.max(0, Math.floor((now - new Date(session.started_at).getTime()) / 1000))
                  : session.duration_seconds ?? 0;

                return (
                  <div
                    key={session.id}
                    className="grid grid-cols-[1.5fr_140px_130px_130px_130px] items-center border-b border-[#edf0ea] px-5 py-4 text-sm"
                  >
                    <div>
                      {session.client_id ? (
                        <Link href={`/clients/${session.client_id}`} className="font-bold text-[#4d6247] hover:underline">
                          {session.client_name}
                        </Link>
                      ) : (
                        <span className="font-semibold">{session.client_name}</span>
                      )}
                      {live ? <span className="ml-2 rounded-full bg-[#e7f0e4] px-2 py-1 text-[10px] font-bold uppercase text-[#4d6f46]">Running</span> : null}
                    </div>
                    <span className="text-[#708075]">{dateLabel(session.started_at)}</span>
                    <span className="text-[#708075]">{timeLabel(session.started_at)}</span>
                    <span className="text-[#708075]">{timeLabel(session.ended_at)}</span>
                    <div className="text-right">
                      <p className="font-mono font-bold">{formatDuration(seconds)}</p>
                      <p className="text-[11px] text-[#8a968d]">{live ? "Running" : `${(seconds / 3600).toFixed(2)} hrs`}</p>
                    </div>
                  </div>
                );
              })}

              {!visible.length ? <div className="px-6 py-12 text-center text-sm text-[#708075]">No timer history yet.</div> : null}
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
