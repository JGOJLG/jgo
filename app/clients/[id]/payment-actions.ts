"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

export async function recordServicePayment(formData: FormData) {
  const clientId = Number(formData.get("clientId"));
  const serviceId = Number(formData.get("serviceId"));
  const amountReceived = Number(formData.get("amountReceived"));
  const paymentMethod = String(formData.get("paymentMethod") || "").trim() || null;
  const paymentDate = String(formData.get("paymentDate") || "").trim() || new Date().toISOString().slice(0, 10);
  const extraType = String(formData.get("extraType") || "").trim();
  const paymentNote = String(formData.get("paymentNote") || "").trim();

  if (!Number.isInteger(clientId) || clientId <= 0 || !Number.isInteger(serviceId) || serviceId <= 0) throw new Error("Invalid client or service.");
  if (!Number.isFinite(amountReceived) || amountReceived < 0) throw new Error("Enter a valid amount received.");

  const supabase = await createClient();
  const { data: service, error: lookupError } = await supabase
    .from("client_services")
    .select("price,service")
    .eq("id", serviceId)
    .eq("client_id", clientId)
    .single();

  if (lookupError || !service) throw new Error(lookupError?.message || "Service not found.");

  const invoiceAmount = Number(service.price || 0);
  const paymentStatus = amountReceived <= 0 ? "Open" : invoiceAmount > 0 && amountReceived < invoiceAmount ? "Partial" : "Paid";
  const extraAmount = Math.max(0, amountReceived - invoiceAmount);
  const notes = ["Recorded from client profile."];
  if (extraAmount > 0) notes.push(`Extra payment: $${extraAmount.toFixed(2)}${extraType ? ` (${extraType})` : ""}.`);
  if (paymentNote) notes.push(paymentNote);

  const { error: serviceError } = await supabase
    .from("client_services")
    .update({
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      payment_date: amountReceived > 0 ? paymentDate : null,
      amount_received: amountReceived,
      updated_at: new Date().toISOString(),
    })
    .eq("id", serviceId)
    .eq("client_id", clientId);
  if (serviceError) throw new Error(serviceError.message);

  await supabase.from("clients").update({ payment_status: paymentStatus }).eq("id", clientId);

  const { error: deleteError } = await supabase.from("payments").delete().eq("client_id", clientId).eq("client_service_id", serviceId);
  if (deleteError) throw new Error(deleteError.message);

  if (amountReceived > 0) {
    const { error: paymentError } = await supabase.from("payments").insert({
      client_id: clientId,
      client_service_id: serviceId,
      amount: amountReceived,
      payment_date: paymentDate,
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      notes: notes.join(" "),
    });
    if (paymentError) throw new Error(paymentError.message);
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/jgo-clients");
  revalidatePath("/revenue");
  revalidatePath("/");
}
