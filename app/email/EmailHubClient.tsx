"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { createEmailTemplate, deleteEmailTemplate } from "./actions";

type Contact = { id: number; name: string | null; email: string | null; status: string | null; company: string | null };
type EmailContact = { id: number; name: string | null; email: string; company: string | null; client_id: number | null; first_contacted_at: string | null; last_contacted_at: string | null; email_count: number; marketing_opt_in: boolean; notes: string | null };
type Recipient = { clientId: number | null; name: string; email: string };
type Template = { id: number; name: string; subject: string; body: string };
type SentEmail = { id: number; client_id: number | null; recipient_name: string | null; recipient_email: string; subject: string; body: string; template_id: number | null; sent_at: string };
type Tab = "compose" | "contacts" | "templates" | "sent";

function isEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()); }
function stripHtml(value: string) { const div = document.createElement("div"); div.innerHTML = value; return (div.innerText || div.textContent || "").trim(); }
function plainToHtml(value: string) { return value.split(/\n{2,}/).map((p) => `<p>${p.replaceAll("\n", "<br>")}</p>`).join(""); }
function formatDate(value: string | null) { if (!value) return "Never"; return new Date(value).toLocaleString(); }

export default function EmailHubClient({ contacts, initialEmailContacts, initialTemplates, initialSent }: { contacts: Contact[]; initialEmailContacts: EmailContact[]; initialTemplates: Template[]; initialSent: SentEmail[] }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<Tab>("compose");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [templates, setTemplates] = useState(initialTemplates);
  const [sent, setSent] = useState(initialSent);
  const [templateName, setTemplateName] = useState("");
  const [notice, setNotice] = useState("");
  const [activeTemplateId, setActiveTemplateId] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const [sending, setSending] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  const matches = useMemo(() => {
    const q = recipientSearch.trim().toLowerCase();
    if (!q) return [];
    const selected = new Set(recipients.map((r) => r.email));
    return contacts.filter((c) => c.email && !selected.has(c.email.toLowerCase()) && `${c.name || ""} ${c.email} ${c.company || ""}`.toLowerCase().includes(q)).slice(0, 8);
  }, [recipientSearch, contacts, recipients]);

  const filteredEmailContacts = useMemo(() => {
    const q = contactSearch.trim().toLowerCase();
    if (!q) return initialEmailContacts;
    return initialEmailContacts.filter((c) => `${c.name || ""} ${c.email} ${c.company || ""}`.toLowerCase().includes(q));
  }, [contactSearch, initialEmailContacts]);

  const selectedContact = useMemo(() => initialEmailContacts.find((c) => c.email === selectedEmail) || null, [initialEmailContacts, selectedEmail]);
  const selectedHistory = useMemo(() => selectedEmail ? sent.filter((m) => m.recipient_email.toLowerCase() === selectedEmail.toLowerCase()) : [], [sent, selectedEmail]);

  function syncEditor() { const html = editorRef.current?.innerHTML || ""; setBodyHtml(html); setBody(stripHtml(html)); }
  function command(cmd: string, value?: string) { editorRef.current?.focus(); document.execCommand(cmd, false, value); syncEditor(); }
  function addRecipient(recipient: Recipient) { if (!isEmail(recipient.email)) return; setRecipients((current) => current.some((r) => r.email === recipient.email.toLowerCase()) ? current : [...current, { ...recipient, email: recipient.email.toLowerCase() }]); setRecipientSearch(""); }
  function addTypedRecipient() { const email = recipientSearch.trim().toLowerCase(); if (!isEmail(email)) return setNotice("Type a valid email address, then press Enter or Add."); addRecipient({ clientId: null, name: "", email }); setNotice(""); }
  function addAllContacts() { const all = contacts.filter((c) => c.email && isEmail(c.email)).map((c) => ({ clientId: c.id, name: c.name || "", email: c.email!.toLowerCase() })); const unique = Array.from(new Map(all.map((r) => [r.email, r])).values()); setRecipients(unique); setRecipientSearch(""); setNotice(`Added ${unique.length} JGO OS contacts. Review the recipient count before sending.`); }
  function removeRecipient(email: string) { setRecipients((current) => current.filter((r) => r.email !== email)); }

  function resetDraft(success?: string) {
    setRecipients([]); setRecipientSearch(""); setSubject(""); setBody(""); setBodyHtml(""); setActiveTemplateId(null); setTemplateName(""); setTab("compose"); setSelectedEmail(null);
    if (editorRef.current) editorRef.current.innerHTML = "";
    setNotice(success || "");
  }

  function composeTo(email: string, name = "", clientId: number | null = null) {
    resetDraft();
    setRecipients([{ email: email.toLowerCase(), name, clientId }]);
    setTab("compose");
    setNotice(name ? `New email to ${name}.` : `New email to ${email}.`);
  }

  function useTemplate(template: Template) { const html = plainToHtml(template.body); setSubject(template.subject); setBody(template.body); setBodyHtml(html); setActiveTemplateId(template.id); setTab("compose"); setTimeout(() => { if (editorRef.current) editorRef.current.innerHTML = html; }, 0); setNotice(`Loaded “${template.name}”`); }

  function saveTemplate() {
    startTransition(async () => {
      const result = await createEmailTemplate({ name: templateName, subject, body });
      if (!result.ok || !result.template) return setNotice(result.error || "Could not save template.");
      setTemplates((current) => [...current, result.template as Template]); setTemplateName(""); setNotice("Template saved to JGO OS.");
    });
  }

  function removeTemplate(id: number) {
    startTransition(async () => {
      const result = await deleteEmailTemplate(id);
      if (!result.ok) return setNotice(result.error || "Could not delete template.");
      setTemplates((current) => current.filter((item) => item.id !== id)); setNotice("Template deleted.");
    });
  }

  async function sendEmail() {
    if (!recipients.length) return setNotice("Add at least one recipient.");
    if (!subject.trim()) return setNotice("Add a subject before sending.");
    if (!body.trim()) return setNotice("Add a message before sending.");
    if (recipients.length > 1 && !window.confirm(`Send this email individually to ${recipients.length} recipients? Recipient email addresses will stay private.`)) return;
    setSending(true); setNotice("");
    try {
      const response = await fetch("/api/email/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipients, subject, body, bodyHtml, templateId: activeTemplateId }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || result.error || "Unable to send email.");
      const success = result.failedCount ? `Sent ${result.sentCount} email${result.sentCount === 1 ? "" : "s"}. ${result.failedCount} failed.` : `Sent successfully to ${result.sentCount} recipient${result.sentCount === 1 ? "" : "s"}.`;
      window.location.href = `/email?sent=${encodeURIComponent(success)}`;
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to send email."); setSending(false); }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "compose", label: "Compose" },
    { id: "contacts", label: `Contacts (${initialEmailContacts.length})` },
    { id: "templates", label: "Templates" },
    { id: "sent", label: sent.length ? `Sent (${sent.length})` : "Sent" },
  ];

  return (
    <section className="min-h-screen bg-[#f7f8f3] text-[#243128]">
      <header className="border-b border-[#dfe6db] bg-[#fbfaf6] px-6 py-7 lg:px-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8aa080]">JGO OS</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Email Hub</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#708075]">Create polished emails, keep every person you contact, and see the full communication history in one place.</p></div><button onClick={() => resetDraft()} className="rounded-xl bg-[#647d5b] px-5 py-3 text-sm font-semibold text-white">+ New Email</button></div>
        <div className="mt-6 flex w-fit flex-wrap gap-1 rounded-full border border-[#d7e1d0] bg-white p-1">{tabs.map((item) => <button key={item.id} onClick={() => { setTab(item.id); setNotice(""); }} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === item.id ? "bg-[#647d5b] text-white" : "text-[#647066]"}`}>{item.label}</button>)}</div>
      </header>

      <div className="mx-auto max-w-7xl p-6 lg:p-10">
        {notice && <div className="mb-5 rounded-2xl border border-[#d7e1d0] bg-[#edf3e9] px-4 py-3 text-sm font-medium text-[#4d6247]">{notice}</div>}

        {tab === "compose" && <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="overflow-hidden rounded-3xl border border-[#dfe6db] bg-white shadow-sm"><div className="border-b border-[#edf0ea] px-6 py-5"><h2 className="text-xl font-bold">Compose Email</h2><p className="mt-1 text-sm text-[#7b887d]">Add one recipient, several people, or your full JGO OS contact list.</p></div><div className="space-y-5 p-6">
            <div className="relative"><div className="mb-2 flex items-center justify-between gap-3"><label className="text-xs font-bold uppercase tracking-[0.12em] text-[#708075]">To</label><button type="button" onClick={addAllContacts} className="rounded-lg bg-[#eef3ea] px-3 py-1.5 text-xs font-bold text-[#587050]">Add All Contacts</button></div>{recipients.length > 0 && <div className="mb-3 flex flex-wrap gap-2">{recipients.map((r) => <span key={r.email} className="flex items-center gap-2 rounded-full border border-[#d7e1d0] bg-[#f4f7f1] px-3 py-1.5 text-xs font-semibold"><span>{r.name || r.email}</span><button type="button" onClick={() => removeRecipient(r.email)} className="text-[#8b948c]">×</button></span>)}<button type="button" onClick={() => setRecipients([])} className="px-2 text-xs font-semibold text-[#8a655f]">Clear all</button></div>}<div className="flex gap-2"><input value={recipientSearch} onChange={(e) => setRecipientSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTypedRecipient(); } }} placeholder="Search name or type an email address" className="min-w-0 flex-1 rounded-2xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3.5 text-sm outline-none"/><button type="button" onClick={addTypedRecipient} className="rounded-2xl border border-[#d7e1d0] px-4 text-sm font-semibold">Add</button></div>{matches.length > 0 && <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border bg-white shadow-xl">{matches.map((c) => <button key={c.id} type="button" onClick={() => addRecipient({ clientId: c.id, name: c.name || "", email: c.email || "" })} className="flex w-full items-center justify-between border-b px-4 py-3 text-left hover:bg-[#f7f9f5]"><span><strong className="block text-sm">{c.name}</strong><small className="text-[#7b887d]">{c.email}</small></span><span className="rounded-full bg-[#edf2e9] px-2.5 py-1 text-[10px] font-bold uppercase text-[#647d5b]">{c.status || "Contact"}</span></button>)}</div>}</div>
            <div><label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#708075]">Subject</label><input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject" className="w-full rounded-2xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3.5 text-sm outline-none"/></div>
            <div><div className="mb-2 flex items-center justify-between"><label className="text-xs font-bold uppercase tracking-[0.12em] text-[#708075]">Message</label><span className="text-xs text-[#9aa39b]">{body.length} characters</span></div><div className="overflow-hidden rounded-2xl border border-[#d7e1d0] bg-white"><div className="flex flex-wrap items-center gap-1 border-b border-[#e8ece5] bg-[#f7f9f5] p-2"><button type="button" onClick={() => command("bold")} className="rounded-lg px-3 py-2 text-sm font-bold hover:bg-white">B</button><button type="button" onClick={() => command("italic")} className="rounded-lg px-3 py-2 text-sm italic hover:bg-white">I</button><button type="button" onClick={() => command("underline")} className="rounded-lg px-3 py-2 text-sm underline hover:bg-white">U</button><span className="mx-1 h-6 w-px bg-[#dfe6db]"/><select onChange={(e) => { if (e.target.value) command("fontSize", e.target.value); }} defaultValue="3" className="rounded-lg border border-[#dfe6db] bg-white px-2 py-1.5 text-xs"><option value="2">Small</option><option value="3">Normal</option><option value="4">Large</option><option value="5">Heading</option></select><button type="button" onClick={() => command("insertUnorderedList")} className="rounded-lg px-3 py-2 text-sm hover:bg-white">• List</button><button type="button" onClick={() => command("insertOrderedList")} className="rounded-lg px-3 py-2 text-sm hover:bg-white">1. List</button><button type="button" onClick={() => command("removeFormat")} className="rounded-lg px-3 py-2 text-xs font-semibold hover:bg-white">Clear Format</button></div><div ref={editorRef} contentEditable suppressContentEditableWarning onInput={syncEditor} data-placeholder="Type your email here..." className="min-h-[330px] px-5 py-4 text-sm leading-7 outline-none empty:before:pointer-events-none empty:before:text-[#9aa39b] empty:before:content-[attr(data-placeholder)]"/></div><p className="mt-2 text-xs text-[#8b948c]">Use <strong>{"{{first_name}}"}</strong> if you are sending to multiple saved contacts and want each email personalized.</p></div>
            <div className="flex flex-col gap-3 border-t border-[#edf0ea] pt-5 sm:flex-row sm:items-end sm:justify-between"><div className="flex-1"><label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#708075]">Save this as a template</label><div className="flex gap-2"><input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Template name" className="min-w-0 flex-1 rounded-xl border px-3 py-2.5 text-sm"/><button disabled={pending} onClick={saveTemplate} className="rounded-xl border px-4 py-2.5 text-sm font-semibold text-[#4d6247]">Save</button></div></div><button disabled={sending} onClick={sendEmail} className="rounded-xl bg-[#647d5b] px-7 py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-60">{sending ? `Sending to ${recipients.length}...` : recipients.length > 1 ? `Send to ${recipients.length}` : "Send Email"}</button></div>
          </div></div>
          <aside className="space-y-5"><div className="rounded-3xl border border-[#dfe6db] bg-[#eef2ea] p-5"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#849083]">Recipients</p><p className="mt-2 text-3xl font-bold text-[#4d6247]">{recipients.length}</p><p className="mt-1 text-xs leading-5 text-[#7b887d]">Each person receives their own email. Recipient addresses are never exposed to the group.</p></div><div className="rounded-3xl border border-[#dfe6db] bg-[#eef2ea] p-5"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#849083]">Quick Templates</p>{templates.length === 0 ? <p className="mt-4 text-xs leading-5 text-[#7b887d]">No saved templates yet.</p> : <div className="mt-4 space-y-2">{templates.slice(0, 5).map((t) => <button key={t.id} onClick={() => useTemplate(t)} className="w-full rounded-2xl border bg-white/75 p-4 text-left shadow-sm"><strong className="block text-sm">{t.name}</strong><span className="mt-1 block truncate text-xs text-[#7b887d]">{t.subject}</span></button>)}</div>}</div></aside>
        </div>}

        {tab === "contacts" && <div className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
          <div><div className="mb-4"><h2 className="text-2xl font-bold">Email Contacts</h2><p className="mt-1 text-sm text-[#708075]">Anyone you email becomes a saved contact, even if they never become a client.</p></div><input value={contactSearch} onChange={(e) => setContactSearch(e.target.value)} placeholder="Search name, email, or company" className="mb-4 w-full rounded-2xl border border-[#d7e1d0] bg-white px-4 py-3 text-sm outline-none"/><div className="max-h-[680px] space-y-2 overflow-y-auto pr-1">{filteredEmailContacts.length === 0 ? <div className="rounded-3xl border border-dashed bg-white/60 p-8 text-center text-sm text-[#7b887d]">No email contacts yet. Send an email and they will appear here automatically.</div> : filteredEmailContacts.map((c) => <button key={c.id} onClick={() => setSelectedEmail(c.email)} className={`w-full rounded-2xl border p-4 text-left transition ${selectedEmail === c.email ? "border-[#9eb294] bg-[#edf3e9]" : "border-[#dfe6db] bg-white hover:bg-[#fafbf8]"}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><strong className="block truncate text-sm">{c.name || c.email}</strong><span className="mt-1 block truncate text-xs text-[#7b887d]">{c.email}</span>{c.company && <span className="mt-1 block truncate text-xs text-[#9aa39b]">{c.company}</span>}</div><span className="rounded-full bg-[#eef3ea] px-2.5 py-1 text-[10px] font-bold text-[#647d5b]">{c.email_count} email{c.email_count === 1 ? "" : "s"}</span></div><div className="mt-3 text-[11px] text-[#8b948c]">Last contacted: {c.last_contacted_at ? new Date(c.last_contacted_at).toLocaleDateString() : "Never"}</div></button>)}</div></div>

          <div>{!selectedContact ? <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-dashed border-[#ced8c9] bg-white/60 p-10 text-center"><div><p className="text-lg font-bold">Select a contact</p><p className="mt-2 max-w-sm text-sm leading-6 text-[#7b887d]">Choose someone on the left to see every email you have sent them and start a new conversation.</p></div></div> : <div className="overflow-hidden rounded-3xl border border-[#dfe6db] bg-white shadow-sm"><div className="border-b border-[#edf0ea] bg-[linear-gradient(145deg,#eef4eb,#ffffff)] p-6 lg:p-7"><div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between"><div><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#849083]">Contact History</span><h2 className="mt-2 text-3xl font-bold tracking-tight">{selectedContact.name || selectedContact.email}</h2><p className="mt-1 text-sm text-[#708075]">{selectedContact.email}{selectedContact.company ? ` · ${selectedContact.company}` : ""}</p><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#647d5b]">{selectedContact.email_count} email{selectedContact.email_count === 1 ? "" : "s"}</span>{selectedContact.client_id ? <span className="rounded-full bg-[#dfe9d9] px-3 py-1.5 text-xs font-semibold text-[#52684b]">Linked to client</span> : <span className="rounded-full bg-[#f3eee4] px-3 py-1.5 text-xs font-semibold text-[#7b6e58]">Email contact</span>}</div></div><button onClick={() => composeTo(selectedContact.email, selectedContact.name || "", selectedContact.client_id)} className="rounded-xl bg-[#647d5b] px-5 py-3 text-sm font-semibold text-white">Email Again</button></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-white bg-white/70 p-4"><span className="text-[10px] font-bold uppercase tracking-wide text-[#8b948c]">First contacted</span><p className="mt-1 text-sm font-semibold">{formatDate(selectedContact.first_contacted_at)}</p></div><div className="rounded-2xl border border-white bg-white/70 p-4"><span className="text-[10px] font-bold uppercase tracking-wide text-[#8b948c]">Last contacted</span><p className="mt-1 text-sm font-semibold">{formatDate(selectedContact.last_contacted_at)}</p></div></div></div><div className="p-6 lg:p-7"><h3 className="mb-4 text-lg font-bold">Conversation History</h3>{selectedHistory.length === 0 ? <p className="rounded-2xl bg-[#f7f9f5] p-5 text-sm text-[#7b887d]">No saved sent messages found for this contact yet.</p> : <div className="space-y-3">{selectedHistory.map((email) => <details key={email.id} className="group rounded-2xl border border-[#e1e7dd] bg-[#fbfcf9] p-4"><summary className="cursor-pointer list-none"><div className="flex items-start justify-between gap-4"><div><strong className="block text-sm">{email.subject}</strong><p className="mt-1 line-clamp-2 text-xs leading-5 text-[#7b887d]">{email.body}</p></div><span className="shrink-0 text-[11px] text-[#8b948c]">{new Date(email.sent_at).toLocaleString()}</span></div></summary><div className="mt-4 border-t border-[#e5eae1] pt-4"><p className="whitespace-pre-line text-sm leading-7 text-[#3d4a40]">{email.body}</p><button onClick={() => composeTo(selectedContact.email, selectedContact.name || "", selectedContact.client_id)} className="mt-4 rounded-xl border border-[#d7e1d0] bg-white px-4 py-2.5 text-xs font-bold text-[#52684b]">Email Again</button></div></details>)}</div>}</div></div>}</div>
        </div>}

        {tab === "templates" && <div><div className="mb-6"><h2 className="text-2xl font-bold">Email Templates</h2><p className="mt-1 text-sm text-[#708075]">Saved in JGO OS and available wherever you log in.</p></div>{templates.length === 0 ? <div className="rounded-3xl border border-dashed bg-white/60 p-12 text-center"><p className="font-semibold">No templates yet.</p></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{templates.map((t) => <article key={t.id} className="flex min-h-[250px] flex-col rounded-3xl border border-[#dfe6db] bg-white p-5 shadow-sm"><span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8aa080]">Template</span><h3 className="mt-3 text-lg font-bold">{t.name}</h3><p className="mt-2 text-sm font-semibold text-[#53664e]">{t.subject}</p><p className="mt-3 line-clamp-4 whitespace-pre-line text-xs leading-5 text-[#7b887d]">{t.body}</p><div className="mt-auto flex gap-2 pt-5"><button onClick={() => useTemplate(t)} className="flex-1 rounded-xl bg-[#647d5b] px-3 py-2.5 text-xs font-semibold text-white">Use Template</button><button disabled={pending} onClick={() => removeTemplate(t.id)} className="rounded-xl border px-3 py-2.5 text-xs font-semibold text-[#8a655f]">Delete</button></div></article>)}</div>}</div>}

        {tab === "sent" && <div><div className="mb-6"><h2 className="text-2xl font-bold">Sent History</h2><p className="mt-1 text-sm text-[#708075]">Every email actually sent from JGO OS. Click a recipient to open their full history.</p></div>{sent.length === 0 ? <div className="rounded-3xl border border-dashed bg-white/60 p-12 text-center"><p className="font-semibold">No emails sent yet.</p></div> : <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">{sent.map((e) => <div key={e.id} className="grid gap-3 border-b p-5 last:border-0 md:grid-cols-[220px_1fr_180px]"><button onClick={() => { setSelectedEmail(e.recipient_email); setTab("contacts"); }} className="text-left"><strong className="block text-sm hover:text-[#647d5b]">{e.recipient_name || e.recipient_email}</strong><span className="text-xs text-[#7b887d]">{e.recipient_email}</span></button><div><strong className="block text-sm">{e.subject}</strong><p className="mt-1 line-clamp-2 whitespace-pre-line text-xs leading-5 text-[#7b887d]">{e.body}</p></div><span className="text-xs text-[#8b948c] md:text-right">{new Date(e.sent_at).toLocaleString()}</span></div>)}</div>}</div>}
      </div>
    </section>
  );
}
