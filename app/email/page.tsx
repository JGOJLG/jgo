import { createClient } from "@/lib/supabase-server";
import EmailHubClient from "./EmailHubClient";

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

  const contacts = ((contactsResult.data ?? []) as Contact[]).filter((contact) => contact.email?.trim() && contact.name?.trim());
  return <EmailHubClient contacts={contacts} initialEmailContacts={(emailContactsResult.data ?? []) as EmailContact[]} initialTemplates={(templatesResult.data ?? []) as EmailTemplateRow[]} initialSent={(messagesResult.data ?? []) as EmailMessageRow[]} />;
}
