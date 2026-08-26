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

export default function DashboardUpcomingMeetings() {
  const [portalRoot, setPortalRoot] = useState<HTMLDivElement | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const heading = Array.from(document.querySelectorAll("h3")).find(
      (element) => element.textContent?.trim() === "People to Reach Out To"
    );

    const originalCard = heading?.parentElement?.parentElement?.parentElement;

    if (!(originalCard instanceof HTMLDivElement) || !originalCard.parentElement) {
      return;
    }

    const replacement = document.createElement("div");
    replacement.className = originalCard.className;
    originalCard.parentElement.insertBefore(replacement, originalCard);
    originalCard.style.display = "none";
    setPortalRoot(replacement);

    return () => {
      originalCard.style.display = "";
      replacement.remove();
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadMeetings() {
      try {
        const response = await fetch("/api/dashboard/upcoming-meetings", {
          cache: "no-store",
        });

        if (!response.ok) throw new Error("Unable to load schedule.");
        const result = (await response.json()) as { meetings?: Meeting[] };
        if (active) setMeetings(result.meetings ?? []);
      } catch (error) {
        console.error("Unable to load schedule:", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadMeetings();
    return () => { active = false; };
  }, []);

  if (!portalRoot) return null;

  return createPortal(
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f8966]">Calendar</p>
          <h3 className="mt-2 text-2xl font-bold text-[#243128]">Schedule</h3>
          <p className="mt-1 text-sm text-[#637166]">Your upcoming meetings in one ongoing list.</p>
        </div>
        <Link href="/calendar" className="shrink-0 text-sm font-semibold text-[#4d6247]">View calendar</Link>
      </div>

      {loading ? (
        <div className="mt-6 rounded-2xl border border-[#d2ddcd] bg-white/70 p-6 text-center">
          <p className="text-sm text-[#708075]">Loading schedule...</p>
        </div>
      ) : meetings.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-[#d2ddcd] bg-white/70 p-6 text-center">
          <p className="text-sm font-semibold text-[#3d4d39]">No upcoming meetings</p>
          <p className="mt-2 text-sm text-[#708075]">Meetings scheduled from a client profile will appear here.</p>
        </div>
      ) : (
        <div className="mt-6 max-h-[520px] space-y-3 overflow-y-auto pr-1">
          {meetings.map((meeting) => (
            <Link
              key={meeting.id}
              href={`/clients/${meeting.clientId}`}
              className="flex items-center justify-between gap-4 rounded-2xl border border-[#d8e1d3] bg-white px-4 py-4 transition hover:border-[#bdcdb7]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#243128]">{meeting.clientName}</p>
                <p className="mt-1 truncate text-xs text-[#708075]">{meeting.title}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span className="rounded-full bg-[#eef2e9] px-2.5 py-1 text-[11px] font-semibold text-[#5c7454]">{formatTime(meeting.startAt)}</span>
                <span className="text-[11px] text-[#7d897f]">{formatDate(meeting.startAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>,
    portalRoot
  );
}
