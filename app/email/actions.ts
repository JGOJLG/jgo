"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

export async function createEmailTemplate(input: {
  name: string;
  subject: string;
  body: string;
}) {
  const supabase = await createClient();
  const name = input.name.trim();
  const subject = input.subject.trim();
  const body = input.body.trim();

  if (!name || !subject || !body) {
    return { ok: false, error: "Add a template name, subject, and email body first." };
  }

  const { data, error } = await supabase
    .from("email_templates")
    .insert({ name, subject, body })
    .select("id, name, subject, body")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/email");
  return { ok: true, template: data };
}

export async function deleteEmailTemplate(id: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("email_templates").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/email");
  return { ok: true };
}

export async function createEmailMessage(input: {
  clientId: number | null;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  body: string;
  templateId?: number | null;
}) {
  const supabase = await createClient();

  if (!input.recipientEmail.trim() || !input.subject.trim() || !input.body.trim()) {
    return { ok: false, error: "Choose a recipient and add a subject and message first." };
  }

  const { data, error } = await supabase
    .from("email_messages")
    .insert({
      client_id: input.clientId,
      recipient_name: input.recipientName || null,
      recipient_email: input.recipientEmail.trim(),
      subject: input.subject.trim(),
      body: input.body.trim(),
      status: "sent",
      template_id: input.templateId ?? null,
      sent_at: new Date().toISOString(),
    })
    .select("id, client_id, recipient_name, recipient_email, subject, body, template_id, sent_at")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/email");
  return { ok: true, message: data };
}
