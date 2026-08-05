"use client";

import { useEffect, useState } from "react";

const zones = [
  {
    label: "Eastern",
    shortLabel: "ET",
    city: "New York",
    timeZone: "America/New_York",
  },
  {
    label: "Central",
    shortLabel: "CT",
    city: "Chicago",
    timeZone: "America/Chicago",
  },
  {
    label: "Mountain",
    shortLabel: "MT",
    city: "Denver",
    timeZone: "America/Denver",
  },
  {
    label: "Pacific",
    shortLabel: "PT",
    city: "Los Angeles",
    timeZone: "America/Los_Angeles",
  },
];

export default function HeaderTimeClocks() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());

    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="grid w-full gap-2 sm:grid-cols-2 xl:grid-cols-4 xl:w-auto">
      {zones.map((zone) => {
        const time = now
          ? new Intl.DateTimeFormat("en-US", {
              timeZone: zone.timeZone,
              hour: "numeric",
              minute: "2-digit",
            }).format(now)
          : "--:--";

        return (
          <div
            key={zone.timeZone}
            className="flex min-h-12 min-w-0 items-center gap-3 rounded-2xl border border-white/85 bg-white/76 px-4 py-2.5 shadow-sm backdrop-blur-xl"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#dce5d7] bg-[#f4f7f1] text-[11px] font-bold text-[#647d5b]">
              {zone.shortLabel}
            </span>

            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-[#82907f]">
                {zone.city}
              </p>
              <p className="whitespace-nowrap text-sm font-bold text-[#243128]">
                {time}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
