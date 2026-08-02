"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export async function createInterview(formData: FormData) {
  const clientId = Number(formData.get("clientId"));
  const title = String(formData.get("title") || "").trim();
  const interviewDate = String(formData.get("interviewDate") || "");
  const interviewTime = String(formData.get("interviewTime") || "");
  const durationMinutes = Number(formData.get("durationMinutes") || 60);
  const notes = String(formData.get("notes") || "").trim();

  if (!Number.isInteger(clientId) || clientId <= 0) {
    throw new Error("Invalid client ID.");
  }

  if (!title) {
    throw new Error("Please enter an interview title.");
  }

  let startAt: Date | null = null;
  let endAt: Date | null = null;

  if (interviewDate) {
    const timeValue = interviewTime || "12:00";
    startAt = new Date(`${interviewDate}T${timeValue}:00`);

    if (Number.isNaN(startAt.getTime())) {
      throw new Error("Invalid interview date or time.");
    }

    endAt = new Date(startAt.getTime() + durationMinutes * 60_000);
  } else if (interviewTime) {
    throw new Error("Please choose a date if you select a time.");
  }

  const supabase = await createClient();

  const { error } = await supabase.from("calendar_events").insert({
    title,
    event_type: "interview",
    notes: notes || null,
    start_at: startAt ? startAt.toISOString() : null,
    end_at: endAt ? endAt.toISOString() : null,
    client_id: clientId,
    intake_call_id: null,
    status: "Scheduled",
  });

  if (error) {
    throw new Error(`Unable to add interview: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/calendar");
  revalidatePath(`/clients/${clientId}`);

  redirect(`/clients/${clientId}`);
}
