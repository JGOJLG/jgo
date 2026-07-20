"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

function cleanOptional(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text === "" ? null : text;
}

export async function createTask(formData: FormData) {
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();

  if (!title) {
    throw new Error("Task title is required.");
  }

  const clientIdValue = cleanOptional(formData.get("client_id"));

  const { error } = await supabase.from("tasks").insert({
    title,
    description: cleanOptional(formData.get("description")),
    category: String(formData.get("category") ?? "General"),
    priority: String(formData.get("priority") ?? "Normal"),
    status: "Open",
    due_date: cleanOptional(formData.get("due_date")),
    due_time: cleanOptional(formData.get("due_time")),
    recurrence: String(formData.get("recurrence") ?? "None"),
    client_id: clientIdValue ? Number(clientIdValue) : null,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/tasks");
}

export async function updateTaskStatus(formData: FormData) {
  const supabase = await createClient();

  const taskId = Number(formData.get("task_id"));
  const nextStatus = String(formData.get("next_status") ?? "Open");

  if (!taskId) {
    throw new Error("Task ID is required.");
  }

  const completedAt =
    nextStatus === "Completed" ? new Date().toISOString() : null;

  const { error } = await supabase
    .from("tasks")
    .update({
      status: nextStatus,
      completed_at: completedAt,
    })
    .eq("id", taskId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/tasks");
}

export async function deleteTask(formData: FormData) {
  const supabase = await createClient();

  const taskId = Number(formData.get("task_id"));

  if (!taskId) {
    throw new Error("Task ID is required.");
  }

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/tasks");
}
