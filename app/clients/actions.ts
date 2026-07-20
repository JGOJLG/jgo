"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

function getClientId(formData: FormData): number {
  const rawClientId = formData.get("clientId");
  const clientId = Number(rawClientId);

  if (!Number.isInteger(clientId) || clientId <= 0) {
    throw new Error("Invalid client ID.");
  }

  return clientId;
}

async function updateClientStatus(
  clientId: number,
  status: "Active" | "Archived"
): Promise<void> {
  const supabase = await createClient();

  const { data: existingClient, error: lookupError } = await supabase
    .from("clients")
    .select("id, status")
    .eq("id", clientId)
    .maybeSingle();

  if (lookupError) {
    throw new Error(
      `Unable to find client before updating status: ${lookupError.message}`
    );
  }

  if (!existingClient) {
    throw new Error(
      "The client could not be found or your Supabase security policy does not allow access to it."
    );
  }

  const { data: updatedClients, error: updateError } = await supabase
    .from("clients")
    .update({ status })
    .eq("id", clientId)
    .select("id, status");

  if (updateError) {
    throw new Error(
      `Unable to update client status to ${status}: ${updateError.message}`
    );
  }

  if (!updatedClients || updatedClients.length === 0) {
    throw new Error(
      `Supabase did not update the client. The most likely cause is that the clients table does not have an UPDATE security policy for the signed-in user.`
    );
  }

  const updatedClient = updatedClients[0];

  if (updatedClient.id !== clientId) {
    throw new Error(
      "Client status verification failed because Supabase returned a different client."
    );
  }

  if (updatedClient.status !== status) {
    throw new Error(
      `Client status verification failed. Expected ${status}, but Supabase returned ${updatedClient.status ?? "no status"}.`
    );
  }
}

function revalidateClientPages(clientId: number): void {
  revalidatePath("/");
  revalidatePath("/clients");
  revalidatePath("/clients/archived");
  revalidatePath(`/clients/${clientId}`);
}

export async function archiveClient(formData: FormData): Promise<never> {
  const clientId = getClientId(formData);

  await updateClientStatus(clientId, "Archived");

  revalidateClientPages(clientId);

  redirect("/clients?message=archived");
}

export async function restoreClient(formData: FormData): Promise<never> {
  const clientId = getClientId(formData);

  await updateClientStatus(clientId, "Active");

  revalidateClientPages(clientId);

  redirect(`/clients/${clientId}?message=restored`);
}

export async function deleteClientPermanently(
  formData: FormData
): Promise<never> {
  const clientId = getClientId(formData);
  const supabase = await createClient();

  const relatedTables = [
    "follow_ups",
    "payments",
    "client_services",
    "client_files",
  ] as const;

  for (const table of relatedTables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("client_id", clientId);

    if (error) {
      throw new Error(
        `Unable to delete related records from ${table}: ${error.message}`
      );
    }
  }

  const { data: deletedClients, error: clientError } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId)
    .select("id");

  if (clientError) {
    throw new Error(`Unable to delete client: ${clientError.message}`);
  }

  if (!deletedClients || deletedClients.length === 0) {
    throw new Error(
      "Supabase did not delete the client. Check the DELETE security policy on the clients table."
    );
  }

  revalidatePath("/");
  revalidatePath("/clients");
  revalidatePath("/clients/archived");

  redirect("/clients?message=deleted");
}
