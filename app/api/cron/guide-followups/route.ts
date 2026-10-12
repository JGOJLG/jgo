import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OWNER = "jen@jgohire.com";
const START = Date.parse("2026-10-12T00:00:00-04:00");
const DAY = 86400000;
const SUBJECT_PREFIX = "Survival Guide follow-up reminder";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Missing server-side email/database configuration" }, { status: 503 });
  }
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const resend = new Resend(process.env.RESEND_API_KEY);
  const now = Date.now();
  const cutoff = new Date(now - 14 * DAY).toISOString();
  const { data: leads, error } = await db.from("job_search_guide_leads")
    .select("id,first_name,email,created_at,contacted_at,converted_client_id")
    .gte("created_at", new Date(START).toISOString())
    .lte("created_at", cutoff)
    .is("contacted_at", null)
    .is("converted_client_id", null)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  let sent = 0;
  const failures: string[] = [];
  for (const lead of leads || []) {
    const subject = `${SUBJECT_PREFIX}: ${lead.first_name || lead.email} [${lead.id}]`;
    const { data: prior, error: lookupError } = await db.from("email_messages")
      .select("id").eq("recipient_email", OWNER).eq("subject", subject).limit(1);
    if (lookupError) { failures.push(lead.id); continue; }
    if (prior?.length) continue;
    const signupDate = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "America/New_York" }).format(new Date(lead.created_at));
    const body = `Send a personal Survival Guide follow-up to ${lead.first_name || "this subscriber"}.\n\nName: ${lead.first_name || "Not provided"}\nEmail: ${lead.email}\nSignup date: ${signupDate}\n\nOpen JGO OS: https://portal.jgohire.com/guide-signups\n\nThis is a reminder to you only. No email has been sent to the subscriber.`;
    const result = await resend.emails.send({ from: `JGO Hire <${OWNER}>`, to: [OWNER], subject, text: body });
    if (result.error) { failures.push(lead.id); continue; }
    const { error: saveError } = await db.from("email_messages").insert({
      recipient_email: OWNER, recipient_name: "Jen", subject, body,
      status: "sent", sent_at: new Date().toISOString(),
    });
    if (saveError) { failures.push(lead.id); continue; }
    sent++;
  }
  return NextResponse.json({ ok: failures.length === 0, sent, failed: failures.length, failures }, { status: failures.length ? 500 : 200 });
}
