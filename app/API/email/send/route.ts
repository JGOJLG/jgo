import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

type EmailRequest = {
  clientId?: number | null;
  recipientName?: string;
  recipientEmail?: string;
  subject?: string;
  body?: string;
  templateId?: number | null;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  if (!resend) {
    return NextResponse.json(
      { error: "Email is not configured.", detail: "Missing RESEND_API_KEY." },
      { status: 500 }
    );
  }

  let payload: EmailRequest;
  try {
    payload = (await request.json()) as EmailRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const recipientEmail = String(payload.recipientEmail || "").trim().toLowerCase();
  const recipientName = String(payload.recipientName || "").trim();
  const subject = String(payload.subject || "").trim();
  const body = String(payload.body || "").trim();
  const clientId = Number.isInteger(payload.clientId) ? Number(payload.clientId) : null;
  const templateId = Number.isInteger(payload.templateId) ? Number(payload.templateId) : null;

  if (!recipientEmail || !isEmail(recipientEmail)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (!subject || !body) {
    return NextResponse.json({ error: "Subject and message are required." }, { status: 400 });
  }

  const htmlBody = escapeHtml(body).replaceAll("\n", "<br />");

  const emailResult = await resend.emails.send({
    from: "JGO Hire <jen@jgohire.com>",
    to: [recipientEmail],
    replyTo: "jen@jgohire.com",
    subject,
    text: body,
    html: `
      <div style="margin:0;background:#f6f8f3;padding:28px 14px;font-family:Arial,Helvetica,sans-serif;color:#243128;">
        <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e1e7dc;border-radius:22px;padding:30px;">
          <div style="margin-bottom:24px;color:#53684c;font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;">JGO Hire</div>
          <div style="font-size:15px;line-height:1.7;color:#2f3b32;">${htmlBody}</div>
          <div style="margin-top:28px;padding-top:18px;border-top:1px solid #edf0ea;color:#7a857b;font-size:11px;line-height:1.5;">Sent from JGO Hire</div>
        </div>
      </div>
    `,
  });

  if (emailResult.error) {
    return NextResponse.json(
      { error: "Unable to send email.", detail: emailResult.error.message },
      { status: 500 }
    );
  }

  const supabase = await createClient();
  const { data: message, error: saveError } = await supabase
    .from("email_messages")
    .insert({
      client_id: clientId,
      recipient_name: recipientName || null,
      recipient_email: recipientEmail,
      subject,
      body,
      status: "sent",
      template_id: templateId,
      sent_at: new Date().toISOString(),
    })
    .select("id, client_id, recipient_name, recipient_email, subject, body, template_id, sent_at")
    .single();

  if (saveError) {
    return NextResponse.json(
      {
        ok: true,
        warning: "Email sent, but the Sent History record could not be saved.",
        detail: saveError.message,
      },
      { status: 200 }
    );
  }

  return NextResponse.json({ ok: true, message, resendId: emailResult.data?.id });
}
