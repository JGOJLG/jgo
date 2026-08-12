"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { createEmailTemplate, deleteEmailTemplate } from "./actions";

type Contact = { id: number; name: string | null; email: string | null; status: string | null; company: string | null };
type Recipient = { clientId: number | null; name: string; email: string };
type Template = { id: number; name: string; subject: string; body: string };
type SentEmail = { id: number; client_id: number | null; recipient_name: string | null; recipient_email: string; subject: string; body: string; template_id: number | null; sent_at: string };

function isEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()); }
function stripHtml(value: string) { const div = document.createElement("div"); div.innerHTML = value; return (div.innerText || div.textContent || "").trim(); }
function plainToHtml(value: string) { return value.split(/\n{2,}/).map((p) => `<p>${p.replaceAll("\n", "<br>")}</p>`).join(""); }

export default function EmailHubClient({ contacts, initialTemplates, initialSent }: { contacts: Contact[]; initialTemplates: Template[]; initialSent: SentEmail[] }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<"compose" | "templates" | "sent">("compose");
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

  const matches = useMemo(() => {
    const q = recipientSearch.trim().toLowerCase();
    if (!q) return [];
    const selected = new Set(recipients.map((r) => r.email));
    return contacts.filter((c) => c.email && !selected.has(c.email.toLowerCase()) && `${c.name || ""} ${c.email} ${c.company || ""}`.toLowerCase().includes(q)).slice(0, 8);
  }, [recipientSearch, contacts, recipients]);

  function syncEditor() {
    const html = editorRef.current?.innerHTML || "";
    setBodyHtml(html);
    setBody(stripHtml(html));
  }

  function command(cmd: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    syncEditor();
  }

  function addRecipient(recipient: Recipient) {
    if (!isEmail(recipient.email)) return;
    setRecipients((current) => current.some((r) => r.email === recipient.email.toLowerCase()) ? current : [...current, { ...recipient, email: recipient.email.toLowerCase() }]);
    setRecipientSearch("");
  }

  function addTypedRecipient() {
    const email = recipientSearch.trim().toLowerCase();
    if (!isEmail(email)) return setNotice("Type a valid email address, then press Enter or Add.");
    addRecipient({ clientId: null, name: "", email });
    setNotice("");
  }

  function addAllContacts() {
    const all = contacts.filter((c) => c.email && isEmail(c.email)).map((c) => ({ clientId: c.id, name: c.name || "", email: c.email!.toLowerCase() }));
    const unique = Array.from(new Map(all.map((r) => [r.email, r])).values());
    setRecipients(unique);
    setRecipientSearch("");
    setNotice(`Added ${unique.length} JGO OS contacts. Review the recipient count before sending.`);
  }

  function removeRecipient(email: string) { setRecipients((current) => current.filter((r) => r.email !== email)); }

  function resetDraft(success?: string) {
    setRecipients([]); setRecipientSearch(""); setSubject(""); setBody(""); setBodyHtml(""); setActiveTemplateId(null); setTemplateName(""); setTab("compose");
    if (editorRef.current) editorRef.current.innerHTML = "";
    setNotice(success || "");
  }

  function useTemplate(template: Template) {
    const html = plainToHtml(template.body);
    setSubject(template.subject); setBody(template.body); setBodyHtml(html); setActiveTemplateId(template.id); setTab("compose");
    setTimeout(() => { if (editorRef.current) editorRef.current.innerHTML = html; }, 0);
    setNotice(`Loaded “${template.name}”`);
  }

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
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients, subject, body, bodyHtml, templateId: activeTemplateId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || result.error || "Unable to send email.");
      if (Array.isArray(result.messages)) setSent((current) => [...result.messages as SentEmail[], ...current]);
      const success = result.failedCount ? `Sent ${result.sentCount} email${result.sentCount === 1 ? "" : "s"}. ${result.failedCount} failed.` : `Sent successfully to ${result.sentCount} recipient${result.sentCount === 1 ? "" : "s"}.`;
      resetDraft(success);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to send email."); }
    finally { setSending(false); }
  }

  return (
    <section className="min-h-screen bg-[#f7f8f3] text-[#243128]">
      <header className="border-b border-[#dfe6db] bg-[#fbfaf6] px-6 py-7 lg:px-10"><div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8aa080]">JGO OS</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Email Hub</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#708075]">Create polished emails, send to one person or a group, and manage your JGO Hire communication in one place.</p></div><button onClick={()=>resetDraft()} className="rounded-xl bg-[#647d5b] px-5 py-3 text-sm font-semibold text-white">+ New Email</button></div><div className="mt-6 flex w-fit gap-1 rounded-full border border-[#d7e1d0] bg-white p-1">{(["compose","templates","sent"] as const).map((item)=><button key={item} onClick={()=>setTab(item)} className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${tab===item?"bg-[#647d5b] text-white":"text-[#647066]"}`}>{item}{item==="sent"&&sent.length?` (${sent.length})`:""}</button>)}</div></header>
      <div className="mx-auto max-w-7xl p-6 lg:p-10">
        {notice&&<div className="mb-5 rounded-2xl border border-[#d7e1d0] bg-[#edf3e9] px-4 py-3 text-sm font-medium text-[#4d6247]">{notice}</div>}
        {tab==="compose"&&<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="overflow-hidden rounded-3xl border border-[#dfe6db] bg-white shadow-sm"><div className="border-b border-[#edf0ea] px-6 py-5"><h2 className="text-xl font-bold">Compose Email</h2><p className="mt-1 text-sm text-[#7b887d]">Add one recipient, several people, or your full JGO OS contact list.</p></div><div className="space-y-5 p-6">
            <div className="relative"><div className="mb-2 flex items-center justify-between gap-3"><label className="text-xs font-bold uppercase tracking-[0.12em] text-[#708075]">To</label><button type="button" onClick={addAllContacts} className="rounded-lg bg-[#eef3ea] px-3 py-1.5 text-xs font-bold text-[#587050]">Add All Contacts</button></div>{recipients.length>0&&<div className="mb-3 flex flex-wrap gap-2">{recipients.map((r)=><span key={r.email} className="flex items-center gap-2 rounded-full border border-[#d7e1d0] bg-[#f4f7f1] px-3 py-1.5 text-xs font-semibold"><span>{r.name || r.email}</span><button type="button" onClick={()=>removeRecipient(r.email)} className="text-[#8b948c]">×</button></span>)}<button type="button" onClick={()=>setRecipients([])} className="px-2 text-xs font-semibold text-[#8a655f]">Clear all</button></div>}<div className="flex gap-2"><input value={recipientSearch} onChange={(e)=>setRecipientSearch(e.target.value)} onKeyDown={(e)=>{if(e.key==="Enter"){e.preventDefault();addTypedRecipient();}}} placeholder="Search name or type an email address" className="min-w-0 flex-1 rounded-2xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3.5 text-sm outline-none"/><button type="button" onClick={addTypedRecipient} className="rounded-2xl border border-[#d7e1d0] px-4 text-sm font-semibold">Add</button></div>{matches.length>0&&<div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border bg-white shadow-xl">{matches.map((c)=><button key={c.id} type="button" onClick={()=>addRecipient({clientId:c.id,name:c.name||"",email:c.email||""})} className="flex w-full items-center justify-between border-b px-4 py-3 text-left hover:bg-[#f7f9f5]"><span><strong className="block text-sm">{c.name}</strong><small className="text-[#7b887d]">{c.email}</small></span><span className="rounded-full bg-[#edf2e9] px-2.5 py-1 text-[10px] font-bold uppercase text-[#647d5b]">{c.status||"Contact"}</span></button>)}</div>}</div>
            <div><label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#708075]">Subject</label><input value={subject} onChange={(e)=>setSubject(e.target.value)} placeholder="Email subject" className="w-full rounded-2xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3.5 text-sm outline-none"/></div>
            <div><div className="mb-2 flex items-center justify-between"><label className="text-xs font-bold uppercase tracking-[0.12em] text-[#708075]">Message</label><span className="text-xs text-[#9aa39b]">{body.length} characters</span></div><div className="overflow-hidden rounded-2xl border border-[#d7e1d0] bg-white"><div className="flex flex-wrap items-center gap-1 border-b border-[#e8ece5] bg-[#f7f9f5] p-2"><button type="button" onClick={()=>command("bold")} className="rounded-lg px-3 py-2 text-sm font-bold hover:bg-white">B</button><button type="button" onClick={()=>command("italic")} className="rounded-lg px-3 py-2 text-sm italic hover:bg-white">I</button><button type="button" onClick={()=>command("underline")} className="rounded-lg px-3 py-2 text-sm underline hover:bg-white">U</button><span className="mx-1 h-6 w-px bg-[#dfe6db]"/><select onChange={(e)=>{if(e.target.value) command("fontSize",e.target.value)}} defaultValue="3" className="rounded-lg border border-[#dfe6db] bg-white px-2 py-1.5 text-xs"><option value="2">Small</option><option value="3">Normal</option><option value="4">Large</option><option value="5">Heading</option></select><button type="button" onClick={()=>command("insertUnorderedList")} className="rounded-lg px-3 py-2 text-sm hover:bg-white">• List</button><button type="button" onClick={()=>command("insertOrderedList")} className="rounded-lg px-3 py-2 text-sm hover:bg-white">1. List</button><button type="button" onClick={()=>command("removeFormat")} className="rounded-lg px-3 py-2 text-xs font-semibold hover:bg-white">Clear Format</button></div><div ref={editorRef} contentEditable suppressContentEditableWarning onInput={syncEditor} data-placeholder="Type your email here..." className="min-h-[330px] px-5 py-4 text-sm leading-7 outline-none empty:before:pointer-events-none empty:before:text-[#9aa39b] empty:before:content-[attr(data-placeholder)]"/></div><p className="mt-2 text-xs text-[#8b948c]">Use <strong>{"{{first_name}}"}</strong> if you are sending to multiple saved contacts and want each email personalized.</p></div>
            <div className="flex flex-col gap-3 border-t border-[#edf0ea] pt-5 sm:flex-row sm:items-end sm:justify-between"><div className="flex-1"><label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#708075]">Save this as a template</label><div className="flex gap-2"><input value={templateName} onChange={(e)=>setTemplateName(e.target.value)} placeholder="Template name" className="min-w-0 flex-1 rounded-xl border px-3 py-2.5 text-sm"/><button disabled={pending} onClick={saveTemplate} className="rounded-xl border px-4 py-2.5 text-sm font-semibold text-[#4d6247]">Save</button></div></div><button disabled={sending} onClick={sendEmail} className="rounded-xl bg-[#647d5b] px-7 py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-60">{sending?`Sending to ${recipients.length}...`:recipients.length>1?`Send to ${recipients.length}`:"Send Email"}</button></div>
          </div></div>
          <aside className="space-y-5"><div className="rounded-3xl border border-[#dfe6db] bg-[#eef2ea] p-5"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#849083]">Recipients</p><p className="mt-2 text-3xl font-bold text-[#4d6247]">{recipients.length}</p><p className="mt-1 text-xs leading-5 text-[#7b887d]">Each person receives their own email. Recipient addresses are never exposed to the group.</p></div><div className="rounded-3xl border border-[#dfe6db] bg-[#eef2ea] p-5"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#849083]">Quick Templates</p>{templates.length===0?<p className="mt-4 text-xs leading-5 text-[#7b887d]">No saved templates yet.</p>:<div className="mt-4 space-y-2">{templates.slice(0,5).map((t)=><button key={t.id} onClick={()=>useTemplate(t)} className="w-full rounded-2xl border bg-white/75 p-4 text-left shadow-sm"><strong className="block text-sm">{t.name}</strong><span className="mt-1 block truncate text-xs text-[#7b887d]">{t.subject}</span></button>)}</div>}</div></aside>
        </div>}
        {tab==="templates"&&<div><div className="mb-6"><h2 className="text-2xl font-bold">Email Templates</h2><p className="mt-1 text-sm text-[#708075]">Saved in JGO OS and available wherever you log in.</p></div>{templates.length===0?<div className="rounded-3xl border border-dashed bg-white/60 p-12 text-center"><p className="font-semibold">No templates yet.</p></div>:<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{templates.map((t)=><article key={t.id} className="flex min-h-[250px] flex-col rounded-3xl border border-[#dfe6db] bg-white p-5 shadow-sm"><span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8aa080]">Template</span><h3 className="mt-3 text-lg font-bold">{t.name}</h3><p className="mt-2 text-sm font-semibold text-[#53664e]">{t.subject}</p><p className="mt-3 line-clamp-4 whitespace-pre-line text-xs leading-5 text-[#7b887d]">{t.body}</p><div className="mt-auto flex gap-2 pt-5"><button onClick={()=>useTemplate(t)} className="flex-1 rounded-xl bg-[#647d5b] px-3 py-2.5 text-xs font-semibold text-white">Use Template</button><button disabled={pending} onClick={()=>removeTemplate(t.id)} className="rounded-xl border px-3 py-2.5 text-xs font-semibold text-[#8a655f]">Delete</button></div></article>)}</div>}</div>}
        {tab==="sent"&&<div><div className="mb-6"><h2 className="text-2xl font-bold">Sent History</h2><p className="mt-1 text-sm text-[#708075]">Emails actually sent from JGO OS.</p></div>{sent.length===0?<div className="rounded-3xl border border-dashed bg-white/60 p-12 text-center"><p className="font-semibold">No emails sent yet.</p></div>:<div className="overflow-hidden rounded-3xl border bg-white shadow-sm">{sent.map((e)=><div key={e.id} className="grid gap-3 border-b p-5 last:border-0 md:grid-cols-[220px_1fr_180px]"><div><strong className="block text-sm">{e.recipient_name||e.recipient_email}</strong><span className="text-xs text-[#7b887d]">{e.recipient_email}</span></div><div><strong className="block text-sm">{e.subject}</strong><p className="mt-1 line-clamp-2 whitespace-pre-line text-xs leading-5 text-[#7b887d]">{e.body}</p></div><span className="text-xs text-[#8b948c] md:text-right">{new Date(e.sent_at).toLocaleString()}</span></div>)}</div>}</div>}
      </div>
    </section>
  );
}
