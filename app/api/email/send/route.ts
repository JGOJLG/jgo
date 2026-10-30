import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase-server";
import { jgoTextSignature } from "@/lib/emailSignature";
import { wrapEmailHtml } from "@/lib/emailRender";
import { normalizeJgoJobHeadline } from "@/lib/jgoJobLaunchEmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const JGO_OWNER_EMAIL = "jen@jgohire.com";

type Recipient = { clientId?: number | null; name?: string; email?: string };
type EmailRequest = { recipients?: Recipient[]; subject?: string; body?: string; bodyHtml?: string; templateId?: number | null; emailTags?: string[]; audienceGroup?: string | null };

function escapeHtml(value: string) { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function isEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function firstName(value: string) { return value.trim().split(/\s+/)[0] || "there"; }
function personalize(value: string, recipient: Recipient) { return value.replaceAll("{{first_name}}", firstName(String(recipient.name || "there"))).replaceAll("{{name}}", String(recipient.name || "")); }
function stripHtml(value: string) { return value.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n\n").replace(/<\/li>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'").trim(); }


export async function POST(request: Request) {
  if (!resend) return NextResponse.json({ error: "Email is not configured.", detail: "Missing RESEND_API_KEY." }, { status: 500 });
  let payload: EmailRequest;
  try { payload = (await request.json()) as EmailRequest; } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const subject = String(payload.subject || "").trim();
  const rawBody = normalizeJgoJobHeadline(String(payload.body || "").trim());
  const rawHtml = normalizeJgoJobHeadline(String(payload.bodyHtml || "").trim());
  const templateId = Number.isInteger(payload.templateId) ? Number(payload.templateId) : null;
  if (!subject || (!rawBody && !rawHtml)) return NextResponse.json({ error: "Subject and message are required." }, { status: 400 });
  const uniqueRecipients = Array.from(new Map((payload.recipients || []).map((recipient) => ({ clientId: Number.isInteger(recipient.clientId) ? Number(recipient.clientId) : null, name: String(recipient.name || "").trim(), email: String(recipient.email || "").trim().toLowerCase() })).filter((recipient) => isEmail(recipient.email)).map((recipient) => [recipient.email, recipient])).values());
  if (!uniqueRecipients.length) return NextResponse.json({ error: "Add at least one valid recipient." }, { status: 400 });
  if (uniqueRecipients.length > 500) return NextResponse.json({ error: "Please send to 500 recipients or fewer at a time." }, { status: 400 });
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in is required to send emails." }, { status: 401 });
  const selectedTemplateId = typeof payload.templateId === "number" ? payload.templateId : null;
  let templateLabel: string | null = null;
  if (selectedTemplateId !== null) {
    const { data: selectedTemplate, error: templateError } = await supabase.from("email_templates").select("name").eq("id", selectedTemplateId).maybeSingle();
    if (templateError || !selectedTemplate) return NextResponse.json({ error: "Selected template could not be verified." }, { status: 400 });
    templateLabel = selectedTemplate.name;
  }
  const emailTags = Array.isArray(payload.emailTags) ? [...new Set(payload.emailTags.filter((tag): tag is string => typeof tag === "string").map(tag => tag.trim().slice(0, 60)).filter(Boolean))].slice(0, 20) : [];
  if (templateLabel && !emailTags.includes(templateLabel)) emailTags.unshift(templateLabel);
  const audienceGroup = typeof payload.audienceGroup === "string" ? payload.audienceGroup : null;
  // All multi-recipient sends are treated as marketing unless a separately authorized
  // transactional workflow is implemented. Never trust a client-provided opt-in flag.
  if (uniqueRecipients.length > 1 || audienceGroup === "JGO Job Signups") {
    const { data: approved, error: consentError } = await supabase.from("email_contacts")
      .select("email,marketing_opt_in,unsubscribed_at,suppressed_at")
      .in("email", uniqueRecipients.map(r => r.email));
    if (consentError) return NextResponse.json({ error: "Cannot verify recipient consent. Bulk send blocked.", detail: consentError.message }, { status: 503 });
    const eligible = new Set((approved || []).filter(c => c.marketing_opt_in === true && !c.unsubscribed_at && !c.suppressed_at).map(c => String(c.email).trim().toLowerCase()));
    const unapproved = uniqueRecipients.filter(r => !eligible.has(r.email));
    if (unapproved.length) return NextResponse.json({ error: `Bulk send blocked: ${unapproved.length} recipient(s) lack verified marketing consent or are suppressed.`, unapprovedCount: unapproved.length }, { status: 400 });
  }
  if (audienceGroup === "JGO Job Signups") {
    const {data: profiles,error: profileError}=await supabase.from("jgojob_profiles").select("email").in("email",uniqueRecipients.map(r=>r.email));
    if(profileError)return NextResponse.json({error:"Unable to verify JGO Job signups. Send blocked."},{status:503});
    const signupEmails=new Set((profiles||[]).map(p=>String(p.email||"").toLowerCase()));
    if(uniqueRecipients.some(r=>!signupEmails.has(r.email)))return NextResponse.json({error:"Recipient list includes someone who is not a JGO Job signup. Send blocked."},{status:400});
  }
  const savedMessages: unknown[] = [];
  const failures: { email: string; error: string }[] = [];
  for (let index = 0; index < uniqueRecipients.length; index += 10) {
    const chunk = uniqueRecipients.slice(index, index + 10);
    const results = await Promise.all(chunk.map(async (recipient) => {
      const personalizedSubject = personalize(subject, recipient);
      const personalizedHtml = rawHtml ? personalize(rawHtml, recipient) : escapeHtml(personalize(rawBody, recipient)).replaceAll("\n", "<br />");
      const renderedHtml = wrapEmailHtml(personalizedHtml);
      const messageText = rawBody ? personalize(rawBody, recipient) : stripHtml(personalizedHtml);
      const personalizedText = `${messageText}\n\n${jgoTextSignature()}`;
      const cc = uniqueRecipients.length > 1 || recipient.email.toLowerCase() === JGO_OWNER_EMAIL ? undefined : [JGO_OWNER_EMAIL];
      const emailResult = await resend.emails.send({ from: `JGO Hire <${JGO_OWNER_EMAIL}>`, to: [recipient.email], cc, replyTo: JGO_OWNER_EMAIL, subject: personalizedSubject, text: personalizedText, html: renderedHtml });
      if (emailResult.error) return { ok: false as const, email: recipient.email, error: emailResult.error.message };
      const now = new Date().toISOString();
      const { data: existingContact } = await supabase.from("email_contacts").select("id, email_count, first_contacted_at, name, client_id").eq("email", recipient.email).maybeSingle();
      if (existingContact) await supabase.from("email_contacts").update({ name: recipient.name || existingContact.name || null, client_id: recipient.clientId ?? existingContact.client_id ?? null, first_contacted_at: existingContact.first_contacted_at || now, last_contacted_at: now, email_count: Number(existingContact.email_count || 0) + 1, updated_at: now }).eq("id", existingContact.id);
      else await supabase.from("email_contacts").insert({ name: recipient.name || null, email: recipient.email, client_id: recipient.clientId, source: recipient.clientId ? "jgo_os" : "email", first_contacted_at: now, last_contacted_at: now, email_count: 1 });
      const { data: message } = await supabase.from("email_messages").insert({ client_id: recipient.clientId, recipient_name: recipient.name || null, recipient_email: recipient.email, subject: personalizedSubject, body: messageText, body_html: renderedHtml, status: "sent", template_id: templateId, email_tags: emailTags, sent_at: now }).select("id, client_id, recipient_name, recipient_email, subject, body, body_html, template_id, sent_at").single();
      return { ok: true as const, message: message || null };
    }));
    for (const result of results) { if (!result.ok) failures.push({ email: result.email, error: result.error }); else if (result.message) savedMessages.push(result.message); }
  }
  const sentCount = uniqueRecipients.length - failures.length;
  if (!sentCount) return NextResponse.json({ error: "Unable to send any emails.", failures }, { status: 500 });
  return NextResponse.json({ ok: true, sentCount, failedCount: failures.length, failures, messages: savedMessages });
}
