"use client";

import { useState } from "react";
import { addCalendarEvent, deleteCalendarEvent } from "@/app/clients/[id]/actions";

type CalendarEvent = {
  id: number;
  client_id: number;
  event_type: string;
  event_date: string;
  notes?: string | null;
};

type Props = {
  clientId: number;
  events: CalendarEvent[];
};

const EVENT_TYPES = [
  "Free 15",
  "Career Documents Received",
  "Final Career Documents Sent",
  "Coaching Session",
  "Client Interview",
];

function generateTimeOptions() {
  const options: { value: string; label: string }[] = [];

  for (let h = 7; h <= 19; h++) {
    const maxMinute = h === 19 ? 0 : 45;

    for (let m = 0; m <= maxMinute; m += 15) {
      const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const period = h < 12 ? "AM" : "PM";
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      const label = `${hour12}:${String(m).padStart(2, "0")} ${period}`;
      options.push({ value, label });
    }
  }

  return options;
}

const TIME_OPTIONS = generateTimeOptions();

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function CalendarScheduler({ clientId, events }: Props) {
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [eventType, setEventType] = useState(EVENT_TYPES[0]);

  const eventsByDate = events.reduce<Record<string, CalendarEvent[]>>(
    (acc, ev) => {
      const key = ev.event_date;
      if (!acc[key]) acc[key] = [];
      acc[key].push(ev);
      return acc;
    },
    {}
  );

  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function goToPrevMonth() {
    setMonthCursor(new Date(year, month - 1, 1));
  }

  function goToNextMonth() {
    setMonthCursor(new Date(year, month + 1, 1));
  }

  function openDay(dateKey: string) {
    setSelectedDate(dateKey);
    setShowAddForm(false);
  }

  function closeModal() {
    setSelectedDate(null);
    setShowAddForm(false);
    setEventType(EVENT_TYPES[0]);
  }

  const selectedDateEvents = selectedDate
    ? eventsByDate[selectedDate] ?? []
    : [];

  return (
    <section className="rounded-2xl border border-[#dfe6db] bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[#243128]">Scheduler</h2>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={goToPrevMonth}
            className="rounded-full border border-[#dfe6db] px-1.5 py-0.5 text-xs text-[#243128] hover:bg-[#f5f7f2]"
          >
            ‹
          </button>
          <span className="text-xs font-semibold text-[#243128]">
            {formatMonthLabel(monthCursor)}
          </span>
          <button
            type="button"
            onClick={goToNextMonth}
            className="rounded-full border border-[#dfe6db] px-1.5 py-0.5 text-xs text-[#243128] hover:bg-[#f5f7f2]"
          >
            ›
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-[#a3ada0]">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;

          const dateKey = toDateKey(new Date(year, month, day));
          const dayEvents = eventsByDate[dateKey] ?? [];

          return (
            <button
              key={i}
              type="button"
              onClick={() => openDay(dateKey)}
              className={`flex h-8 flex-col items-center justify-center rounded-lg text-xs font-semibold transition ${
                dayEvents.length > 0
                  ? "bg-[#eef2e9] text-[#243128]"
                  : "text-[#708075] hover:bg-[#f5f7f2]"
              }`}
            >
              <span>{day}</span>
              {dayEvents.length > 0 ? (
                <span className="mt-0.5 h-1 w-1 rounded-full bg-[#7f9975]" />
              ) : null}
            </button>
          );
        })}
      </div>

      {selectedDate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#243128]">
                {new Date(`${selectedDate}T12:00:00`).toLocaleDateString(
                  "en-US",
                  { month: "long", day: "numeric", year: "numeric" }
                )}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-[#708075] hover:text-[#243128]"
              >
                ✕
              </button>
            </div>

            {selectedDateEvents.length > 0 && !showAddForm ? (
              <div className="mt-4 space-y-2">
                {selectedDateEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-[#dfe6db] px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="text-[#243128]">{ev.event_type}</span>
                      {ev.notes ? (
                        <p className="mt-0.5 text-xs text-[#708075]">
                          {ev.notes}
                        </p>
                      ) : null}
                    </div>

                    <form action={deleteCalendarEvent}>
                      <input type="hidden" name="clientId" value={clientId} />
                      <input type="hidden" name="eventId" value={ev.id} />
                      <button className="shrink-0 text-xs font-semibold text-[#9a554d] hover:underline">
                        Remove
                      </button>
                    </form>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="w-full rounded-xl border border-[#dfe6db] px-4 py-2 text-sm font-semibold text-[#243128] transition hover:bg-[#f5f7f2]"
                >
                  + Schedule Something Else
                </button>
              </div>
            ) : (
              <form
                action={addCalendarEvent}
                onSubmit={closeModal}
                className="mt-4 space-y-3"
              >
                <input type="hidden" name="clientId" value={clientId} />
                <input type="hidden" name="eventDate" value={selectedDate} />

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-[#708075]">
                    Topic
                  </label>
                  <select
                    name="eventType"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#dfe6db] px-3 py-2 text-sm text-[#243128] outline-none focus:border-[#7f9975]"
                  >
                    {EVENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {eventType === "Client Interview" ? (
                  <>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-[#708075]">
                        Time
                      </label>
                      <select
                        name="eventTime"
                        defaultValue=""
                        className="mt-1 w-full rounded-xl border border-[#dfe6db] px-3 py-2 text-sm text-[#243128] outline-none focus:border-[#7f9975]"
                      >
                        <option value="">Select time</option>
                        {TIME_OPTIONS.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-[#708075]">
                        Notes
                      </label>
                      <textarea
                        name="notes"
                        rows={3}
                        placeholder="Interview details..."
                        className="mt-1 w-full rounded-xl border border-[#dfe6db] px-3 py-2 text-sm text-[#243128] outline-none focus:border-[#7f9975]"
                      />
                    </div>
                  </>
                ) : null}

                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#647d5b] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#56683f]"
                >
                  Add to Calendar
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
