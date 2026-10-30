import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;
import { createClient } from "@/lib/supabase-server";
import EmailWorkspace from "./EmailWorkspace";
import TemplateDeleteGuard from "./TemplateDeleteGuard";
import EmailSuccessBridge from "./EmailSuccessBridge";

type Contact = { id: number; name: string | null; email: string | null; status: string | null; company: string | null };
type EmailContact = { id: number; name: string | null; email: string; company: string | null; client_id: number | null; first_contacted_at: string | null; last_contacted_at: string | null; email_count: number; marketing_opt_in: boolean; notes: string | null };
type AudienceContact = { email: string; name: string; clientId: number | null; groups: string[]; optedIn: boolean };
type EmailTemplateRow = { id: number; name: string; subject: string; body: string };
type EmailMessageRow = { id: number; client_id: number | null; recipient_name: string | null; recipient_email: string; subject: string; body: string; template_id: number | null; email_tags?: string[]; sent_at: string };

export default async function EmailHubPage() {
  const supabase = await createClient();
  const [contactsResult, emailContactsResult, templatesResult, messagesResult, signupsResult, leadsResult] = await Promise.all([
    supabase.from("clients").select("id, name, email, status, company").not("email", "is", null).order("name", { ascending: true }),
    supabase.from("email_contacts").select("id, name, email, company, client_id, first_contacted_at, last_contacted_at, email_count, marketing_opt_in, notes").order("last_contacted_at", { ascending: false, nullsFirst: false }),
    supabase.from("email_templates").select("id, name, subject, body").order("created_at", { ascending: true }),
    supabase.from("email_messages").select("id, client_id, recipient_name, recipient_email, subject, body, template_id, email_tags, sent_at").order("sent_at", { ascending: false }).limit(500),
    supabase.from("job_search_guide_leads").select("email,first_name"),
    supabase.from("intake_calls").select("email,name"),
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


  const audienceMap = new Map<string, AudienceContact>();
  const addAudience = (value: string | null | undefined, name: string | null | undefined, clientId: number | null, group: string, optedIn = false) => {
    const email = (value || "").trim().toLowerCase();
    if (!email || !email.includes("@")) return;
    const prior = audienceMap.get(email);
    audienceMap.set(email, { email, name: prior?.name || name || "", clientId: prior?.clientId ?? clientId, groups: Array.from(new Set([...(prior?.groups || []), group])), optedIn: Boolean(prior?.optedIn || optedIn) });
  };
  for (const c of clientContacts) addAudience(c.email, c.name, c.id, ["lead", "free 15 scheduled", "free 15 completed"].includes((c.status || "").toLowerCase()) ? "Leads" : "Clients");
  for (const c of emailContacts) addAudience(c.email, c.name, c.client_id, "Email Contacts", c.marketing_opt_in);
  for (const c of signupsResult.data || []) addAudience(c.email, c.first_name, null, "Survival Guide");
  for (const c of leadsResult.data || []) addAudience(c.email, c.name, null, "Leads");
  const audienceContacts = Array.from(audienceMap.values());

  return (
    <>
      <TemplateDeleteGuard />
      <EmailSuccessBridge />
      <div className="fixed right-6 top-5 z-[90] hidden sm:block">
        <Link href="/email/templates" className="rounded-xl border border-[#cbd8c4] bg-white px-4 py-2.5 text-sm font-bold text-[#4d6247] shadow-sm hover:bg-[#f5f7f2]">Edit Templates</Link>
      </div>
      <EmailWorkspace audienceContacts={audienceContacts} contacts={contacts} initialEmailContacts={emailContacts} initialTemplates={(templatesResult.data ?? []) as EmailTemplateRow[]} initialSent={messages} />
      <div className="fixed bottom-5 right-5 z-[90] sm:hidden">
        <Link href="/email/templates" className="rounded-full bg-[#647d5b] px-4 py-3 text-sm font-bold text-white shadow-lg">Edit Templates</Link>
      </div>
    </>
  );
}
