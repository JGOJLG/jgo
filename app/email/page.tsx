import { createClient } from "@/lib/supabase-server";
import EmailHubClient from "./EmailHubClient";

type Contact = {
  id: number;
  name: string | null;
  email: string | null;
  status: string | null;
  company: string | null;
};

type EmailTemplateRow = {
  id: number;
  name: string;
  subject: string;
  body: string;
};

type EmailMessageRow = {
  id: number;
  client_id: number | null;
  recipient_name: string | null;
  recipient_email: string;
  subject: string;
  body: string;
  template_id: number | null;
  sent_at: string;
};

export default async function EmailHubPage() {
  const supabase = await createClient();

  const [contactsResult, templatesResult, messagesResult] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, email, status, company")
      .not("email", "is", null)
      .order("name", { ascending: true }),
    supabase
      .from("email_templates")
      .select("id, name, subject, body")
      .order("created_at", { ascending: true }),
    supabase
      .from("email_messages")
      .select("id, client_id, recipient_name, recipient_email, subject, body, template_id, sent_at")
      .order("sent_at", { ascending: false })
      .limit(250),
  ]);

  const contacts = ((contactsResult.data ?? []) as Contact[]).filter(
    (contact) => contact.email?.trim() && contact.name?.trim()
  );

  const templates = (templatesResult.data ?? []) as EmailTemplateRow[];
  const messages = (messagesResult.data ?? []) as EmailMessageRow[];

  return (
    <EmailHubClient
      contacts={contacts}
      initialTemplates={templates}
      initialSent={messages}
    />
  );
}
