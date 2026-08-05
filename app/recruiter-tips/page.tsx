import Link from "next/link";
import { getRecruiterTopicForDate } from "@/lib/recruiterTopics";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function RecruiterTipsHistoryPage() {
  const daysBack = 30;

  const entries = Array.from({ length: daysBack }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);

    return {
      date,
      topic: getRecruiterTopicForDate(date),
    };
  });

  return (
    <section className="min-h-screen bg-[#f7f8f3] p-6 text-[#243128] lg:p-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-[#7f9975]">
          ← Back to Dashboard
        </Link>

        <h1 className="mt-4 text-3xl font-bold">Recruiter Tip History</h1>
        <p className="mt-2 text-sm text-[#708075]">
          Every daily tip, most recent first.
        </p>

        <div className="mt-8 space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.date.toISOString()}
              className="rounded-2xl border border-[#dfe6db] bg-white p-6 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[#7f9975]">
                {formatDate(entry.date)}
              </p>
              <h2 className="mt-2 text-lg font-bold text-[#243128]">
                {entry.topic.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#647066]">
                {entry.topic.prompt}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
