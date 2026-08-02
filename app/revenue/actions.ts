"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const REVENUE_PASSWORD =
  process.env.JGO_REVENUE_PASSWORD || "freedom";

export async function unlockRevenue(formData: FormData) {
  const password = String(formData.get("password") || "");

  if (password !== REVENUE_PASSWORD) {
    redirect("/revenue?error=Incorrect%20password");
  }

  const cookieStore = await cookies();

  cookieStore.set("jgo-revenue-access", "unlocked", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/revenue",
  });

  redirect("/revenue");
}

export async function lockRevenue() {
  const cookieStore = await cookies();

  cookieStore.delete("jgo-revenue-access");

  redirect("/revenue");
}
