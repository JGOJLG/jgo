"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

type Meeting = {
  id: number;
  clientId: number;
  clientName: string;
  title: string;
  startAt: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  }).format(new Date(value));
}

function MeetingRow({ meeting, past = false }: { meeting: Meeting; past?: boolean }) {
  return (
    <Link
      href={`/clients/${meeting.clientId}`}
      className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-4 transition hover:border-[#bdcdb7] ${
        past ? "border-[#dfe5dc] bg-white/60" : "border-[#d8e1d3] bg-white"
      }`}
    >
      <div className="min-w-0">
        <p className={`truncate text-sm font-bold ${past ? "text-[#566259]" : "text-[#243128]"}`}>
          {meeting.clientName}
        </p>
        <p className="mt-1 truncate text-xs text-[#708075]">{meeting.title}</p>
      </div>
      <div className="shrink-0 text-right">
        <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${past ? "bg-[#f0f2ee] text-[#7a857c]" : "bg-[#eef2e9] text-[#5c7454]"}`}>
          {formatTime(meeting.startAt)}
        </span>
        <p className="mt-1 text-[11px] text-[#7d897f]">{formatDate(meeting.startAt)}</p>
      </div>
    </Link>
  );
}

export default function DashboardSchedulePortalClient({
  upcoming,
  past,
}: {
  upcoming: Meeting[];
  past: Meeting[];
}) {
  const [root, setRoot] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const headings = Array.from(document.querySelectorAll("h3"));
    const heading = headings.find((el) => {
      const text = el.textContent?.trim();
      return text === "Schedule" || text === "Today's Schedule" || text === "Upcoming Meetings";
    });

    const card =
      heading?.closest("div.rounded-\\[28px\\]") ||
      heading?.closest("div.rounded-\\[30px\\]") ||
      heading?.parentElement?.parentElement?.parentElement;

    if (!(card instanceof HTMLDivElement) || !card.parentElement) return;

    const replacement = document.createElement("div");
    replacement.className = card.className;
    card.parentElement.insertBefore(replacement, card);
    card.style.display = "none";
    setRoot(replacement);

    return () => {
      card.style.display = "";
      replacement.remove();
    };
  }, []);

  if (!root) return null;

  return createPortal(
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f8966]">Schedule</p>
          <h3 className="mt-2 text-2xl font-bold text-[#243128]">Upcoming Meetings</h3>
          <p className="mt-1 text-sm text-[#637166]">Free 15s and coaching sessions coming up.</p>
        </div>
        <Link href="/calendar" className="shrink-0 text-sm font-semibold text-[#4d6247]">View calendar</Link>
      </div>

      <div className="mt-6 space-y-3">
        {upcoming.length ? (
          upcoming.map((meeting) => <MeetingRow key={meeting.id} meeting={meeting} />)
        ) : (
          <div className="rounded-2xl border border-[#d2ddcd] bg-white/70 p-5 text-center text-sm font-semibold text-[#3d4d39]">No upcoming meetings</div>
        )}
      </div>

      <div className="mt-7 border-t border-[#cfd9c9] pt-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7d897f]">This Week</p>
            <h4 className="mt-1 text-lg font-bold text-[#344239]">Past Meetings</h4>
          </div>
          <span className="text-xs text-[#7d897f]">Resets Sunday</span>
        </div>
        <div className="mt-4 max-h-[320px] space-y-3 overflow-y-auto pr-1">
          {past.length ? (
            past.map((meeting) => <MeetingRow key={meeting.id} meeting={meeting} past />)
          ) : (
            <p className="rounded-2xl border border-dashed border-[#d2ddcd] bg-white/45 p-4 text-center text-sm text-[#708075]">No past meetings yet this week.</p>
          )}
        </div>
      </div>
    </div>,
    root
  );
}
