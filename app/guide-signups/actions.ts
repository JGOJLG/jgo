"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export async function markGuideSignupContacted(formData: FormData) {
  const signupId = Number(formData.get("signupId"));
  if (!Number.isInteger(signupId)) throw new Error("Invalid signup.");
  const supabase = await createClient();
  const { error } = await supabase.from("job_search_guide_leads").update({ funnel_status: "Contacted", contacted_at: new Date().toISOString() }).eq("id", signupId);
  if (error) throw new Error(error.message);
  revalidatePath("/guide-signups");
}

export async function createLeadFromGuideSignup(formData: FormData) {
  const signupId = Number(formData.get("signupId"));
  if (!Number.isInteger(signupId)) throw new Error("Invalid signup.");
  const supabase = await createClient();
  const { data: signup, error: signupError } = await supabase.from("job_search_guide_leads").select("id,first_name,email,created_at,converted_client_id").eq("id", signupId).single();
  if (signupError || !signup) throw new Error(signupError?.message || "Signup not found.");
  if (signup.converted_client_id) redirect(`/clients/${signup.converted_client_id}`);

  const { data: existing } = await supabase.from("clients").select("id").ilike("email", signup.email).limit(1).maybeSingle();
  if (existing?.id) {
    await supabase.from("job_search_guide_leads").update({ funnel_status: "Converted to Lead", converted_client_id: existing.id }).eq("id", signupId);
    revalidatePath("/guide-signups");
    redirect(`/clients/${existing.id}`);
  }

  const signupDate = new Date(signup.created_at).toISOString().slice(0, 10);
  const { data: client, error: clientError } = await supabase.from("clients").insert({
    name: signup.first_name?.trim() || signup.email,
    email: signup.email,
    lead_source: "Website",
    lead_source_detail: "Job Seeker Survival Guide",
    client_type: "Lead",
    status: "Lead",
    is_repeat_client: false,
    intake_date: signupDate,
    date_reached_out: signupDate,
    project_notes: "Originally entered JGO through the Job Seeker Survival Guide."
  }).select("id").single();
  if (clientError || !client) throw new Error(clientError?.message || "Unable to create lead.");

  await supabase.from("client_timeline").insert({ client_id: client.id, event_type: "lead_created", title: "Lead Created", status: "Complete", completed_at: new Date().toISOString() });
  await supabase.from("job_search_guide_leads").update({ funnel_status: "Converted to Lead", converted_client_id: client.id }).eq("id", signupId);
  revalidatePath("/guide-signups"); revalidatePath("/clients"); revalidatePath("/");
  redirect(`/clients/${client.id}`);
}
