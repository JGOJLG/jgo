import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACCOUNT_ID = "acct_1UWMh0GTU8IAq7cj";

export async function POST(request: Request) {
  const secret = process.env.JGO_HIRE_STRIPE_SECRET_KEY;
  const webhookSecret = process.env.JGO_HIRE_STRIPE_WEBHOOK_SECRET;
  const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const dbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !webhookSecret || !dbUrl || !dbKey) {
    console.error("JGO Hire payment webhook missing server configuration");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const stripe = new Stripe(secret);
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  if (!["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.mode !== "payment" || session.payment_status !== "paid") {
    return NextResponse.json({ received: true, pending: true });
  }

  try {
    // Re-fetch directly from this account. The session must exist in new JGO Hire.
    const verified = await stripe.checkout.sessions.retrieve(session.id);
    if (verified.id !== session.id || verified.payment_status !== "paid" ||
        verified.metadata?.source !== "jgo_os_invoice" ||
        verified.livemode !== true) {
      return NextResponse.json({ error: "Unrecognized JGO Hire payment" }, { status: 400 });
    }

    const clientId = Number(verified.metadata.client_id);
    const serviceId = Number(verified.metadata.service_id);
    const basePrice = Number(verified.metadata.base_price);
    if (![clientId, serviceId].every(v => Number.isSafeInteger(v) && v > 0) ||
        !Number.isFinite(basePrice) || basePrice <= 0) {
      console.error("JGO Hire checkout missing service mapping", { sessionId: session.id });
      return NextResponse.json({ error: "Missing invoice mapping" }, { status: 500 });
    }
    const db = createClient(dbUrl, dbKey, { auth: { persistSession: false } });
    const { data: service, error: findError } = await db.from("client_services")
      .select("id,client_id,price,payment_status,amount_received").eq("id", serviceId)
      .eq("client_id", clientId).maybeSingle();
    if (findError || !service) return NextResponse.json({ error: "Invoice service not found" }, { status: 500 });

    const amount = Number(basePrice.toFixed(2));
    // Unique index on stripe_checkout_session_id makes repeated Stripe delivery idempotent.
    const { data: existing, error: existingError } = await db.from("payments")
      .select("id").eq("stripe_checkout_session_id", session.id).maybeSingle();
    if (existingError) throw existingError;
    if (!existing) {
      const date = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York",
        year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
      const { error: insertError } = await db.from("payments").insert({
        client_id: clientId, client_service_id: serviceId, amount, payment_date: date,
        payment_status: "Paid", payment_method: "Stripe",
        stripe_checkout_session_id: session.id,
        notes: "JGO Hire Stripe Checkout payment received. Processing fee paid separately by customer."
      });
      if (insertError?.code !== "23505" && insertError) throw insertError;
    }
    // Never lower a service's recorded amount; don't overwrite later manual amounts.
    const { error: updateError } = await db.from("client_services").update({
      payment_status: "Paid", payment_method: "Stripe",
      payment_date: new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York",
        year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()),
      amount_received: Math.max(Number(service.amount_received || 0), amount),
      updated_at: new Date().toISOString()
    }).eq("id", serviceId).eq("client_id", clientId);
    if (updateError) throw updateError;
    const { error: clientError } = await db.from("clients").update({ payment_status: "Paid" }).eq("id", clientId);
    if (clientError) throw clientError;
    return NextResponse.json({ received: true, updated: true });
  } catch (error) {
    console.error("JGO Hire webhook processing failed", error);
    return NextResponse.json({ error: "Payment sync failed" }, { status: 500 });
  }
}
