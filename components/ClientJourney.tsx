"use client";

import { toggleTimelineStep } from "@/app/clients/[id]/actions";

type TimelineEvent = {
  id: number;
  event_type: string;
  title: string;
  status: string | null;
  created_at: string;
};

type Props = {
  clientId: number;
  timeline: TimelineEvent[];
};

const steps = [
  {
    key: "lead_created",
    title: "Lead Created",
  },
  {
    key: "free15_scheduled",
    title: "Free 15 Scheduled",
  },
  {
    key: "free15_completed",
    title: "Free 15 Completed",
  },
  {
    key: "services_selected",
    title: "Services Selected",
  },
  {
    key: "service_started",
    title: "Service Started",
  },
  {
    key: "service_completed",
    title: "Service Completed",
  },
];

export default function ClientJourney({
  clientId,
  timeline,
}: Props) {
  function isComplete(eventType: string) {
    return timeline.some(
      (event) => event.event_type === eventType
    );
  }

  return (
    <section className="rounded-3xl border border-[#dfe6db] bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-[#243128]">
          Client Journey
        </h2>

        <p className="mt-1 text-sm text-[#708075]">
          Each step is independent. Click any step to turn it
          on or off.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {steps.map((step) => {
          const complete = isComplete(step.key);

          return (
            <form
              key={step.key}
              action={toggleTimelineStep}
            >
              <input
                type="hidden"
                name="clientId"
                value={clientId}
              />
              <input
                type="hidden"
                name="eventType"
                value={step.key}
              />
              <input
                type="hidden"
                name="title"
                value={step.title}
              />

              <button
                type="submit"
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  complete
                    ? "border-[#7f9975] bg-[#7f9975] text-white"
                    : "border-[#dfe6db] bg-[#fbfcf9] text-[#708075] hover:border-[#9fb294]"
                }`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                    complete
                      ? "bg-white text-[#7f9975]"
                      : "bg-[#eef2e9] text-transparent"
                  }`}
                >
                  ✓
                </span>

                {step.title}
              </button>
            </form>
          );
        })}
      </div>
    </section>
  );
}
