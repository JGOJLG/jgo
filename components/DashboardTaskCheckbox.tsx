"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

type DashboardTaskCheckboxProps = {
  taskId: number;
  completed: boolean;
};

export default function DashboardTaskCheckbox({
  taskId,
  completed,
}: DashboardTaskCheckboxProps) {
  const router = useRouter();
  const [isCompleted, setIsCompleted] = useState(completed);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function toggleTask() {
    if (saving) return;

    const nextCompleted = !isCompleted;

    setSaving(true);
    setError("");
    setIsCompleted(nextCompleted);

    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("tasks")
      .update({
        status: nextCompleted ? "Completed" : "Open",
        completed_at: nextCompleted ? new Date().toISOString() : null,
      })
      .eq("id", taskId);

    if (updateError) {
      setIsCompleted(!nextCompleted);
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    router.refresh();
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={toggleTask}
        disabled={saving}
        aria-label={isCompleted ? "Mark task open" : "Mark task complete"}
        aria-pressed={isCompleted}
        title={isCompleted ? "Mark task open" : "Mark task complete"}
        className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold transition duration-200 ${
          isCompleted
            ? "border-[#647d5b] bg-[#647d5b] text-white shadow-[0_6px_18px_rgba(87,111,78,0.22)]"
            : "border-[#bfcbb9] bg-white text-transparent hover:-translate-y-0.5 hover:border-[#7f9975] hover:bg-[#f5f8f2]"
        } ${saving ? "cursor-wait opacity-60" : "cursor-pointer"}`}
      >
        ✓
      </button>

      {error ? (
        <span className="absolute left-8 top-0 z-20 w-52 rounded-xl border border-red-200 bg-white p-2 text-[11px] leading-4 text-red-700 shadow-lg">
          {error}
        </span>
      ) : null}
    </div>
  );
}
