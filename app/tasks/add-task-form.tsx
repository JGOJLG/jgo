"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTask } from "./actions";

type Client = {
  id: number;
  name: string | null;
};

type AddTaskFormProps = {
  clients: Client[];
};

export default function AddTaskForm({ clients }: AddTaskFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(formData: FormData) {
    setSaved(false);
    setError("");

    startTransition(async () => {
      try {
        await createTask(formData);

        formRef.current?.reset();
        router.refresh();

        setSaved(true);

        if (toastTimerRef.current) {
          clearTimeout(toastTimerRef.current);
        }

        toastTimerRef.current = setTimeout(() => {
          setSaved(false);
        }, 2000);
      } catch (err) {
        console.error("Could not save task:", err);
        setError("Task could not be saved. Please try again.");
      }
    });
  }

  return (
    <>
      <form
        ref={formRef}
        action={handleSubmit}
        className="mt-6 space-y-4"
      >
        <div>
          <label
            htmlFor="title"
            className="text-sm font-semibold text-[#3d4d39]"
          >
            Task Name
          </label>

          <input
            id="title"
            name="title"
            required
            placeholder="Follow up with client"
            disabled={isPending}
            className="mt-2 w-full rounded-xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3 text-sm outline-none focus:border-[#9fb294] disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="text-sm font-semibold text-[#3d4d39]"
          >
            Notes
          </label>

          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="Add any helpful details..."
            disabled={isPending}
            className="mt-2 w-full resize-none rounded-xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3 text-sm outline-none focus:border-[#9fb294] disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <div>
          <label
            htmlFor="client_id"
            className="text-sm font-semibold text-[#3d4d39]"
          >
            Client
          </label>

          <select
            id="client_id"
            name="client_id"
            defaultValue=""
            disabled={isPending}
            className="mt-2 w-full rounded-xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3 text-sm outline-none focus:border-[#9fb294] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">No client connected</option>

            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name || "Unnamed Client"}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <div>
            <label
              htmlFor="category"
              className="text-sm font-semibold text-[#3d4d39]"
            >
              Category
            </label>

            <select
              id="category"
              name="category"
              defaultValue="General"
              disabled={isPending}
              className="mt-2 w-full rounded-xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3 text-sm outline-none focus:border-[#9fb294] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option>General</option>
              <option>Client Work</option>
              <option>Marketing</option>
              <option>Finance</option>
              <option>Personal</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="priority"
              className="text-sm font-semibold text-[#3d4d39]"
            >
              Priority
            </label>

            <select
              id="priority"
              name="priority"
              defaultValue="Normal"
              disabled={isPending}
              className="mt-2 w-full rounded-xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3 text-sm outline-none focus:border-[#9fb294] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option>Low</option>
              <option>Normal</option>
              <option>High</option>
              <option>Urgent</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <div>
            <label
              htmlFor="due_date"
              className="text-sm font-semibold text-[#3d4d39]"
            >
              Due Date
            </label>

            <input
              id="due_date"
              name="due_date"
              type="date"
              disabled={isPending}
              className="mt-2 w-full rounded-xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3 text-sm outline-none focus:border-[#9fb294] disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="due_time"
              className="text-sm font-semibold text-[#3d4d39]"
            >
              Due Time
            </label>

            <input
              id="due_time"
              name="due_time"
              type="time"
              disabled={isPending}
              className="mt-2 w-full rounded-xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3 text-sm outline-none focus:border-[#9fb294] disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="recurrence"
            className="text-sm font-semibold text-[#3d4d39]"
          >
            Repeat
          </label>

          <select
            id="recurrence"
            name="recurrence"
            defaultValue="None"
            disabled={isPending}
            className="mt-2 w-full rounded-xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3 text-sm outline-none focus:border-[#9fb294] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option>None</option>
            <option>Daily</option>
            <option>Weekly</option>
            <option>Monthly</option>
          </select>
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-[#ead4d0] bg-[#fbefed] px-4 py-3 text-sm font-semibold text-[#9a554d]"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-[#647d5b] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4d6247] disabled:cursor-wait disabled:bg-[#8fa087]"
        >
          {isPending ? "Saving..." : "+ Add Task"}
        </button>
      </form>

      {saved ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-[#cbd8c4] bg-white px-5 py-3 text-sm font-semibold text-[#4d6247] shadow-lg"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e8eee3] text-[#647d5b]">
            ✓
          </span>
          Task saved
        </div>
      ) : null}
    </>
  );
}
