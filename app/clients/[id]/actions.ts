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

async function createTimelineEvent(
  clientId: number,
  eventType: string,
  title: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("client_timeline")
    .upsert(
      {
        client_id: clientId,
        event_type: eventType,
        title,
        status: "Complete",
        completed_at: new Date().toISOString(),
      },
      { onConflict: "client_id,event_type" }
    );

  if (error) {
    throw new Error(error.message);
  }
}

export async function convertToActiveClient(formData: FormData) {
  const clientId = getClientId(formData);

  const supabase = await createClient();

  const { error } = await supabase
    .from("clients")
    .update({
      status: "Active",
    })
    .eq("id", clientId);

  if (error) {
    throw new Error(error.message);
  }

  await createTimelineEvent(
    clientId,
    "converted_to_client",
    "Converted to Client"
  );

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  revalidatePath("/");
}


export async function revertToLead(formData: FormData) {
  const clientId = getClientId(formData);

  const supabase = await createClient();

  const { error } = await supabase
    .from("clients")
    .update({
      status: "Lead",
    })
    .eq("id", clientId);

  if (error) {
    throw new Error(error.message);
  }

  await createTimelineEvent(clientId, "reverted_to_lead", "Reverted to Lead");

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  revalidatePath("/");
}


/*
  CLIENT ACTIONS
*/

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
    throw new Error(error.message);
  }

  revalidatePath("/clients");
  revalidatePath("/");

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
    throw new Error(error.message);
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/");

  redirect(`/clients/${clientId}`);
}


export async function deleteClientPermanently(formData: FormData) {
  const clientId = getClientId(formData);
  const supabase = await createClient();

  async function deleteRelatedRecords(table: string) {
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

  await deleteRelatedRecords("calendar_events");
  await deleteRelatedRecords("follow_ups");
  await deleteRelatedRecords("tasks");
  await deleteRelatedRecords("client_notes");
  await deleteRelatedRecords("payments");
  await deleteRelatedRecords("client_timeline");
  await deleteRelatedRecords("client_services");

  const { data: deletedClient, error: clientDeleteError } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId)
    .select("id")
    .maybeSingle();

  if (clientDeleteError) {
    throw new Error(
      `Unable to delete client: ${clientDeleteError.message}`
    );
  }

  if (!deletedClient) {
    throw new Error(
      "The client was not deleted. The database did not return a deleted record."
    );
  }

  revalidatePath("/");
  revalidatePath("/clients");
  revalidatePath("/revenue");
  revalidatePath("/tasks");
  revalidatePath("/follow-ups");
  revalidatePath("/calendar");

  redirect("/clients?message=deleted");
}


/*
  SERVICE ACTIONS
*/

export async function updateServiceStatus(formData: FormData) {
  const clientId = getClientId(formData);
  const serviceId = getServiceId(formData);
  const status = String(formData.get("status") || "");

  if (!status) {
    throw new Error("Missing status.");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("client_services")
    .update({ status })
    .eq("id", serviceId)
    .eq("client_id", clientId);

  if (error) {
    throw new Error(error.message);
  }

  await createTimelineEvent(
    clientId,
    `service_${status.toLowerCase().replace(/\s+/g, "_")}`,
    status
  );

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/");
}


export async function markServicePaid(formData: FormData) {
  const clientId = getClientId(formData);
  const serviceId = getServiceId(formData);

  const supabase = await createClient();

  const { data: service, error: lookupError } =
    await supabase
      .from("client_services")
      .select("price")
      .eq("id", serviceId)
      .eq("client_id", clientId)
      .single();

  if (lookupError || !service) {
    throw new Error(
      lookupError?.message || "Service not found."
    );
  }

  const { error } = await supabase
    .from("client_services")
    .update({
      payment_status: "Paid",
    })
    .eq("id", serviceId)
    .eq("client_id", clientId);

  if (error) {
    throw new Error(error.message);
  }

  await supabase
    .from("payments")
    .insert({
      client_id: clientId,
      client_service_id: serviceId,
      amount: Number(service.price ?? 0),
      payment_date: new Date().toISOString().slice(0, 10),
      payment_status: "Paid",
      payment_method: null,
      notes: "Marked paid from client profile.",
    });

  await createTimelineEvent(
    clientId,
    "paid",
    "Paid"
  );

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/");
}


export async function deleteService(formData: FormData) {
  const clientId = getClientId(formData);
  const serviceId = getServiceId(formData);

  const supabase = await createClient();

  const { error } = await supabase
    .from("client_services")
    .delete()
    .eq("id", serviceId)
    .eq("client_id", clientId);

  if (error) {
    throw new Error(error.message);
  }

  const { count } = await supabase
    .from("client_services")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId);

  if (!count || count === 0) {
    await supabase
      .from("client_timeline")
      .delete()
      .eq("client_id", clientId)
      .eq("event_type", "services_selected");
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/");
}


export async function updateService(formData: FormData) {
  const clientId = getClientId(formData);
  const serviceId = getServiceId(formData);

  const price = formData.get("price");
  const dateAdded = String(formData.get("dateAdded") || "");
  const scheduledDate = String(formData.get("scheduledDate") || "");
  const notes = String(formData.get("notes") || "").trim();

  const supabase = await createClient();

  const { error } = await supabase
    .from("client_services")
    .update({
      price: price ? Number(price) : null,
      date_added: dateAdded || null,
      scheduled_date: scheduledDate || null,
      notes: notes || null,
    })
    .eq("id", serviceId)
    .eq("client_id", clientId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/");
}


/*
  TIMELINE SOURCE OF TRUTH
*/

export async function toggleTimelineStep(formData: FormData) {
  const clientId = getClientId(formData);

  const eventType = String(
    formData.get("eventType") || ""
  );

  const title = String(
    formData.get("title") || ""
  );

  if (!eventType) {
    throw new Error("Missing timeline event.");
  }

  const supabase = await createClient();

  const { data: existing, error } = await supabase
    .from("client_timeline")
    .select("id")
    .eq("client_id", clientId)
    .eq("event_type", eventType);

  if (error) {
    throw new Error(error.message);
  }

  if (existing && existing.length > 0) {
    const { error: deleteError } = await supabase
      .from("client_timeline")
      .delete()
      .eq("client_id", clientId)
      .eq("event_type", eventType);

    if (deleteError) {
      throw new Error(deleteError.message);
    }
  } else {
    const { error: insertError } = await supabase
      .from("client_timeline")
      .insert({
        client_id: clientId,
        event_type: eventType,
        title,
        status: "Complete",
        completed_at: new Date().toISOString(),
      });

    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  revalidatePath(`/clients/${clientId}`);
}


/*
  NOTES
*/

export async function addClientNote(formData: FormData) {
  const clientId = getClientId(formData);
  const noteDate = String(formData.get("noteDate") || "");
  const content = String(formData.get("content") || "").trim();

  if (!content) {
    throw new Error("Note cannot be empty.");
  }

  const supabase = await createClient();

  const { error } = await supabase.from("client_notes").insert({
    client_id: clientId,
    note_date: noteDate || new Date().toISOString().slice(0, 10),
    content,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/clients/${clientId}`);
}


export async function deleteClientNote(formData: FormData) {
  const clientId = getClientId(formData);
  const noteId = Number(formData.get("noteId"));

  if (!Number.isInteger(noteId) || noteId <= 0) {
    throw new Error("Invalid note ID.");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("client_notes")
    .delete()
    .eq("id", noteId)
    .eq("client_id", clientId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/clients/${clientId}`);
}


/*
  CALENDAR
*/

export async function addCalendarEvent(formData: FormData) {
  const clientId = getClientId(formData);
  const eventType = String(formData.get("eventType") || "");
  const eventDate = String(formData.get("eventDate") || "");
  const eventTime = String(formData.get("eventTime") || "");
  const notes = String(formData.get("notes") || "").trim();

  if (!eventType || !eventDate) {
    throw new Error("Missing event type or date.");
  }

  const supabase = await createClient();

  const isInterview = eventType === "Client Interview";
  const startTime = eventTime || "09:00";
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const endHour = String((startHour + 1) % 24).padStart(2, "0");
  const endMinute = String(startMinute).padStart(2, "0");

  const { error } = await supabase.from("calendar_events").insert({
    client_id: clientId,
    event_type: isInterview ? "interview" : eventType,
    title: eventType,
    start_at: `${eventDate}T${startTime}:00`,
    end_at: `${eventDate}T${endHour}:${endMinute}:00`,
    notes: notes || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (eventType === "Free 15") {
    await createTimelineEvent(
      clientId,
      "free15_scheduled",
      "Free 15 Scheduled"
    );
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/");
}


export async function deleteCalendarEvent(formData: FormData) {
  const clientId = getClientId(formData);
  const eventId = Number(formData.get("eventId"));

  if (!Number.isInteger(eventId) || eventId <= 0) {
    throw new Error("Invalid event ID.");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", eventId)
    .eq("client_id", clientId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/clients/${clientId}`);
}
