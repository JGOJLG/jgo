"use client";

import { useEffect, useMemo, useState } from "react";

type Contact = {
  id: number;
  name: string | null;
  email: string | null;
  status: string | null;
  company: string | null;
};

type Template = {
  id: string;
  name: string;
  subject: string;
  body: string;
};

type SentEmail = {
  id: string;
  toName: string;
  toEmail: string;
  subject: string;
  body: string;
  sentAt: string;
};

const starterTemplates: Template[] = [
  {
    id: "welcome",
    name: "Welcome / Getting Started",
    subject: "Welcome to JGO Hire, {{first_name}}!",
    body: "Hi {{first_name}},\n\nI’m so glad we’re working together. I wanted to officially welcome you to JGO Hire and make sure you have everything you need to get started.\n\nI’ll be in touch with next steps, and in the meantime, feel free to reach out if anything comes up.\n\nBest,\nJen",
  },
  {
    id: "follow-up",
    name: "Client Follow Up",
    subject: "Checking in",
    body: "Hi {{first_name}},\n\nJust wanted to check in and see how things are going. Let me know if you have any questions or if there’s anything you want to work through together.\n\nBest,\nJen",
  },
  {
    id: "free15",
    name: "Free 15 Follow Up",
    subject: "Great speaking with you today",
    body: "Hi {{first_name}},\n\nIt was great speaking with you today. I’m glad we had a chance to connect and talk through where things stand in your job search.\n\nIf you decide you’d like to work together, I’d be happy to help.\n\nBest,\nJen",
  },
];

function firstName(name: string | null) {
  return (name || "there").trim().split(/\s+/)[0] || "there";
}

function personalize(text: string, contact: Contact | null) {
  if (!contact) return text;
  return text
    .replaceAll("{{first_name}}", firstName(contact.name))
    .replaceAll("{{name}}", contact.name || "")
    .replaceAll("{{company}}", contact.company || "");
}

export default function EmailHubClient({ contacts }: { contacts: Contact[] }) {
  const [tab, setTab] = useState<"compose" | "templates" | "sent">("compose");
  const [contactSearch, setContactSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [templates, setTemplates] = useState<Template[]>(starterTemplates);
  const [sent, setSent] = useState<SentEmail[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const savedTemplates = localStorage.getItem("jgo-email-templates");
      const savedSent = localStorage.getItem("jgo-email-sent");
      if (savedTemplates) setTemplates(JSON.parse(savedTemplates));
      if (savedSent) setSent(JSON.parse(savedSent));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("jgo-email-templates", JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem("jgo-email-sent", JSON.stringify(sent));
  }, [sent]);

  const matches = useMemo(() => {
    const q = contactSearch.trim().toLowerCase();
    if (!q || selectedContact) return [];
    return contacts
      .filter((contact) =>
        `${contact.name || ""} ${contact.email || ""} ${contact.company || ""}`
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 8);
  }, [contactSearch, contacts, selectedContact]);

  function chooseContact(contact: Contact) {
    setSelectedContact(contact);
    setContactSearch(`${contact.name} <${contact.email}>`);
  }

  function useTemplate(template: Template) {
    setSubject(personalize(template.subject, selectedContact));
    setBody(personalize(template.body, selectedContact));
    setTab("compose");
    setNotice(`Loaded “${template.name}”`);
  }

  function saveTemplate() {
    const name = templateName.trim();
    if (!name || !subject.trim() || !body.trim()) {
      setNotice("Add a template name, subject, and email body first.");
      return;
    }
    setTemplates((current) => [
      ...current,
      { id: crypto.randomUUID(), name, subject, body },
    ]);
    setTemplateName("");
    setNotice("Template saved.");
  }

  function logSent() {
    if (!selectedContact?.email || !subject.trim() || !body.trim()) {
      setNotice("Choose a recipient and add a subject and message first.");
      return;
    }
    const item: SentEmail = {
      id: crypto.randomUUID(),
      toName: selectedContact.name || selectedContact.email,
      toEmail: selectedContact.email,
      subject,
      body,
      sentAt: new Date().toISOString(),
    };
    setSent((current) => [item, ...current]);
    setNotice("Email logged as sent. Live sending will be connected next.");
  }

  function resetDraft() {
    setSelectedContact(null);
    setContactSearch("");
    setSubject("");
    setBody("");
    setNotice("");
  }

  return (
    <section className="min-h-screen bg-[#f7f8f3] text-[#243128]">
      <header className="border-b border-[#dfe6db] bg-[#fbfaf6] px-6 py-7 lg:px-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8aa080]">JGO OS</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Email Hub</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#708075]">
              Write emails, pull recipients directly from your client and lead list, save your best messages as templates, and keep a simple communication history.
            </p>
          </div>
          <button onClick={resetDraft} className="rounded-xl bg-[#647d5b] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#4d6247]">+ New Email</button>
        </div>
        <div className="mt-6 flex w-fit gap-1 rounded-full border border-[#d7e1d0] bg-white p-1">
          {(["compose", "templates", "sent"] as const).map((item) => (
            <button key={item} onClick={() => setTab(item)} className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${tab === item ? "bg-[#647d5b] text-white" : "text-[#647066] hover:bg-[#f5f7f2]"}`}>{item}{item === "sent" && sent.length ? ` (${sent.length})` : ""}</button>
          ))}
        </div>
      </header>

      <div className="mx-auto max-w-7xl p-6 lg:p-10">
        {notice && <div className="mb-5 rounded-2xl border border-[#d7e1d0] bg-[#edf3e9] px-4 py-3 text-sm font-medium text-[#4d6247]">{notice}</div>}

        {tab === "compose" && (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="overflow-hidden rounded-3xl border border-[#dfe6db] bg-white shadow-sm">
              <div className="border-b border-[#edf0ea] px-6 py-5">
                <h2 className="text-xl font-bold">Compose Email</h2>
                <p className="mt-1 text-sm text-[#7b887d]">Write it exactly how you want. No paid AI is required.</p>
              </div>
              <div className="space-y-5 p-6">
                <div className="relative">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#708075]">To</label>
                  <input value={contactSearch} onChange={(e) => { setContactSearch(e.target.value); setSelectedContact(null); }} placeholder="Start typing a client or lead name..." className="w-full rounded-2xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3.5 text-sm outline-none focus:border-[#8fa285]" />
                  {matches.length > 0 && <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-[#dfe6db] bg-white shadow-xl">{matches.map((contact) => <button key={contact.id} type="button" onClick={() => chooseContact(contact)} className="flex w-full items-center justify-between gap-4 border-b border-[#edf0ea] px-4 py-3 text-left last:border-0 hover:bg-[#f7f9f5]"><span><strong className="block text-sm">{contact.name}</strong><small className="text-[#7b887d]">{contact.email}</small></span><span className="rounded-full bg-[#edf2e9] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#647d5b]">{contact.status || "Lead"}</span></button>)}</div>}
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#708075]">Subject</label>
                  <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject" className="w-full rounded-2xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3.5 text-sm outline-none focus:border-[#8fa285]" />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between"><label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#708075]">Message</label><span className="text-xs text-[#9aa39b]">{body.length} characters</span></div>
                  <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Hi..." rows={16} className="w-full resize-y rounded-2xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-4 text-sm leading-7 outline-none focus:border-[#8fa285]" />
                </div>
                <div className="flex flex-col gap-3 border-t border-[#edf0ea] pt-5 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex-1"><label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#708075]">Save this as a template</label><div className="flex gap-2"><input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Template name" className="min-w-0 flex-1 rounded-xl border border-[#d7e1d0] px-3 py-2.5 text-sm outline-none" /><button onClick={saveTemplate} className="rounded-xl border border-[#d7e1d0] bg-white px-4 py-2.5 text-sm font-semibold text-[#4d6247]">Save</button></div></div>
                  <button onClick={logSent} className="rounded-xl bg-[#647d5b] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#4d6247]">Log as Sent</button>
                </div>
              </div>
            </div>

            <aside className="space-y-5">
              <div className="rounded-3xl border border-[#dfe6db] bg-[#eef2ea] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#849083]">Quick Templates</p>
                <div className="mt-4 space-y-2">{templates.slice(0, 5).map((template) => <button key={template.id} onClick={() => useTemplate(template)} className="w-full rounded-2xl border border-white/80 bg-white/75 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-white"><strong className="block text-sm">{template.name}</strong><span className="mt-1 block truncate text-xs text-[#7b887d]">{template.subject}</span></button>)}</div>
              </div>
              <div className="rounded-3xl border border-[#e5e2d8] bg-[#fffdf8] p-5"><p className="text-sm font-bold">AI can wait.</p><p className="mt-2 text-xs leading-5 text-[#7b887d]">This first version does not use a paid AI API. The hub is built around your own templates and writing, so there is no AI cost.</p></div>
            </aside>
          </div>
        )}

        {tab === "templates" && (
          <div><div className="mb-6"><h2 className="text-2xl font-bold">Email Templates</h2><p className="mt-1 text-sm text-[#708075]">Your reusable JGO Hire messages. Load one into Compose, personalize it, and send when ready.</p></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{templates.map((template) => <article key={template.id} className="flex min-h-[250px] flex-col rounded-3xl border border-[#dfe6db] bg-white p-5 shadow-sm"><span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8aa080]">Template</span><h3 className="mt-3 text-lg font-bold">{template.name}</h3><p className="mt-2 text-sm font-semibold text-[#53664e]">{template.subject}</p><p className="mt-3 line-clamp-4 whitespace-pre-line text-xs leading-5 text-[#7b887d]">{template.body}</p><div className="mt-auto flex gap-2 pt-5"><button onClick={() => useTemplate(template)} className="flex-1 rounded-xl bg-[#647d5b] px-3 py-2.5 text-xs font-semibold text-white">Use Template</button><button onClick={() => setTemplates((current) => current.filter((item) => item.id !== template.id))} className="rounded-xl border border-[#e4ddd8] px-3 py-2.5 text-xs font-semibold text-[#8a655f]">Delete</button></div></article>)}</div></div>
        )}

        {tab === "sent" && (
          <div><div className="mb-6"><h2 className="text-2xl font-bold">Sent History</h2><p className="mt-1 text-sm text-[#708075]">A simple local log for now. We’ll move this into Supabase when live sending is connected.</p></div>{sent.length === 0 ? <div className="rounded-3xl border border-dashed border-[#ced8c9] bg-white/60 p-12 text-center"><p className="font-semibold">No emails logged yet.</p><p className="mt-2 text-sm text-[#7b887d]">Compose your first message and use “Log as Sent.”</p></div> : <div className="overflow-hidden rounded-3xl border border-[#dfe6db] bg-white shadow-sm">{sent.map((email) => <div key={email.id} className="grid gap-3 border-b border-[#edf0ea] p-5 last:border-0 md:grid-cols-[220px_1fr_180px]"><div><strong className="block text-sm">{email.toName}</strong><span className="text-xs text-[#7b887d]">{email.toEmail}</span></div><div><strong className="block text-sm">{email.subject}</strong><p className="mt-1 line-clamp-2 whitespace-pre-line text-xs leading-5 text-[#7b887d]">{email.body}</p></div><span className="text-xs text-[#8b948c] md:text-right">{new Date(email.sentAt).toLocaleString()}</span></div>)}</div>}</div>
        )}
      </div>
    </section>
  );
}
