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

function getServiceId(formData: FormData) {
  const value = Number(formData.get("serviceId"));

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error("Invalid service ID.");
  }

  return value;
}

function revalidateClientData(clientId: number) {
  revalidatePath("/");
  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/revenue");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  revalidatePath("/leads");
}

export async function markServicePaid(formData: FormData) {
  const clientId = getClientId(formData);
  const serviceId = getServiceId(formData);
  const supabase = await createClient();

  const { data: service, error: serviceError } = await supabase
    .from("client_services")
    .select("id, price, payment_status")
    .eq("id", serviceId)
    .eq("client_id", clientId)
    .single();

  if (serviceError || !service) {
    throw new Error(
      `Unable to load service: ${serviceError?.message || "Service not found."}`
    );
  }

  if (service.payment_status !== "Paid") {
    const { error: updateError } = await supabase
      .from("client_services")
      .update({
        payment_status: "Paid",
      })
      .eq("id", serviceId)
      .eq("client_id", clientId);

    if (updateError) {
      throw new Error(`Unable to mark service paid: ${updateError.message}`);
    }
  }

  const { data: existingPayment, error: existingPaymentError } = await supabase
    .from("payments")
    .select("id")
    .eq("client_service_id", serviceId)
    .eq("payment_status", "Paid")
    .limit(1)
    .maybeSingle();

  if (existingPaymentError) {
    throw new Error(
      `Unable to check payment history: ${existingPaymentError.message}`
    );
  }

  if (!existingPayment) {
    const { error: paymentError } = await supabase
      .from("payments")
      .insert({
        client_id: clientId,
        client_service_id: serviceId,
        amount: Number(service.price ?? 0),
        payment_date: new Date().toISOString().slice(0, 10),
        payment_method: null,
        payment_status: "Paid",
        notes: "Marked paid from client profile.",
      });

    if (paymentError) {
      throw new Error(
        `Service was marked paid, but payment history could not be added: ${paymentError.message}`
      );
    }
  }

  const { data: unpaidServices, error: unpaidError } = await supabase
    .from("client_services")
    .select("id")
    .eq("client_id", clientId)
    .neq("payment_status", "Paid")
    .limit(1);

  if (unpaidError) {
    throw new Error(
      `Payment was saved, but client payment status could not be checked: ${unpaidError.message}`
    );
  }

  const clientPaymentStatus =
    (unpaidServices ?? []).length === 0 ? "Paid" : "Open";

  const { error: clientUpdateError } = await supabase
    .from("clients")
    .update({
      payment_status: clientPaymentStatus,
    })
    .eq("id", clientId);

  if (clientUpdateError) {
    throw new Error(
      `Payment was saved, but client payment status could not be updated: ${clientUpdateError.message}`
    );
  }

  revalidateClientData(clientId);
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

  revalidateClientData(clientId);

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

  revalidateClientData(clientId);

  redirect(`/clients/${clientId}`);
}

export async function deleteClientPermanently(formData: FormData) {
  const clientId = getClientId(formData);
  const supabase = await createClient();

  const tasksResult = await supabase
    .from("tasks")
    .delete()
    .eq("client_id", clientId);

  if (tasksResult.error) {
    throw new Error(
      `Unable to delete client tasks: ${tasksResult.error.message}`
    );
  }

  const calendarResult = await supabase
    .from("calendar_events")
    .delete()
    .eq("client_id", clientId);

  if (calendarResult.error) {
    throw new Error(
      `Unable to delete client calendar events: ${calendarResult.error.message}`
    );
  }

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

  const leadResetResult = await supabase
    .from("intake_calls")
    .update({
      converted_client_id: null,
      converted_to_client: false,
    })
    .eq("converted_client_id", clientId);

  if (leadResetResult.error) {
    throw new Error(
      `Unable to disconnect the original lead: ${leadResetResult.error.message}`
    );
  }

  const { error: clientError } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId);

  if (clientError) {
    throw new Error(`Unable to delete client: ${clientError.message}`);
  }

  revalidateClientData(clientId);

  redirect("/clients?message=deleted");
}
