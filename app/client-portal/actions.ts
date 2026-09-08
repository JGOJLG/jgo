"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export async function claimClientPortal() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login");

  const { data: existing } = await supabase
    .from("clients")
    .select("id")
    .eq("portal_user_id", user.id)
    .maybeSingle();
  if (existing) redirect("/client-portal");

  const { data: client, error } = await supabase
    .from("clients")
    .select("id,email")
    .ilike("email", user.email)
    .is("portal_user_id", null)
    .maybeSingle();
  if (error || !client) redirect("/client-portal?error=no-client");

  const { error: updateError } = await supabase
    .from("clients")
    .update({ portal_user_id: user.id })
    .eq("id", client.id)
    .is("portal_user_id", null);
  if (updateError) redirect("/client-portal?error=claim");
  redirect("/client-portal");
}

export async function addJob(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const company = String(formData.get("company") || "").trim();
  const jobTitle = String(formData.get("jobTitle") || "").trim();
  if (!company || !jobTitle) throw new Error("Company and job title are required.");

  const { error } = await supabase.from("client_job_applications").insert({
    user_id: user.id,
    company,
    job_title: jobTitle,
    status: "Interested",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/client-portal/jobs");
}

export async function updateJob(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = Number(formData.get("id"));
  const clean = (k: string) => String(formData.get(k) || "").trim() || null;
  const { error } = await supabase
    .from("client_job_applications")
    .update({
      company: clean("company"),
      job_title: clean("jobTitle"),
      status: clean("status") || "Interested",
      date_applied: clean("dateApplied"),
      next_step: clean("nextStep"),
      next_step_date: clean("nextStepDate"),
      job_url: clean("jobUrl"),
      notes: clean("notes"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("archived_at", null);
  if (error) throw new Error(error.message);
  revalidatePath("/client-portal/jobs");
  revalidatePath("/client-portal");
}

export async function setOfferOutcome(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = Number(formData.get("id"));
  const outcome = String(formData.get("outcome") || "");
  if (!Number.isFinite(id) || !["accepted", "declined"].includes(outcome)) {
    throw new Error("Invalid offer update.");
  }

  const status = outcome === "accepted" ? "Offer Accepted" : "Offer Declined";
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("client_job_applications")
    .update({
      status,
      next_step: null,
      next_step_date: null,
      updated_at: now,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "Offer")
    .is("archived_at", null);

  if (error) throw new Error(error.message);
  revalidatePath("/client-portal/jobs");
  revalidatePath("/client-portal");
}

export async function deleteJob(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = Number(formData.get("id"));
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("client_job_applications")
    .update({
      archived_at: now,
      archived_by: user.id,
      archive_reason: "Deleted from client portal",
      updated_at: now,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("archived_at", null);
  if (error) throw new Error(error.message);
  revalidatePath("/client-portal/jobs");
}

export async function restoreJob(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = Number(formData.get("id"));
  const { error } = await supabase
    .from("client_job_applications")
    .update({
      archived_at: null,
      archived_by: null,
      archive_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .not("archived_at", "is", null);
  if (error) throw new Error(error.message);
  revalidatePath("/client-portal/jobs");
}

export async function resetJobs() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("client_job_applications")
    .update({
      archived_at: now,
      archived_by: user.id,
      archive_reason: "Tracker reset for QA/testing",
      updated_at: now,
    })
    .eq("user_id", user.id)
    .is("archived_at", null);
  if (error) throw new Error(error.message);
  revalidatePath("/client-portal/jobs");
}
