"use client";

import { useEffect, useMemo, useState } from "react";

const sections = [
  {
    title: "LINKEDIN",
    tasks: [
      { id: "linkedin-requests", label: "Send new connection requests" },
      { id: "linkedin-intros", label: "Send intro messages" },
      { id: "linkedin-post", label: "Write a post" },
    ],
  },
  {
    title: "SUBSTACK",
    tasks: [{ id: "substack", label: "Write an article" }],
  },
  {
    title: "SOCIAL MEDIA",
    tasks: [
      { id: "social-check", label: "Check comments & messages" },
      { id: "social-video", label: "Create a new video" },
    ],
  },
  {
    title: "INTERNAL",
    tasks: [
      { id: "survival-guide-followup", label: "Send Survival Guide follow-ups" },
      { id: "client-interview-good-luck", label: "Send client interview good lucks" },
      { id: "respond-inquiries", label: "Respond to inquiries" },
    ],
  },
];

const tasks = sections.flatMap((section) => section.tasks);

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
      ? completed.filter((taskId) => taskId !== id)
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

  const completedCount = completed.filter((id) => tasks.some((task) => task.id === id)).length;
  const progress = useMemo(() => Math.round((completedCount / tasks.length) * 100), [completedCount]);

  if (!ready) {
    return <section className="h-28 animate-pulse rounded-[28px] border border-white/75 bg-white/50 shadow-sm backdrop-blur-2xl" />;
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-white/80 bg-white/66 p-4 shadow-[0_20px_55px_rgba(71,91,66,0.11)] backdrop-blur-2xl lg:p-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#dce5d7] bg-[#eef3ea] text-sm font-bold text-[#4d6247]">JGO</div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-[#243128]">JGO Daily Do It</p>
                <span className="rounded-full bg-[#eef2e9] px-2.5 py-1 text-[11px] font-semibold text-[#647d5b]">{completedCount} of {tasks.length}</span>
              </div>
              <p className="mt-0.5 text-xs text-[#708075]">Small daily actions that keep JGO Hire moving.</p>
            </div>
          </div>
          <div className="flex min-w-[120px] items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e7ece3]">
              <div className="h-full rounded-full bg-[#647d5b] transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="w-9 text-right text-xs font-semibold text-[#647d5b]">{progress}%</p>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {sections.map((section) => (
            <div key={section.title} className="rounded-2xl border border-white/85 bg-white/72 px-3 py-2.5 shadow-sm">
              <p className="mb-1.5 text-[10px] font-bold tracking-[0.14em] text-[#647d5b]">{section.title}</p>
              <div className="space-y-0.5">
                {section.tasks.map((task) => {
                  const isCompleted = completed.includes(task.id);
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => toggleHabit(task.id)}
                      aria-pressed={isCompleted}
                      className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-left transition hover:bg-[#f4f7f1]"
                    >
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${isCompleted ? "border-[#647d5b] bg-[#647d5b] text-white" : "border-[#cdd8c8] bg-white text-transparent"}`}>✓</span>
                      <span className={`text-xs leading-4 ${isCompleted ? "text-[#789070] line-through" : "font-medium text-[#3d4d39]"}`}>{task.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {completedCount === tasks.length ? (
        <div className="mt-3 rounded-xl border border-[#c8d7c1] bg-[#e9f1e5] px-3 py-2 text-center text-xs font-semibold text-[#55704f]">Daily Do It complete. Nice work keeping the momentum going.</div>
      ) : null}
    </section>
  );
}
