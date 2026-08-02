"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

type InterviewCompleteButtonProps = {
  eventId: number;
  compact?: boolean;
};

export default function InterviewCompleteButton({
  eventId,
  compact = false,
}: InterviewCompleteButtonProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function markCompleted() {
    if (saving) return;

    setSaving(true);
    setError("");

    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("calendar_events")
      .update({
        status: "Completed",
      })
      .eq("id", eventId);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={markCompleted}
        disabled={saving}
        className={`rounded-xl border border-[#d8cfe5] bg-white font-semibold text-[#65567f] transition hover:-translate-y-0.5 hover:bg-[#faf8fd] disabled:cursor-wait disabled:opacity-60 ${
          compact ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm"
        }`}
      >
        {saving ? "Saving..." : "Mark Completed"}
      </button>

      {error ? (
        <p className="mt-2 text-xs font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
