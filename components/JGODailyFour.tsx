"use client";

import { useEffect, useMemo, useState } from "react";

const habits = [
  { id: "linkedin-requests", label: "LinkedIn Requests", helper: "Review and respond to requests", icon: "in" },
  { id: "linkedin-post", label: "LinkedIn Post", helper: "Publish a helpful recruiter post", icon: "✎" },
  { id: "substack", label: "Substack Article", helper: "Write or work on your article", icon: "S" },
  { id: "social-media", label: "Social Media Check", helper: "Check comments, reply, post a video, or do one social action", icon: "↗" },
  { id: "survival-guide-followup", label: "Survival Guide Follow-Up", helper: "Check new signups and send follow-up emails", icon: "@" },
];

function getTodayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function JGODailyFour() {
  const [completed, setCompleted] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const today = getTodayKey();

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch(`/api/dashboard/daily-four?day=${encodeURIComponent(today)}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Unable to load Daily Do It.");
        const data = (await response.json()) as { completed?: string[] };
        if (active) setCompleted(Array.isArray(data.completed) ? data.completed : []);
      } catch (error) {
        console.error(error);
      } finally {
        if (active) setReady(true);
      }
    }

    load();
    return () => { active = false; };
  }, [today]);

  async function toggleHabit(id: string) {
    const previous = completed;
    const nextCompleted = completed.includes(id)
      ? completed.filter((habitId) => habitId !== id)
      : [...completed, id];

    setCompleted(nextCompleted);

    try {
      const response = await fetch("/api/dashboard/daily-four", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day: today, completed: nextCompleted }),
      });
      if (!response.ok) throw new Error("Unable to save Daily Do It.");
    } catch (error) {
      console.error(error);
      setCompleted(previous);
    }
  }

  const completedCount = completed.filter((id) => habits.some((habit) => habit.id === id)).length;
  const progress = useMemo(() => Math.round((completedCount / habits.length) * 100), [completedCount]);

  if (!ready) {
    return <section className="h-28 animate-pulse rounded-[28px] border border-white/75 bg-white/50 shadow-sm backdrop-blur-2xl" />;
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-white/80 bg-white/66 p-4 shadow-[0_20px_55px_rgba(71,91,66,0.11)] backdrop-blur-2xl lg:p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#dce5d7] bg-[#eef3ea] text-sm font-bold text-[#4d6247]">
              <span className="text-sm font-bold tracking-wide">JGO</span>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-[#243128]">JGO Daily Do It</p>
                <span className="rounded-full bg-[#eef2e9] px-2.5 py-1 text-[11px] font-semibold text-[#647d5b]">{completedCount} of {habits.length}</span>
              </div>
              <p className="mt-1 text-xs text-[#708075]">Small daily actions that keep JGO Hire moving.</p>
            </div>
          </div>
          <div className="flex min-w-[120px] items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e7ece3]">
              <div className="h-full rounded-full bg-[#647d5b] transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="w-9 text-right text-xs font-semibold text-[#647d5b]">{progress}%</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {habits.map((habit) => {
            const isCompleted = completed.includes(habit.id);
            return (
              <button key={habit.id} type="button" onClick={() => toggleHabit(habit.id)} aria-pressed={isCompleted}
                className={`flex min-w-0 items-center gap-3 rounded-[20px] border px-4 py-3.5 text-left transition duration-200 ${isCompleted ? "border-[#b8c9af] bg-[#dfe9da]/94 shadow-[0_10px_26px_rgba(87,111,78,0.12)]" : "border-white/85 bg-white/76 shadow-sm hover:-translate-y-0.5 hover:bg-white"}`}>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${isCompleted ? "bg-[#647d5b] text-white" : "border border-[#dfe6db] bg-[#f8faf6] text-[#647d5b]"}`}>{isCompleted ? "✓" : habit.icon}</span>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold leading-5 ${isCompleted ? "text-[#55704f] line-through" : "text-[#3d4d39]"}`}>{habit.label}</p>
                  <p className={`mt-1 text-xs leading-4 ${isCompleted ? "text-[#789070]" : "text-[#8a968d]"}`}>{isCompleted ? "Completed today" : habit.helper}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {completedCount === habits.length ? (
        <div className="mt-4 rounded-2xl border border-[#c8d7c1] bg-[#e9f1e5] px-4 py-2.5 text-center text-xs font-semibold text-[#55704f]">Daily Do It complete. Nice work keeping the momentum going.</div>
      ) : null}
    </section>
  );
}
