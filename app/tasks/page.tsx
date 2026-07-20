import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import {
  createTask,
  deleteTask,
  updateTaskStatus,
} from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Task = {
  id: number;
  client_id: number | null;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  due_date: string | null;
  due_time: string | null;
  recurrence: string;
  completed_at: string | null;
  created_at: string;
};

type Client = {
  id: number;
  name: string | null;
};

type TasksPageProps = {
  searchParams: Promise<{
    view?: string;
  }>;
};

function getTodayDateString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatDate(value: string | null) {
  if (!value) {
    return "No due date";
  }

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatTime(value: string | null) {
  if (!value) {
    return null;
  }

  const [hours, minutes] = value.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getPriorityStyle(priority: string) {
  if (priority === "Urgent") {
    return "bg-[#f5dedd] text-[#9a4f48]";
  }

  if (priority === "High") {
    return "bg-[#f7e7e4] text-[#9a554d]";
  }

  if (priority === "Low") {
    return "bg-[#eef2e9] text-[#647066]";
  }

  return "bg-[#f6ecd9] text-[#8f6d37]";
}

function getCategoryStyle(category: string) {
  if (category === "Client Work") {
    return "bg-[#e8eee3] text-[#4d6247]";
  }

  if (category === "Marketing") {
    return "bg-[#eee8f3] text-[#6d5878]";
  }

  if (category === "Finance") {
    return "bg-[#e7edf3] text-[#52697d]";
  }

  if (category === "Personal") {
    return "bg-[#f4e9ec] text-[#805d68]";
  }

  return "bg-[#eef2e9] text-[#647066]";
}

export default async function TasksPage({
  searchParams,
}: TasksPageProps) {
  const supabase = await createClient();
  const resolvedSearchParams = await searchParams;
  const view = resolvedSearchParams.view ?? "open";
  const today = getTodayDateString();

  const [tasksResult, clientsResult] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("due_time", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),

    supabase
      .from("clients")
      .select("id, name")
      .neq("status", "Archived")
      .order("name", { ascending: true }),
  ]);

  const tasks = (tasksResult.data ?? []) as Task[];
  const clients = (clientsResult.data ?? []) as Client[];

  const openTasks = tasks.filter(
    (task) => task.status !== "Completed" && task.status !== "Cancelled"
  );

  const completedTasks = tasks.filter(
    (task) => task.status === "Completed"
  );

  const overdueTasks = openTasks.filter(
    (task) => task.due_date && task.due_date < today
  );

  const dueTodayTasks = openTasks.filter(
    (task) => task.due_date === today
  );

  const visibleTasks =
    view === "completed"
      ? completedTasks
      : view === "all"
      ? tasks
      : openTasks;

  const clientNameById = new Map(
    clients.map((client) => [
      client.id,
      client.name || "Unnamed Client",
    ])
  );

  const databaseError = tasksResult.error || clientsResult.error;

  return (
    <section className="min-w-0 flex-1 bg-[#f7f8f3] text-[#243128]">
      <header className="border-b border-[#dfe6db] bg-[#fbfaf6] px-6 py-7 lg:px-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/"
              className="text-sm font-semibold text-[#7f9975] hover:text-[#4d6247]"
            >
              ← Back to Dashboard
            </Link>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#243128]">
              Tasks
            </h1>

            <p className="mt-2 text-sm text-[#708075]">
              Manage client work, business reminders, and recurring responsibilities.
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-7 p-6 lg:p-10">
        {databaseError ? (
          <section className="rounded-2xl border border-red-300 bg-red-50 p-6">
            <h2 className="text-lg font-bold text-red-700">
              Tasks could not be loaded
            </h2>

            <pre className="mt-4 whitespace-pre-wrap text-sm text-red-700">
              {JSON.stringify(databaseError, null, 2)}
            </pre>
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#708075]">Open Tasks</p>
            <p className="mt-3 text-3xl font-bold">{openTasks.length}</p>
            <p className="mt-3 text-xs font-semibold text-[#7f9975]">
              Still needs attention
            </p>
          </div>

          <div className="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#708075]">Due Today</p>
            <p className="mt-3 text-3xl font-bold">{dueTodayTasks.length}</p>
            <p className="mt-3 text-xs font-semibold text-[#7f9975]">
              Scheduled for today
            </p>
          </div>

          <div className="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#708075]">Overdue</p>
            <p className="mt-3 text-3xl font-bold">{overdueTasks.length}</p>
            <p className="mt-3 text-xs font-semibold text-[#9a554d]">
              Needs immediate attention
            </p>
          </div>

          <div className="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#708075]">Completed</p>
            <p className="mt-3 text-3xl font-bold">{completedTasks.length}</p>
            <p className="mt-3 text-xs font-semibold text-[#7f9975]">
              Finished tasks
            </p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
          <div className="h-fit rounded-2xl border border-[#dfe6db] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">Add Task</h2>

            <p className="mt-1 text-sm text-[#708075]">
              Add a reminder, deadline, or recurring responsibility.
            </p>

            <form action={createTask} className="mt-6 space-y-4">
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
                  className="mt-2 w-full rounded-xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3 text-sm outline-none focus:border-[#9fb294]"
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
                  className="mt-2 w-full resize-none rounded-xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3 text-sm outline-none focus:border-[#9fb294]"
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
                  className="mt-2 w-full rounded-xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3 text-sm outline-none focus:border-[#9fb294]"
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
                    className="mt-2 w-full rounded-xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3 text-sm outline-none focus:border-[#9fb294]"
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
                    className="mt-2 w-full rounded-xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3 text-sm outline-none focus:border-[#9fb294]"
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
                    className="mt-2 w-full rounded-xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3 text-sm outline-none focus:border-[#9fb294]"
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
                    className="mt-2 w-full rounded-xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3 text-sm outline-none focus:border-[#9fb294]"
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
                  className="mt-2 w-full rounded-xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3 text-sm outline-none focus:border-[#9fb294]"
                >
                  <option>None</option>
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-[#647d5b] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#4d6247]"
              >
                + Add Task
              </button>
            </form>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <Link
                href="/tasks"
                className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                  view === "open"
                    ? "bg-[#647d5b] text-white"
                    : "border border-[#d7e1d0] bg-white text-[#4d6247]"
                }`}
              >
                Open
              </Link>

              <Link
                href="/tasks?view=completed"
                className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                  view === "completed"
                    ? "bg-[#647d5b] text-white"
                    : "border border-[#d7e1d0] bg-white text-[#4d6247]"
                }`}
              >
                Completed
              </Link>

              <Link
                href="/tasks?view=all"
                className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                  view === "all"
                    ? "bg-[#647d5b] text-white"
                    : "border border-[#d7e1d0] bg-white text-[#4d6247]"
                }`}
              >
                All Tasks
              </Link>
            </div>

            {visibleTasks.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-[#dfe6db] bg-white p-12 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e8eee3] text-2xl text-[#647d5b]">
                  ✓
                </div>

                <h2 className="mt-5 text-xl font-bold">
                  No tasks in this view
                </h2>

                <p className="mt-2 text-sm text-[#708075]">
                  Add a task using the form to get started.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {visibleTasks.map((task) => {
                  const completed = task.status === "Completed";
                  const overdue =
                    !completed &&
                    Boolean(task.due_date) &&
                    task.due_date! < today;

                  return (
                    <article
                      key={task.id}
                      className={`rounded-2xl border bg-white p-5 shadow-sm ${
                        overdue
                          ? "border-[#e8c8c4]"
                          : "border-[#dfe6db]"
                      }`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3
                              className={`text-lg font-bold ${
                                completed
                                  ? "text-[#8a968d] line-through"
                                  : "text-[#243128]"
                              }`}
                            >
                              {task.title}
                            </h3>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityStyle(
                                task.priority
                              )}`}
                            >
                              {task.priority}
                            </span>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getCategoryStyle(
                                task.category
                              )}`}
                            >
                              {task.category}
                            </span>

                            {task.recurrence !== "None" ? (
                              <span className="rounded-full bg-[#eef2e9] px-3 py-1 text-xs font-semibold text-[#647066]">
                                Repeats {task.recurrence.toLowerCase()}
                              </span>
                            ) : null}
                          </div>

                          {task.description ? (
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#708075]">
                              {task.description}
                            </p>
                          ) : null}

                          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#708075]">
                            <span
                              className={
                                overdue
                                  ? "font-semibold text-[#9a554d]"
                                  : ""
                              }
                            >
                              {overdue ? "Overdue: " : "Due: "}
                              {formatDate(task.due_date)}
                              {formatTime(task.due_time)
                                ? ` at ${formatTime(task.due_time)}`
                                : ""}
                            </span>

                            {task.client_id ? (
                              <Link
                                href={`/clients/${task.client_id}`}
                                className="font-semibold text-[#647d5b] hover:text-[#4d6247]"
                              >
                                {clientNameById.get(task.client_id) ||
                                  "View Client"}
                              </Link>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                          <form action={updateTaskStatus}>
                            <input
                              type="hidden"
                              name="task_id"
                              value={task.id}
                            />

                            <input
                              type="hidden"
                              name="next_status"
                              value={completed ? "Open" : "Completed"}
                            />

                            <button
                              type="submit"
                              className="rounded-xl border border-[#cbd8c4] bg-white px-4 py-2 text-xs font-semibold text-[#4d6247] hover:bg-[#f5f7f2]"
                            >
                              {completed ? "Reopen" : "Mark Complete"}
                            </button>
                          </form>

                          <form action={deleteTask}>
                            <input
                              type="hidden"
                              name="task_id"
                              value={task.id}
                            />

                            <button
                              type="submit"
                              className="rounded-xl border border-[#ead4d0] bg-white px-4 py-2 text-xs font-semibold text-[#a45f58] hover:bg-[#fbefed]"
                            >
                              Delete
                            </button>
                          </form>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
