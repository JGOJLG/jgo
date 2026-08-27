import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase-server";
import { jgoEmailSignature, jgoTextSignature } from "@/lib/emailSignature";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const esc = (v: string) => v.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");

export async function POST(req: Request) {
  try {
    const { clientId } = await req.json();
    const id = Number(clientId);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Invalid client." }, { status: 400 });
    if (!resend) return NextResponse.json({ error: "Email delivery is not configured." }, { status: 500 });
    const s = await createClient();
    const { data: c, error } = await s.from("clients").select("id,name,email,portal_user_id,portal_invited_at").eq("id", id).single();
    if (error || !c) return NextResponse.json({ error: "Client not found." }, { status: 404 });
    if (c.portal_user_id) return NextResponse.json({ message: "This client already has portal access." });
    const email = String(c.email || "").trim().toLowerCase();
    if (!email) return NextResponse.json({ error: "Add an email address before inviting them." }, { status: 400 });
    const first = String(c.name || "").trim().split(/\s+/)[0] || "there";
    const portal = `https://www.jgohire.com/client-portal/signup?email=${encodeURIComponent(email)}`;
    const textBody = `Hi ${first},\n\nYour JGO Hire Client Portal is ready.\n\nCreate your account: ${portal}\n\nUse ${email}. You'll create a password, confirm your email once, and then your private portal will connect automatically.\n\nInside you'll find your documents, resources, and job tracker.\n\nBest,\n\n${jgoTextSignature()}`;
    const htmlBody = `<div style="font-family:Arial,Helvetica,sans-serif;color:#243128;max-width:560px;margin:0 auto;padding:28px 20px"><p style="font-size:12px;font-weight:700;letter-spacing:1.5px;color:#637a5b">JGO HIRE</p><p>Hi ${esc(first)},</p><p style="line-height:1.6">Your private JGO Hire Client Portal is ready. Create your account to access your documents, resources, and job tracker.</p><p style="margin:24px 0"><a href="${portal}" style="display:inline-block;background:#53684c;color:#fff;text-decoration:none;border-radius:10px;padding:13px 20px;font-weight:700">Create My Account</a></p><p style="font-size:13px;color:#667168">Use <strong>${esc(email)}</strong>. You&apos;ll create a password and confirm your email once.</p><p style="margin-top:26px">Best,</p>${jgoEmailSignature()}</div>`;
    const { data, error: sendError } = await resend.emails.send({ from: "JGO Hire <jen@jgohire.com>", to: [email], replyTo: "jen@jgohire.com", subject: "Create your JGO Hire Client Portal account", text: textBody, html: htmlBody });
    if (sendError || !data?.id) { console.error("Portal invite Resend failure", sendError); return NextResponse.json({ error: "The portal invite was not accepted by the email provider. Please try again." }, { status: 502 }); }
    console.log("Portal invite accepted", { clientId: id, emailId: data.id, to: email });
    await s.from("clients").update({ portal_invited_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ message: c.portal_invited_at ? "Invite resent." : "Invite sent.", emailId: data.id });
  } catch (e) {
    console.error("Portal invite error", e);
    return NextResponse.json({ error: "Unable to send portal invite." }, { status: 500 });
  }
}
