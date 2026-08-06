import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import CalendarEventEditor from "./CalendarEventEditor";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CalendarEvent = {
  id: number;
  title: string;
  event_type: string;
  start_at: string;
  end_at: string | null;
  client_id: number | null;
  intake_call_id: number | null;
  guest_email: string | null;
  notes: string | null;
  status: string | null;
};

type CalendarEventPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(value));
}

function toEasternLocalInput(
  value: string | null
) {
  if (!value) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

function getTypeLabel(value: string) {
  const normalized = value
    .trim()
    .toLowerCase();

  if (
    normalized === "follow_up" ||
    normalized === "follow-up"
  ) {
    return "Follow-Up";
  }

  if (normalized === "reminder") {
    return "General Reminder";
  }

  if (
    normalized === "interview" ||
    normalized === "client interview"
  ) {
    return "Client Interview";
  }

  if (
    normalized === "free15" ||
    normalized === "free 15"
  ) {
    return "Free 15";
  }

  if (
    normalized === "client_session" ||
    normalized === "client session"
  ) {
    return "Client Session";
  }

  return "Appointment";
}

function getEditorEventType(value: string) {
  const normalized = value
    .trim()
    .toLowerCase();

  if (
    normalized === "client interview" ||
    normalized === "interview"
  ) {
    return "interview";
  }

  if (
    normalized === "free 15" ||
    normalized === "free15"
  ) {
    return "free15";
  }

  if (
    normalized === "client session" ||
    normalized === "client_session"
  ) {
    return "client_session";
  }

  if (
    normalized === "follow-up" ||
    normalized === "follow_up"
  ) {
    return "follow_up";
  }

  if (normalized === "reminder") {
    return "reminder";
  }

  return "appointment";
}

function toGoogleCalendarDate(value: string) {
  return new Date(value)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function buildGoogleCalendarUrl(
  event: CalendarEvent
) {
  const endAt =
    event.end_at ||
    new Date(
      new Date(event.start_at).getTime() +
        60 * 60 * 1000
    ).toISOString();

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toGoogleCalendarDate(
      event.start_at
    )}/${toGoogleCalendarDate(endAt)}`,
    details: event.notes || "",
  });

  if (event.guest_email) {
    params.set("add", event.guest_email);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildMailtoUrl(event: CalendarEvent) {
  const subject = `Calendar invitation: ${event.title}`;

  const body = [
    "Hi,",
    "",
    `Here are the details for ${event.title}:`,
    "",
    `Start: ${formatDateTime(event.start_at)}`,
    event.end_at
      ? `End: ${formatDateTime(event.end_at)}`
      : "",
    event.notes ? `Notes: ${event.notes}` : "",
    "",
    "I have attached the calendar invitation to this email.",
    "",
    "Best,",
    "Jen",
  ]
    .filter(Boolean)
    .join("\n");

  return `mailto:${encodeURIComponent(
    event.guest_email || ""
  )}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}

export default async function CalendarEventPage({
  params,
}: CalendarEventPageProps) {
  const { id } = await params;
  const eventId = Number(id);

  if (
    !Number.isInteger(eventId) ||
    eventId <= 0
  ) {
    notFound();
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("calendar_events")
    .select(
      "id, title, event_type, start_at, end_at, client_id, intake_call_id, guest_email, notes, status"
    )
    .eq("id", eventId)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const event = data as CalendarEvent;

  let attachedName: string | null = null;
  let attachedHref: string | null = null;

  if (event.client_id) {
    const { data: client } = await supabase
      .from("clients")
      .select("name")
      .eq("id", event.client_id)
      .maybeSingle();

    attachedName = client?.name || "Client";
    attachedHref = `/clients/${event.client_id}`;
  } else if (event.intake_call_id) {
    const { data: lead } = await supabase
      .from("intake_calls")
      .select("name")
      .eq("id", event.intake_call_id)
      .maybeSingle();

    attachedName = lead?.name || "Lead";
    attachedHref = `/leads/${event.intake_call_id}`;
  }

  const googleCalendarUrl =
    buildGoogleCalendarUrl(event);

  const mailtoUrl = buildMailtoUrl(event);

  return (
    <section className="min-w-0 flex-1 bg-[#f6f5ef]">
      <header className="border-b border-[#dfe6db] bg-[#fbfaf6] px-6 py-7 lg:px-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#7f9975]">
              {getTypeLabel(event.event_type)}
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#243128]">
              {event.title}
            </h1>

            <p className="mt-2 text-sm text-[#708075]">
              View, edit, send, or delete this calendar item.
            </p>
          </div>

          <Link
            href="/calendar"
            className="w-fit rounded-xl border border-[#cbd8c4] bg-white px-5 py-3 text-sm font-semibold text-[#4d6247] shadow-sm transition hover:bg-[#f5f7f2]"
          >
            ← Back to Calendar
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:p-10">
        <div className="space-y-6">
          <section className="rounded-3xl border border-[#dfe6db] bg-white p-6 shadow-sm lg:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#eef3ea] px-3 py-1 text-xs font-semibold text-[#5d7556]">
                  {getTypeLabel(event.event_type)}
                </span>

                <span className="rounded-full bg-[#f6f1e5] px-3 py-1 text-xs font-semibold text-[#826b3f]">
                  {event.status || "Scheduled"}
                </span>
              </div>

              <CalendarEventEditor
                event={{
                  id: event.id,
                  title: event.title,
                  eventType: getEditorEventType(
                    event.event_type
                  ),
                  startAt: toEasternLocalInput(
                    event.start_at
                  ),
                  endAt: toEasternLocalInput(
                    event.end_at
                  ),
                  guestEmail:
                    event.guest_email || "",
                  notes: event.notes || "",
                  status:
                    event.status || "Scheduled",
                }}
              />
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <p className={detailLabelStyle}>
                  Starts
                </p>

                <p className={detailValueStyle}>
                  {formatDateTime(event.start_at)}
                </p>
              </div>

              {event.end_at ? (
                <div>
                  <p className={detailLabelStyle}>
                    Ends
                  </p>

                  <p className={detailValueStyle}>
                    {formatDateTime(event.end_at)}
                  </p>
                </div>
              ) : null}

              {attachedName && attachedHref ? (
                <div>
                  <p className={detailLabelStyle}>
                    Attached To
                  </p>

                  <Link
                    href={attachedHref}
                    className="mt-2 inline-block text-base font-bold text-[#58704f] hover:underline"
                  >
                    {attachedName}
                  </Link>
                </div>
              ) : null}

              {event.guest_email ? (
                <div>
                  <p className={detailLabelStyle}>
                    Guest Email
                  </p>

                  <p className="mt-2 break-words text-base font-semibold text-[#243128]">
                    {event.guest_email}
                  </p>
                </div>
              ) : null}
            </div>

            {event.notes ? (
              <div className="mt-7 border-t border-[#edf0ea] pt-7">
                <p className={detailLabelStyle}>
                  Notes
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#59665d]">
                  {event.notes}
                </p>
              </div>
            ) : null}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-[#dce4d7] bg-[#eaf0e5] p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f8966]">
              Calendar Invite
            </p>

            <h2 className="mt-2 text-xl font-bold text-[#243128]">
              Add or Send This Event
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#637166]">
              Download an invite, add it to Google Calendar,
              or open an email to the guest.
            </p>

            <div className="mt-5 space-y-3">
              <a
                href={`/api/calendar-events/${event.id}/invite`}
                className="block rounded-xl bg-[#647d5b] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#4d6247]"
              >
                Download Calendar Invite
              </a>

              <a
                href={googleCalendarUrl}
                target="_blank"
                rel="noreferrer"
                className="block rounded-xl border border-[#bdcbb7] bg-white px-5 py-3 text-center text-sm font-semibold text-[#4d6247] transition hover:bg-[#f8faf6]"
              >
                Add to Google Calendar
              </a>

              {event.guest_email ? (
                <a
                  href={mailtoUrl}
                  className="block rounded-xl border border-[#bdcbb7] bg-white px-5 py-3 text-center text-sm font-semibold text-[#4d6247] transition hover:bg-[#f8faf6]"
                >
                  Open Email to Guest
                </a>
              ) : null}
            </div>
          </section>

          <section className="rounded-3xl border border-[#dfe6db] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#243128]">
              Quick Tip
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#66736a]">
              Click any item on the month view, Today&apos;s
              Agenda, or Coming Up list to return here and edit
              or delete it.
            </p>
          </section>
        </aside>
      </div>
    </section>
  );
}

const detailLabelStyle =
  "text-xs font-semibold uppercase tracking-[0.15em] text-[#7f9975]";

const detailValueStyle =
  "mt-2 text-lg font-bold text-[#243128]";
