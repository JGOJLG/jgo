import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

type Recipient = { clientId?: number | null; name?: string; email?: string };
type EmailRequest = { recipients?: Recipient[]; subject?: string; body?: string; bodyHtml?: string; templateId?: number | null };

function escapeHtml(value: string) { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function isEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function firstName(value: string) { return value.trim().split(/\s+/)[0] || "there"; }
function personalize(value: string, recipient: Recipient) { return value.replaceAll("{{first_name}}", firstName(String(recipient.name || "there"))).replaceAll("{{name}}", String(recipient.name || "")); }
function stripHtml(value: string) { return value.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n\n").replace(/<\/li>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'").trim(); }
function wrapEmailHtml(innerHtml: string) { return `<div style="margin:0;background:#f6f8f3;padding:28px 14px;font-family:Arial,Helvetica,sans-serif;color:#243128;"><div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e1e7dc;border-radius:22px;overflow:hidden;"><div style="background:linear-gradient(145deg,#e6efe2,#f7faf5);padding:24px 30px;"><div style="color:#53684c;font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;">JGO Hire</div></div><div style="padding:30px;font-size:15px;line-height:1.7;color:#2f3b32;">${innerHtml}</div><div style="padding:18px 30px;border-top:1px solid #edf0ea;color:#7a857b;font-size:11px;line-height:1.5;">JGO Hire · Career Coach + Recruiter</div></div></div>`; }

export async function POST(request: Request) {
  if (!resend) return NextResponse.json({ error: "Email is not configured.", detail: "Missing RESEND_API_KEY." }, { status: 500 });
  let payload: EmailRequest;
  try { payload = (await request.json()) as EmailRequest; } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }

  const subject = String(payload.subject || "").trim();
  const rawBody = String(payload.body || "").trim();
  const rawHtml = String(payload.bodyHtml || "").trim();
  const templateId = Number.isInteger(payload.templateId) ? Number(payload.templateId) : null;
  if (!subject || (!rawBody && !rawHtml)) return NextResponse.json({ error: "Subject and message are required." }, { status: 400 });

  const uniqueRecipients = Array.from(new Map((payload.recipients || []).map((recipient) => ({ clientId: Number.isInteger(recipient.clientId) ? Number(recipient.clientId) : null, name: String(recipient.name || "").trim(), email: String(recipient.email || "").trim().toLowerCase() })).filter((recipient) => isEmail(recipient.email)).map((recipient) => [recipient.email, recipient])).values());
  if (!uniqueRecipients.length) return NextResponse.json({ error: "Add at least one valid recipient." }, { status: 400 });
  if (uniqueRecipients.length > 500) return NextResponse.json({ error: "Please send to 500 recipients or fewer at a time." }, { status: 400 });

  const supabase = await createClient();
  const savedMessages: unknown[] = [];
  const failures: { email: string; error: string }[] = [];

  for (let index = 0; index < uniqueRecipients.length; index += 10) {
    const chunk = uniqueRecipients.slice(index, index + 10);
    const results = await Promise.all(chunk.map(async (recipient) => {
      const personalizedSubject = personalize(subject, recipient);
      const personalizedHtml = rawHtml ? personalize(rawHtml, recipient) : escapeHtml(personalize(rawBody, recipient)).replaceAll("\n", "<br />");
      const personalizedText = rawBody ? personalize(rawBody, recipient) : stripHtml(personalizedHtml);
      const emailResult = await resend.emails.send({ from: "JGO Hire <jen@jgohire.com>", to: [recipient.email], replyTo: "jen@jgohire.com", subject: personalizedSubject, text: personalizedText, html: wrapEmailHtml(personalizedHtml) });
      if (emailResult.error) return { ok: false as const, email: recipient.email, error: emailResult.error.message };

      const now = new Date().toISOString();
      const { data: existingContact } = await supabase.from("email_contacts").select("id, email_count, first_contacted_at, name, client_id").eq("email", recipient.email).maybeSingle();
      if (existingContact) {
        await supabase.from("email_contacts").update({ name: recipient.name || existingContact.name || null, client_id: recipient.clientId ?? existingContact.client_id ?? null, first_contacted_at: existingContact.first_contacted_at || now, last_contacted_at: now, email_count: Number(existingContact.email_count || 0) + 1, updated_at: now }).eq("id", existingContact.id);
      } else {
        await supabase.from("email_contacts").insert({ name: recipient.name || null, email: recipient.email, client_id: recipient.clientId, source: recipient.clientId ? "jgo_os" : "email", first_contacted_at: now, last_contacted_at: now, email_count: 1 });
      }

      const { data: message } = await supabase.from("email_messages").insert({ client_id: recipient.clientId, recipient_name: recipient.name || null, recipient_email: recipient.email, subject: personalizedSubject, body: personalizedText, status: "sent", template_id: templateId, sent_at: now }).select("id, client_id, recipient_name, recipient_email, subject, body, template_id, sent_at").single();
      return { ok: true as const, message: message || null };
    }));
    for (const result of results) { if (!result.ok) failures.push({ email: result.email, error: result.error }); else if (result.message) savedMessages.push(result.message); }
  }

  const sentCount = uniqueRecipients.length - failures.length;
  if (!sentCount) return NextResponse.json({ error: "Unable to send any emails.", failures }, { status: 500 });
  return NextResponse.json({ ok: true, sentCount, failedCount: failures.length, failures, messages: savedMessages });
}
