"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

export type EwcEntryType = "Session" | "LinkedIn" | "Other";

function cleanText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function cleanOptional(value: FormDataEntryValue | null) {
  const text = cleanText(value);
  return text === "" ? null : text;
}

function cleanNumber(value: FormDataEntryValue | null) {
  const parsed = Number(String(value ?? "0").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function createEwcEntry(section: EwcEntryType) {
  const supabase = await createClient();

  const { data: firstRow } = await supabase
    .from("ewc_entries")
    .select("sort_order")
    .eq("section", section)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("ewc_entries")
    .insert({
      section,
      client_name: "",
      service_date: null,
      service_type:
        section === "Session"
          ? "Session"
          : section === "LinkedIn"
            ? "LinkedIn"
            : "Other",
      amount_owed: 0,
      amount_paid: 0,
      stripe_fee: 0,
      date_paid: null,
      notes: null,
      sort_order: (firstRow?.sort_order ?? 1) - 1,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/ewc");
  return data;
}

export async function updateEwcEntry(formData: FormData) {
  const supabase = await createClient();
  const id = Number(formData.get("id"));
  if (!id) throw new Error("EWC entry ID is required.");

  const { error } = await supabase
    .from("ewc_entries")
    .update({
      client_name: cleanText(formData.get("client_name")),
      service_date: cleanOptional(formData.get("service_date")),
      service_type: cleanText(formData.get("service_type")),
      amount_owed: cleanNumber(formData.get("amount_owed")),
      amount_paid: cleanNumber(formData.get("amount_paid")),
      stripe_fee: cleanNumber(formData.get("stripe_fee")),
      date_paid: cleanOptional(formData.get("date_paid")),
      notes: cleanOptional(formData.get("notes")),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/ewc");
}

export async function updateEwcMoved(id: number, moved: boolean) {
  const supabase = await createClient();
  if (!id) throw new Error("EWC entry ID is required.");

  const { error } = await supabase
    .from("ewc_entries")
    .update({ moved, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/ewc");
}

export async function deleteEwcEntry(id: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("ewc_entries").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/ewc");
}

export async function reorderEwcEntries(section: EwcEntryType, orderedIds: number[]) {
  const supabase = await createClient();
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("ewc_entries")
        .update({ sort_order: index + 1, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("section", section),
    ),
  );

  const failed = results.find((result) => result.error);
  if (failed?.error) throw new Error(failed.error.message);
  revalidatePath("/ewc");
}
