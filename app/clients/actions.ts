"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

export async function updateFollowUpStatus(formData: FormData) {
  const clientId = Number(formData.get("clientId"));
  const followUpStatus = String(formData.get("followUpStatus") || "");

  if (!Number.isInteger(clientId) || clientId <= 0) {
    throw new Error("Invalid client ID.");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("clients")
    .update({ follow_up_status: followUpStatus || null })
    .eq("id", clientId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/clients");
  revalidatePath("/");
}