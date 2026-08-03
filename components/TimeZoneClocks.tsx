"use client";

import { useEffect, useState } from "react";

const zones = [
  {
    label: "Eastern",
    shortLabel: "ET",
    location: "New York",
    timeZone: "America/New_York",
  },
  {
    label: "Central",
    shortLabel: "CT",
    location: "Chicago",
    timeZone: "America/Chicago",
  },
  {
    label: "Pacific",
    shortLabel: "PT",
    location: "Los Angeles",
    timeZone: "America/Los_Angeles",
  },
];

function getTimeZoneAbbreviation(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "short",
  }).formatToParts(date);

  return parts.find((part) => part.type === "timeZoneName")?.value ?? "";
}

export default function TimeZoneClocks() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());

    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {zones.map((zone) => {
        const time = now
          ? new Intl.DateTimeFormat("en-US", {
              timeZone: zone.timeZone,
              hour: "numeric",
              minute: "2-digit",
              second: "2-digit",
            }).format(now)
          : "--:--:--";

        const abbreviation = now
          ? getTimeZoneAbbreviation(now, zone.timeZone)
          : zone.shortLabel;

        return (
          <div
            key={zone.timeZone}
            className="group relative overflow-hidden rounded-[22px] border border-white/80 bg-white/66 p-4 shadow-[0_10px_30px_rgba(71,91,66,0.08)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/82"
          >
            <div className="absolute right-[-20px] top-[-20px] h-20 w-20 rounded-full bg-[#e7efe2]/75 blur-2xl transition group-hover:scale-110" />

            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7f9975]">
                    {zone.label}
                  </p>
                  <p className="mt-1 text-xs text-[#8a968d]">
                    {zone.location}
                  </p>
                </div>

                <span className="rounded-full border border-white/85 bg-[#eef2e9]/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#647d5b] shadow-sm">
                  {abbreviation}
                </span>
              </div>

              <p className="mt-4 font-mono text-2xl font-bold tracking-tight text-[#243128]">
                {time}
              </p>

              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9aa59c]">
                Live local time
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
