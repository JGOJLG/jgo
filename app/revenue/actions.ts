"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const REVENUE_PASSWORD =
  process.env.JGO_REVENUE_PASSWORD || "freedom";

export async function unlockRevenue(formData: FormData) {
  const password = String(formData.get("password") || "").trim();

  if (password !== REVENUE_PASSWORD) {
    redirect("/revenue/unlock?error=Incorrect%20password");
  }

  const cookieStore = await cookies();

  cookieStore.set({
    name: "jgo-revenue-access",
    value: "unlocked",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  redirect("/revenue");
}

export async function lockRevenue() {
  const cookieStore = await cookies();

  cookieStore.set({
    name: "jgo-revenue-access",
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  redirect("/revenue/unlock");
}
