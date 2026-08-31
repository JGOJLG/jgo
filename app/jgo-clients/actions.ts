"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

function text(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function optional(value: FormDataEntryValue | null) {
  const valueText = text(value);
  return valueText || null;
}

function money(value: FormDataEntryValue | null) {
  const parsed = Number(String(value ?? "0").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function refresh(clientId?: number) {
  revalidatePath("/jgo-clients");
  revalidatePath("/revenue");
  revalidatePath("/");
  revalidatePath("/clients");
  if (clientId) revalidatePath(`/clients/${clientId}`);
}

export async function createJgoClientRow(formData: FormData) {
  const supabase = await createClient();
  const clientName = text(formData.get("clientName"));
  const service = text(formData.get("service")) || "Other";
  const amountOwed = money(formData.get("amountOwed"));
  const serviceDate = optional(formData.get("serviceDate"));

  if (!clientName) throw new Error("Client name is required.");

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({ name: clientName, service, status: "Active", client_type: "Client", price: amountOwed, payment_status: "Open", intake_date: serviceDate })
    .select("id")
    .single();

  if (clientError || !client) throw new Error(clientError?.message || "Unable to create client.");

  const { error: serviceError } = await supabase.from("client_services").insert({
    client_id: client.id, service, price: amountOwed, status: "Received", payment_status: "Open", date_added: serviceDate, service_date: serviceDate, amount_received: 0,
  });

  if (serviceError) {
    await supabase.from("clients").delete().eq("id", client.id);
    throw new Error(serviceError.message);
  }
  refresh(client.id);
}

export async function updateJgoClientRow(formData: FormData) {
  const supabase = await createClient();
  const clientId = Number(formData.get("clientId"));
  const serviceId = Number(formData.get("serviceId"));
  if (!Number.isInteger(clientId) || !Number.isInteger(serviceId)) throw new Error("Invalid row.");

  const clientName = text(formData.get("clientName"));
  const service = text(formData.get("service")) || "Other";
  const serviceDate = optional(formData.get("serviceDate"));
  const amountOwed = money(formData.get("amountOwed"));
  const amountReceived = Math.max(0, money(formData.get("amountReceived")));
  const paymentDate = optional(formData.get("paymentDate"));
  const paymentMethod = optional(formData.get("paymentMethod"));
  const notes = optional(formData.get("notes"));
  if (!clientName) throw new Error("Client name is required.");

  const paymentStatus = amountReceived <= 0 ? "Open" : amountOwed > 0 && amountReceived >= amountOwed ? "Paid" : "Partial";
  const effectivePaymentDate = amountReceived > 0 ? paymentDate || new Date().toISOString().slice(0, 10) : null;

  const [{ error: clientError }, { error: serviceError }] = await Promise.all([
    supabase.from("clients").update({ name: clientName, service, price: amountOwed, payment_status: paymentStatus }).eq("id", clientId),
    supabase.from("client_services").update({ service, service_date: serviceDate, date_added: serviceDate, price: amountOwed, amount_received: amountReceived, payment_date: effectivePaymentDate, payment_method: paymentMethod, payment_status: paymentStatus, notes, updated_at: new Date().toISOString() }).eq("id", serviceId).eq("client_id", clientId),
  ]);
  if (clientError) throw new Error(clientError.message);
  if (serviceError) throw new Error(serviceError.message);

  const { error: deletePaymentError } = await supabase.from("payments").delete().eq("client_id", clientId).eq("client_service_id", serviceId);
  if (deletePaymentError) throw new Error(deletePaymentError.message);

  if (amountReceived > 0) {
    const { error: paymentError } = await supabase.from("payments").insert({ client_id: clientId, client_service_id: serviceId, amount: amountReceived, payment_date: effectivePaymentDate, payment_status: paymentStatus, payment_method: paymentMethod, notes: "Synced from JGO Clients spreadsheet." });
    if (paymentError) throw new Error(paymentError.message);
  }
  refresh(clientId);
}

export async function deleteJgoClientRow(formData: FormData) {
  const supabase = await createClient();
  const clientId = Number(formData.get("clientId"));
  const serviceId = Number(formData.get("serviceId"));
  if (!Number.isInteger(clientId) || !Number.isInteger(serviceId)) throw new Error("Invalid row.");

  const { error: paymentError } = await supabase.from("payments").delete().eq("client_id", clientId).eq("client_service_id", serviceId);
  if (paymentError) throw new Error(paymentError.message);

  const { error: serviceError } = await supabase.from("client_services").delete().eq("id", serviceId).eq("client_id", clientId);
  if (serviceError) throw new Error(serviceError.message);

  const { count, error: countError } = await supabase.from("client_services").select("id", { count: "exact", head: true }).eq("client_id", clientId).is("deleted_at", null);
  if (countError) throw new Error(countError.message);
  if ((count ?? 0) === 0) {
    const { error: clientError } = await supabase.from("clients").delete().eq("id", clientId);
    if (clientError) throw new Error(clientError.message);
  }

  refresh(clientId);
}
