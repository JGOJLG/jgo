import Link from "next/link";
import { getRecruiterTopicForDate } from "@/lib/recruiterTopics";

const ARCHIVE_START_DATE = new Date("2026-07-07T12:00:00-04:00");

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getEasternToday() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = Number(
    parts.find((part) => part.type === "year")?.value ?? "2026"
  );
  const month = Number(
    parts.find((part) => part.type === "month")?.value ?? "1"
  );
  const day = Number(
    parts.find((part) => part.type === "day")?.value ?? "1"
  );

  return new Date(year, month - 1, day, 12, 0, 0);
}

function getArchiveEntries() {
  const today = getEasternToday();
  const entries = [];
  const cursor = new Date(today);

  while (cursor >= ARCHIVE_START_DATE) {
    const entryDate = new Date(cursor);

    entries.push({
      date: entryDate,
      topic: getRecruiterTopicForDate(entryDate),
    });

    cursor.setDate(cursor.getDate() - 1);
  }

  return entries;
}

export default function RecruiterTipsHistoryPage() {
  const entries = getArchiveEntries();
  const todayEntry = entries[0];
  const historyEntries = entries.slice(1);

  return (
    <section className="relative min-h-screen min-w-0 flex-1 overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(218,231,211,0.95),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(235,226,243,0.78),_transparent_28%),linear-gradient(180deg,_#f8f9f5_0%,_#f3f5ef_100%)] text-[#243128]">
      <div className="pointer-events-none absolute -left-24 top-56 h-80 w-80 rounded-full bg-white/55 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-[520px] h-96 w-96 rounded-full bg-[#dfead9]/55 blur-3xl" />

      <header className="relative z-10 border-b border-white/70 bg-white/58 px-6 py-7 shadow-[0_12px_35px_rgba(71,91,66,0.07)] backdrop-blur-2xl lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/"
              className="text-sm font-semibold text-[#7f9975] transition hover:text-[#4d6247]"
            >
              ← Back to Dashboard
            </Link>

            <div className="mt-4 flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#cfddc9] bg-[#e7efe3] text-[#5c7454] shadow-sm">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <path
                    d="M9 18h6m-5 3h4M8.2 14.8A7 7 0 1 1 15.8 14.8c-.9.6-1.3 1.4-1.3 2.2h-5c0-.8-.4-1.6-1.3-2.2Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7f9975]">
                  JGO Hire
                </p>

                <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#243128]">
                  Recruiter Tips
                </h1>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#708075]">
              One new recruiter insight every day, with every previous tip
              saved in your permanent archive.
            </p>
          </div>

          <div className="rounded-2xl border border-white/80 bg-white/72 px-6 py-4 text-center shadow-sm backdrop-blur-xl">
            <p className="text-2xl font-bold text-[#3d4d39]">
              {entries.length}
            </p>

            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7f9975]">
              Tips saved
            </p>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-6xl space-y-8 p-6 lg:p-10">
        {todayEntry ? (
          <section className="relative overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(145deg,rgba(239,247,235,0.96),rgba(255,255,255,0.82))] p-7 shadow-[0_28px_80px_rgba(71,91,66,0.14)] backdrop-blur-2xl lg:p-9">
            <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-[#d8e8d1]/75 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-white/85 blur-3xl" />

            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-[#647d5b] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                    Today&apos;s tip
                  </span>

                  <span className="text-xs font-semibold text-[#7f9975]">
                    {formatDate(todayEntry.date)}
                  </span>
                </div>

                <h2 className="mt-5 text-3xl font-bold tracking-tight text-[#243128] lg:text-4xl">
                  {todayEntry.topic.title}
                </h2>

                <p className="mt-4 text-base leading-7 text-[#5f6e62]">
                  {todayEntry.topic.prompt}
                </p>
              </div>

              <div className="shrink-0 rounded-[24px] border border-white/90 bg-white/72 p-5 shadow-[0_14px_36px_rgba(71,91,66,0.10)] backdrop-blur-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7f9975]">
                  Daily focus
                </p>

                <p className="mt-2 max-w-[220px] text-sm font-semibold leading-6 text-[#3d4d39]">
                  Read it, apply one idea, and bring it into your next candidate
                  conversation.
                </p>
              </div>
            </div>
          </section>
        ) : null}

        <section>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7f9975]">
                Permanent archive
              </p>

              <h2 className="mt-2 text-2xl font-bold text-[#243128]">
                Previous recruiter tips
              </h2>

              <p className="mt-1 text-sm text-[#708075]">
                Scroll through every tip from July 7, 2026 through today.
              </p>
            </div>

            <span className="w-fit rounded-full border border-white/80 bg-white/68 px-4 py-2 text-xs font-semibold text-[#647d5b] shadow-sm backdrop-blur-xl">
              Grows daily
            </span>
          </div>

          {historyEntries.length === 0 ? (
            <div className="mt-6 rounded-[24px] border border-dashed border-[#cfd9c9] bg-white/64 p-8 text-center">
              <p className="text-sm font-semibold text-[#3d4d39]">
                Your archive begins today
              </p>

              <p className="mt-2 text-sm text-[#708075]">
                New recruiter tips will automatically appear here each day.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {historyEntries.map((entry, index) => (
                <article
                  key={entry.date.toISOString()}
                  className="group rounded-[24px] border border-white/78 bg-white/64 p-6 shadow-[0_16px_42px_rgba(71,91,66,0.10)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[#cad8c4] hover:bg-white/84"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7f9975]">
                        {formatShortDate(entry.date)}
                      </p>

                      <h3 className="mt-3 text-lg font-bold leading-6 text-[#243128]">
                        {entry.topic.title}
                      </h3>
                    </div>

                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf3e9] text-xs font-bold text-[#647d5b] transition group-hover:bg-[#647d5b] group-hover:text-white">
                      {String(index + 2).padStart(2, "0")}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-[#647066]">
                    {entry.topic.prompt}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
