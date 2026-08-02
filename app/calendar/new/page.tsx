import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Client = {
  id: number;
  name: string | null;
  email: string | null;
};

type Lead = {
  id: number;
  name: string | null;
  email: string | null;
  status: string | null;
  archived_at: string | null;
};

type NewCalendarPageProps = {
  searchParams?: Promise<{
    error?: string;
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

function getEasternDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function easternLocalToIso(dateValue: string, timeValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);

  if (
    !year ||
    !month ||
    !day ||
    Number.isNaN(hour) ||
    Number.isNaN(minute)
  ) {
    throw new Error("Invalid date or time.");
  }

  let timestamp = Date.UTC(year, month - 1, day, hour, minute, 0);

  for (let index = 0; index < 3; index += 1) {
    const zoned = getEasternDateParts(new Date(timestamp));
    const representedAsUtc = Date.UTC(
      zoned.year,
      zoned.month - 1,
      zoned.day,
      zoned.hour,
      zoned.minute,
      zoned.second
    );

    const desiredAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
    timestamp += desiredAsUtc - representedAsUtc;
  }

  return new Date(timestamp).toISOString();
}

async function createCalendarItem(formData: FormData) {
  "use server";

  const eventType = String(formData.get("event_type") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const startTime = String(formData.get("start_time") ?? "").trim();
  const endTime = String(formData.get("end_time") ?? "").trim();
  const attachedTo = String(formData.get("attached_to") ?? "").trim();
  const guestEmailInput = String(formData.get("guest_email") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  const validEventTypes = ["appointment", "follow_up", "reminder"];

  if (!validEventTypes.includes(eventType)) {
    redirect(
      `/calendar/new?error=${encodeURIComponent(
        "Please select a valid calendar item type."
      )}`
    );
  }

  if (!title) {
    redirect(
      `/calendar/new?error=${encodeURIComponent("Please enter a title.")}`
    );
  }

  if (!date || !startTime) {
    redirect(
      `/calendar/new?error=${encodeURIComponent(
        "Please select a date and start time."
      )}`
    );
  }

  let startAt: string;

  try {
    startAt = easternLocalToIso(date, startTime);
  } catch {
    redirect(
      `/calendar/new?error=${encodeURIComponent(
        "The selected date or start time is invalid."
      )}`
    );
  }

  let endAt: string | null = null;

  if (endTime) {
    try {
      endAt = easternLocalToIso(date, endTime);
    } catch {
      redirect(
        `/calendar/new?error=${encodeURIComponent(
          "The selected end time is invalid."
        )}`
      );
    }

    if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
      redirect(
        `/calendar/new?error=${encodeURIComponent(
          "The end time must be later than the start time."
        )}`
      );
    }
  } else {
    endAt = new Date(new Date(startAt).getTime() + 60 * 60 * 1000).toISOString();
  }

  let clientId: number | null = null;
  let intakeCallId: number | null = null;
  let guestEmail = guestEmailInput || null;

  const supabase = await createClient();

  if (attachedTo.startsWith("client:")) {
    const parsedId = Number(attachedTo.replace("client:", ""));

    if (Number.isInteger(parsedId) && parsedId > 0) {
      clientId = parsedId;

      if (!guestEmail) {
        const { data } = await supabase
          .from("clients")
          .select("email")
          .eq("id", parsedId)
          .maybeSingle();

        guestEmail = data?.email?.trim() || null;
      }
    }
  }

  if (attachedTo.startsWith("lead:")) {
    const parsedId = Number(attachedTo.replace("lead:", ""));

    if (Number.isInteger(parsedId) && parsedId > 0) {
      intakeCallId = parsedId;

      if (!guestEmail) {
        const { data } = await supabase
          .from("intake_calls")
          .select("email")
          .eq("id", parsedId)
          .maybeSingle();

        guestEmail = data?.email?.trim() || null;
      }
    }
  }

  const { data: createdEvent, error } = await supabase
    .from("calendar_events")
    .insert({
      title,
      event_type: eventType,
      start_at: startAt,
      end_at: endAt,
      client_id: clientId,
      intake_call_id: intakeCallId,
      guest_email: guestEmail,
      notes: notes || null,
      status: "scheduled",
      sync_to_google: false,
      invitation_sent: false,
    })
    .select("id")
    .single();

  if (error || !createdEvent) {
    redirect(
      `/calendar/new?error=${encodeURIComponent(
        `Could not save the calendar item: ${
          error?.message || "Unknown error"
        }`
      )}`
    );
  }

  revalidatePath("/calendar");
  revalidatePath("/");

  redirect(`/calendar/${createdEvent.id}`);
}

export default async function NewCalendarPage({
  searchParams,
}: NewCalendarPageProps) {
  const params = (await searchParams) ?? {};
  const supabase = await createClient();

  const [clientsResult, leadsResult] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, email")
      .order("name", { ascending: true }),
    supabase
      .from("intake_calls")
      .select("id, name, email, status, archived_at")
      .is("archived_at", null)
      .neq("status", "Converted")
      .order("name", { ascending: true }),
  ]);

  const clients = (clientsResult.data ?? []) as Client[];
  const leads = (leadsResult.data ?? []) as Lead[];

  const loadError =
    clientsResult.error?.message || leadsResult.error?.message || null;

  const today = getTodayDateString();

  return (
    <section className="min-w-0 flex-1 bg-[#f6f5ef]">
      <header className="border-b border-[#dfe6db] bg-[#fbfaf6] px-6 py-7 lg:px-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#7f9975]">Calendar</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#243128]">
              Add Calendar Item
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#708075]">
              Create an appointment, follow-up, or reminder. You can then
              download a universal calendar invitation at no cost.
            </p>
          </div>

          <Link
            href="/calendar"
            className="w-fit rounded-xl border border-[#cbd8c4] bg-white px-5 py-3 text-sm font-semibold text-[#4d6247] shadow-sm transition hover:bg-[#f5f7f2]"
          >
            Back to Calendar
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl p-6 lg:p-10">
        {params.error ? (
          <div className="mb-6 rounded-2xl border border-[#e8c9c5] bg-[#fff4f2] px-5 py-4 text-sm font-semibold text-[#9a4f47]">
            {params.error}
          </div>
        ) : null}

        {loadError ? (
          <div className="mb-6 rounded-2xl border border-[#e8c9c5] bg-[#fff4f2] px-5 py-4 text-sm font-semibold text-[#9a4f47]">
            Some client or lead options could not be loaded: {loadError}
          </div>
        ) : null}

        <form
          action={createCalendarItem}
          className="overflow-hidden rounded-3xl border border-[#dfe6db] bg-white shadow-sm"
        >
          <div className="border-b border-[#e5eae1] bg-[#eef3ea] px-6 py-5 lg:px-8">
            <h2 className="text-xl font-bold text-[#243128]">
              Calendar Details
            </h2>
            <p className="mt-1 text-sm text-[#708075]">
              Required fields are marked with an asterisk.
            </p>
          </div>

          <div className="space-y-7 p-6 lg:p-8">
            <div>
              <label
                htmlFor="event_type"
                className="text-sm font-bold text-[#3d4d39]"
              >
                Calendar Item Type *
              </label>
              <select
                id="event_type"
                name="event_type"
                required
                defaultValue="appointment"
                className="mt-2 w-full rounded-xl border border-[#cfd9c9] bg-white px-4 py-3 text-sm text-[#243128] outline-none transition focus:border-[#7f9975] focus:ring-4 focus:ring-[#dfe7d9]"
              >
                <option value="appointment">Appointment</option>
                <option value="follow_up">Follow-Up</option>
                <option value="reminder">General Reminder</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="title"
                className="text-sm font-bold text-[#3d4d39]"
              >
                Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                placeholder="Example: Career coaching session with Sarah"
                className="mt-2 w-full rounded-xl border border-[#cfd9c9] bg-white px-4 py-3 text-sm text-[#243128] outline-none transition placeholder:text-[#a0aaa2] focus:border-[#7f9975] focus:ring-4 focus:ring-[#dfe7d9]"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <label
                  htmlFor="date"
                  className="text-sm font-bold text-[#3d4d39]"
                >
                  Date *
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  required
                  defaultValue={today}
                  className="mt-2 w-full rounded-xl border border-[#cfd9c9] bg-white px-4 py-3 text-sm text-[#243128] outline-none transition focus:border-[#7f9975] focus:ring-4 focus:ring-[#dfe7d9]"
                />
              </div>

              <div>
                <label
                  htmlFor="start_time"
                  className="text-sm font-bold text-[#3d4d39]"
                >
                  Start Time *
                </label>
                <input
                  id="start_time"
                  name="start_time"
                  type="time"
                  step={900}
                  required
                  defaultValue="09:00"
                  className="mt-2 w-full rounded-xl border border-[#cfd9c9] bg-white px-4 py-3 text-sm text-[#243128] outline-none transition focus:border-[#7f9975] focus:ring-4 focus:ring-[#dfe7d9]"
                />
              </div>

              <div>
                <label
                  htmlFor="end_time"
                  className="text-sm font-bold text-[#3d4d39]"
                >
                  End Time
                </label>
                <input
                  id="end_time"
                  name="end_time"
                  type="time"
                  step={900}
                  className="mt-2 w-full rounded-xl border border-[#cfd9c9] bg-white px-4 py-3 text-sm text-[#243128] outline-none transition focus:border-[#7f9975] focus:ring-4 focus:ring-[#dfe7d9]"
                />
                <p className="mt-2 text-xs text-[#7b877e]">
                  Defaults to one hour when left blank.
                </p>
              </div>
            </div>

            <div>
              <label
                htmlFor="attached_to"
                className="text-sm font-bold text-[#3d4d39]"
              >
                Attach To
              </label>
              <select
                id="attached_to"
                name="attached_to"
                defaultValue=""
                className="mt-2 w-full rounded-xl border border-[#cfd9c9] bg-white px-4 py-3 text-sm text-[#243128] outline-none transition focus:border-[#7f9975] focus:ring-4 focus:ring-[#dfe7d9]"
              >
                <option value="">No client or lead</option>

                {clients.length > 0 ? (
                  <optgroup label="Clients">
                    {clients.map((client) => (
                      <option
                        key={`client-${client.id}`}
                        value={`client:${client.id}`}
                      >
                        {client.name || "Unnamed Client"}
                        {client.email ? ` (${client.email})` : ""}
                      </option>
                    ))}
                  </optgroup>
                ) : null}

                {leads.length > 0 ? (
                  <optgroup label="Active Leads">
                    {leads.map((lead) => (
                      <option key={`lead-${lead.id}`} value={`lead:${lead.id}`}>
                        {lead.name || "Unnamed Lead"}
                        {lead.email ? ` (${lead.email})` : ""}
                      </option>
                    ))}
                  </optgroup>
                ) : null}
              </select>
            </div>

            <div>
              <label
                htmlFor="guest_email"
                className="text-sm font-bold text-[#3d4d39]"
              >
                Guest Email
              </label>
              <input
                id="guest_email"
                name="guest_email"
                type="email"
                placeholder="client@email.com"
                className="mt-2 w-full rounded-xl border border-[#cfd9c9] bg-white px-4 py-3 text-sm text-[#243128] outline-none transition placeholder:text-[#a0aaa2] focus:border-[#7f9975] focus:ring-4 focus:ring-[#dfe7d9]"
              />
              <p className="mt-2 text-xs leading-5 text-[#7b877e]">
                Leave this blank to use the email already saved on the selected
                client or lead.
              </p>
            </div>

            <div>
              <label
                htmlFor="notes"
                className="text-sm font-bold text-[#3d4d39]"
              >
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={6}
                placeholder="Add meeting details, talking points, or anything you need to remember."
                className="mt-2 w-full resize-y rounded-xl border border-[#cfd9c9] bg-white px-4 py-3 text-sm leading-6 text-[#243128] outline-none transition placeholder:text-[#a0aaa2] focus:border-[#7f9975] focus:ring-4 focus:ring-[#dfe7d9]"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[#e5eae1] bg-[#fafbf8] px-6 py-5 sm:flex-row sm:justify-end lg:px-8">
            <Link
              href="/calendar"
              className="rounded-xl border border-[#cbd8c4] bg-white px-5 py-3 text-center text-sm font-semibold text-[#4d6247] transition hover:bg-[#f5f7f2]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="rounded-xl bg-[#647d5b] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4d6247]"
            >
              Save Calendar Item
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
