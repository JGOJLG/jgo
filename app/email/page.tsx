import { createClient } from "@/lib/supabase-server";
import EmailHubClient from "./EmailHubClient";
import TemplateDeleteGuard from "./TemplateDeleteGuard";

type Contact = { id: number; name: string | null; email: string | null; status: string | null; company: string | null };
type EmailContact = { id: number; name: string | null; email: string; company: string | null; client_id: number | null; first_contacted_at: string | null; last_contacted_at: string | null; email_count: number; marketing_opt_in: boolean; notes: string | null };
type EmailTemplateRow = { id: number; name: string; subject: string; body: string };
type EmailMessageRow = { id: number; client_id: number | null; recipient_name: string | null; recipient_email: string; subject: string; body: string; template_id: number | null; sent_at: string };

export default async function EmailHubPage() {
  const supabase = await createClient();
  const [contactsResult, emailContactsResult, templatesResult, messagesResult] = await Promise.all([
    supabase.from("clients").select("id, name, email, status, company").not("email", "is", null).order("name", { ascending: true }),
    supabase.from("email_contacts").select("id, name, email, company, client_id, first_contacted_at, last_contacted_at, email_count, marketing_opt_in, notes").order("last_contacted_at", { ascending: false, nullsFirst: false }),
    supabase.from("email_templates").select("id, name, subject, body").order("created_at", { ascending: true }),
    supabase.from("email_messages").select("id, client_id, recipient_name, recipient_email, subject, body, template_id, sent_at").order("sent_at", { ascending: false }).limit(500),
  ]);

  const clientContacts = ((contactsResult.data ?? []) as Contact[]).filter((contact) => contact.email?.trim());
  const emailContacts = (emailContactsResult.data ?? []) as EmailContact[];
  const messages = (messagesResult.data ?? []) as EmailMessageRow[];

  const rememberedContacts = [
    ...clientContacts,
    ...emailContacts.map((contact) => ({
      id: contact.client_id ?? -contact.id,
      name: contact.name,
      email: contact.email,
      status: contact.client_id ? "Client" : "Email Contact",
      company: contact.company,
    })),
    ...messages.map((message) => ({
      id: message.client_id ?? -(1000000 + message.id),
      name: message.recipient_name,
      email: message.recipient_email,
      status: message.client_id ? "Client" : "Previously Emailed",
      company: null,
    })),
  ];

  const contacts = Array.from(
    new Map(
      rememberedContacts
        .filter((contact) => contact.email?.trim())
        .map((contact) => [contact.email!.trim().toLowerCase(), { ...contact, email: contact.email!.trim().toLowerCase() }])
    ).values()
  ).sort((a, b) => (a.name || a.email || "").localeCompare(b.name || b.email || ""));

  return (
    <>
      <TemplateDeleteGuard />
      <EmailHubClient contacts={contacts} initialEmailContacts={emailContacts} initialTemplates={(templatesResult.data ?? []) as EmailTemplateRow[]} initialSent={messages} />
    </>
  );
}
