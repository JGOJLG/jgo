"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

export async function startTimer(input: {
  clientId: number | null;
  clientName: string;
}) {
  const supabase = await createClient();
  const clientName = input.clientName.trim();

  if (!clientName) return { ok: false, error: "Enter a client or name first." };

  const { data: existing } = await supabase
    .from("timer_sessions")
    .select("id, client_name")
    .is("ended_at", null)
    .maybeSingle();

  if (existing) {
    return {
      ok: false,
      error: `A timer is already running for ${existing.client_name}. Stop it first.`,
    };
  }

  const { data, error } = await supabase
    .from("timer_sessions")
    .insert({
      client_id: input.clientId,
      client_name: clientName,
      started_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/timer");
  if (input.clientId) revalidatePath(`/clients/${input.clientId}`);
  return { ok: true, session: data };
}

export async function stopTimer(sessionId: number) {
  const supabase = await createClient();

  const { data: session, error: fetchError } = await supabase
    .from("timer_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (fetchError || !session) {
    return { ok: false, error: fetchError?.message || "Timer session was not found." };
  }

  if (session.ended_at) return { ok: false, error: "This timer has already been stopped." };

  const endedAt = new Date();
  const durationSeconds = Math.max(
    0,
    Math.round(
      (endedAt.getTime() - new Date(session.started_at).getTime()) / 1000,
    ),
  );

  const { data, error } = await supabase
    .from("timer_sessions")
    .update({
      ended_at: endedAt.toISOString(),
      duration_seconds: durationSeconds,
    })
    .eq("id", sessionId)
    .select("*")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/timer");
  if (session.client_id) revalidatePath(`/clients/${session.client_id}`);
  return { ok: true, session: data };
}
