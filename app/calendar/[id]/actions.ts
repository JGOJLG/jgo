"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export type CalendarActionState = {
  error?: string;
};

function getRequiredText(
  formData: FormData,
  field: string,
  label: string
) {
  const value = String(formData.get(field) || "").trim();

  if (!value) {
    throw new Error(`${label} is required.`);
  }

  return value;
}

function getTimeZoneOffset(
  date: Date,
  timeZone: string
) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
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

  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );

  return asUtc - date.getTime();
}

function easternLocalToIso(value: string) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/
  );

  if (!match) {
    throw new Error("Enter a valid date and time.");
  }

  const [, year, month, day, hour, minute] = match;

  const utcGuess = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    0
  );

  let date = new Date(utcGuess);
  let offset = getTimeZoneOffset(
    date,
    "America/New_York"
  );

  date = new Date(utcGuess - offset);

  const correctedOffset = getTimeZoneOffset(
    date,
    "America/New_York"
  );

  if (correctedOffset !== offset) {
    date = new Date(utcGuess - correctedOffset);
  }

  return date.toISOString();
}

export async function updateCalendarEvent(
  _previousState: CalendarActionState,
  formData: FormData
): Promise<CalendarActionState> {
  const eventId = Number(formData.get("eventId"));

  if (!Number.isInteger(eventId) || eventId <= 0) {
    return { error: "Invalid calendar event." };
  }

  try {
    const title = getRequiredText(
      formData,
      "title",
      "Title"
    );

    const eventType = getRequiredText(
      formData,
      "eventType",
      "Event type"
    );

    const startValue = getRequiredText(
      formData,
      "startAt",
      "Start date and time"
    );

    const endValue = String(
      formData.get("endAt") || ""
    ).trim();

    const guestEmail = String(
      formData.get("guestEmail") || ""
    ).trim();

    const notes = String(
      formData.get("notes") || ""
    ).trim();

    const status = String(
      formData.get("status") || "Scheduled"
    ).trim();

    const startAt = easternLocalToIso(startValue);
    const endAt = endValue
      ? easternLocalToIso(endValue)
      : null;

    if (
      endAt &&
      new Date(endAt).getTime() <=
        new Date(startAt).getTime()
    ) {
      return {
        error:
          "The end time must be later than the start time.",
      };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("calendar_events")
      .update({
        title,
        event_type: eventType,
        start_at: startAt,
        end_at: endAt,
        guest_email: guestEmail || null,
        notes: notes || null,
        status,
      })
      .eq("id", eventId);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/calendar");
    revalidatePath(`/calendar/${eventId}`);
    revalidatePath("/");

    redirect(`/calendar/${eventId}`);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to update the calendar event.",
    };
  }
}

export async function deleteCalendarEvent(
  _previousState: CalendarActionState,
  formData: FormData
): Promise<CalendarActionState> {
  const eventId = Number(formData.get("eventId"));

  if (!Number.isInteger(eventId) || eventId <= 0) {
    return { error: "Invalid calendar event." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", eventId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/calendar");
  revalidatePath("/");
  redirect("/calendar");
}
