"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

function getClientId(formData: FormData) {
  const value = Number(formData.get("clientId"));

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error("Invalid client ID.");
  }

  return value;
}

export async function archiveClient(formData: FormData) {
  const clientId = getClientId(formData);
  const supabase = await createClient();

  const { error } = await supabase
    .from("clients")
    .update({
      status: "Archived",
    })
    .eq("id", clientId);

  if (error) {
    throw new Error(`Unable to archive client: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);

  redirect("/clients?message=archived");
}

export async function restoreClient(formData: FormData) {
  const clientId = getClientId(formData);
  const supabase = await createClient();

  const { error } = await supabase
    .from("clients")
    .update({
      status: "Active",
    })
    .eq("id", clientId);

  if (error) {
    throw new Error(`Unable to restore client: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);

  redirect(`/clients/${clientId}`);
}

export async function deleteClientPermanently(formData: FormData) {
  const clientId = getClientId(formData);
  const supabase = await createClient();

  const followUpsResult = await supabase
    .from("follow_ups")
    .delete()
    .eq("client_id", clientId);

  if (followUpsResult.error) {
    throw new Error(
      `Unable to delete client follow-ups: ${followUpsResult.error.message}`
    );
  }

  const paymentsResult = await supabase
    .from("payments")
    .delete()
    .eq("client_id", clientId);

  if (paymentsResult.error) {
    throw new Error(
      `Unable to delete client payments: ${paymentsResult.error.message}`
    );
  }

  const servicesResult = await supabase
    .from("client_services")
    .delete()
    .eq("client_id", clientId);

  if (servicesResult.error) {
    throw new Error(
      `Unable to delete client services: ${servicesResult.error.message}`
    );
  }

  const { error: clientError } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId);

  if (clientError) {
    throw new Error(`Unable to delete client: ${clientError.message}`);
  }

  revalidatePath("/");
  revalidatePath("/clients");

  redirect("/clients?message=deleted");
}