"use client";

import { useState, useTransition } from "react";
import { updateTaskStatus } from "@/app/tasks/actions";

export default function DashboardTaskCheckbox({
  taskId,
  completed,
}: {
  taskId: number;
  completed: boolean;
}) {
  const [checked, setChecked] = useState(completed);
  const [isPending, startTransition] = useTransition();

  function handleChange(nextChecked: boolean) {
    setChecked(nextChecked);

    const formData = new FormData();
    formData.set("task_id", String(taskId));
    formData.set("next_status", nextChecked ? "Completed" : "Open");

    startTransition(async () => {
      await updateTaskStatus(formData);
    });
  }

  return (
    <input
      type="checkbox"
      checked={checked}
      disabled={isPending}
      onChange={(event) => handleChange(event.target.checked)}
      aria-label={checked ? "Reopen task" : "Complete task"}
      className="mt-0.5 h-5 w-5 shrink-0 accent-[#647d5b]"
    />
  );
}