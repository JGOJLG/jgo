"use client";

import { useMemo, useState, useTransition } from "react";
import { createEmailTemplate, deleteEmailTemplate } from "./actions";

type Contact = { id: number; name: string | null; email: string | null; status: string | null; company: string | null };
type Template = { id: number; name: string; subject: string; body: string };
type SentEmail = { id: number; client_id: number | null; recipient_name: string | null; recipient_email: string; subject: string; body: string; template_id: number | null; sent_at: string };

type PreviewBlock = { type: "paragraph" | "list"; text?: string; items?: string[] };

function firstName(name: string | null) { return (name || "there").trim().split(/\s+/)[0] || "there"; }
function personalize(text: string, contact: Contact | null) {
  if (!contact) return text;
  return text.replaceAll("{{first_name}}", firstName(contact.name)).replaceAll("{{name}}", contact.name || "").replaceAll("{{company}}", contact.company || "");
}
function isEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()); }

function buildPreviewBlocks(value: string): PreviewBlock[] {
  const lines = value.replace(/\r/g, "").split("\n");
  const blocks: PreviewBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  const flushParagraph = () => { if (paragraph.length) { blocks.push({ type: "paragraph", text: paragraph.join(" ").trim() }); paragraph = []; } };
  const flushList = () => { if (list.length) { blocks.push({ type: "list", items: [...list] }); list = []; } };

  for (const raw of lines) {
    const line = raw.trim();
    const bullet = line.match(/^(?:[-*•]|\d+[.)])\s+(.+)$/);
    if (!line) { flushParagraph(); flushList(); continue; }
    if (bullet) { flushParagraph(); list.push(bullet[1]); continue; }
    flushList(); paragraph.push(line);
  }
  flushParagraph(); flushList();
  return blocks;
}

export default function EmailHubClient({ contacts, initialTemplates, initialSent }: { contacts: Contact[]; initialTemplates: Template[]; initialSent: SentEmail[] }) {
  const [tab, setTab] = useState<"compose" | "templates" | "sent">("compose");
  const [recipient, setRecipient] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [templates, setTemplates] = useState(initialTemplates);
  const [sent, setSent] = useState(initialSent);
  const [templateName, setTemplateName] = useState("");
  const [notice, setNotice] = useState("");
  const [activeTemplateId, setActiveTemplateId] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const [sending, setSending] = useState(false);

  const previewBlocks = useMemo(() => buildPreviewBlocks(body), [body]);
  const matches = useMemo(() => {
    const q = recipient.trim().toLowerCase();
    if (!q || selectedContact) return [];
    return contacts.filter((c) => `${c.name || ""} ${c.email || ""} ${c.company || ""}`.toLowerCase().includes(q)).slice(0, 8);
  }, [recipient, contacts, selectedContact]);

  function chooseContact(contact: Contact) { setSelectedContact(contact); setRecipient(contact.email || ""); }
  function useTemplate(template: Template) { setSubject(personalize(template.subject, selectedContact)); setBody(personalize(template.body, selectedContact)); setActiveTemplateId(template.id); setPreviewOpen(false); setTab("compose"); setNotice(`Loaded “${template.name}”`); }
  function resetDraft() { setSelectedContact(null); setRecipient(""); setSubject(""); setBody(""); setActiveTemplateId(null); setPreviewOpen(false); setNotice(""); setTab("compose"); }
  function formatEmail() {
    if (!body.trim()) return setNotice("Type your email first, then click Convert to Format.");
    setPreviewOpen(true);
    setNotice("Formatted preview ready. Your wording was not changed.");
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
    const email = selectedContact?.email || recipient.trim();
    if (!isEmail(email)) return setNotice("Enter a valid email address. You can choose a client/lead or type any email address.");
    if (!subject.trim()) return setNotice("Add a subject before sending.");
    if (!body.trim()) return setNotice("Add a message before sending.");
    setSending(true); setNotice("");
    try {
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: selectedContact?.id ?? null, recipientName: selectedContact?.name ?? "", recipientEmail: email, subject, body, templateId: activeTemplateId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || result.error || "Unable to send email.");
      if (result.message) setSent((current) => [result.message as SentEmail, ...current]);
      setNotice(result.warning || `Email sent successfully to ${email}.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to send email."); }
    finally { setSending(false); }
  }

  return (
    <section className="min-h-screen bg-[#f7f8f3] text-[#243128]">
      <header className="border-b border-[#dfe6db] bg-[#fbfaf6] px-6 py-7 lg:px-10"><div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8aa080]">JGO OS</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Email Hub</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#708075]">Type the email in plain text, convert it into a polished JGO Hire format, preview it, and send it directly from here.</p></div><button onClick={resetDraft} className="rounded-xl bg-[#647d5b] px-5 py-3 text-sm font-semibold text-white">+ New Email</button></div><div className="mt-6 flex w-fit gap-1 rounded-full border border-[#d7e1d0] bg-white p-1">{(["compose","templates","sent"] as const).map((item)=><button key={item} onClick={()=>setTab(item)} className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${tab===item?"bg-[#647d5b] text-white":"text-[#647066]"}`}>{item}{item==="sent"&&sent.length?` (${sent.length})`:""}</button>)}</div></header>
      <div className="mx-auto max-w-7xl p-6 lg:p-10">
        {notice&&<div className="mb-5 rounded-2xl border border-[#d7e1d0] bg-[#edf3e9] px-4 py-3 text-sm font-medium text-[#4d6247]">{notice}</div>}
        {tab==="compose"&&<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="overflow-hidden rounded-3xl border border-[#dfe6db] bg-white shadow-sm"><div className="border-b border-[#edf0ea] px-6 py-5"><h2 className="text-xl font-bold">Compose Email</h2><p className="mt-1 text-sm text-[#7b887d]">Write normally. Convert to Format changes the presentation, not your wording.</p></div><div className="space-y-5 p-6">
            <div className="relative"><label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#708075]">To</label><input value={recipient} onChange={(e)=>{setRecipient(e.target.value);setSelectedContact(null)}} placeholder="Search a client/lead or type any email address" className="w-full rounded-2xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3.5 text-sm outline-none"/>{selectedContact&&<button type="button" onClick={()=>{setSelectedContact(null);setRecipient("")}} className="mt-2 text-xs font-semibold text-[#647d5b]">Selected: {selectedContact.name} · clear</button>}{matches.length>0&&<div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border bg-white shadow-xl">{matches.map((c)=><button key={c.id} type="button" onClick={()=>chooseContact(c)} className="flex w-full items-center justify-between border-b px-4 py-3 text-left hover:bg-[#f7f9f5]"><span><strong className="block text-sm">{c.name}</strong><small className="text-[#7b887d]">{c.email}</small></span><span className="rounded-full bg-[#edf2e9] px-2.5 py-1 text-[10px] font-bold uppercase text-[#647d5b]">{c.status||"Lead"}</span></button>)}</div>}</div>
            <div><label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#708075]">Subject</label><input value={subject} onChange={(e)=>setSubject(e.target.value)} placeholder="Email subject" className="w-full rounded-2xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3.5 text-sm outline-none"/></div>
            <div><div className="mb-2 flex items-center justify-between"><label className="text-xs font-bold uppercase tracking-[0.12em] text-[#708075]">Type your email</label><span className="text-xs text-[#9aa39b]">{body.length} characters</span></div><textarea value={body} onChange={(e)=>{setBody(e.target.value);setPreviewOpen(false)}} placeholder={'Hi Sarah,\n\nIt was great speaking with you today...\n\n- First point\n- Second point\n\nBest,\nJen'} rows={15} className="w-full resize-y rounded-2xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-4 text-sm leading-7 outline-none"/><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={formatEmail} className="rounded-xl bg-[#e6eee2] px-5 py-3 text-sm font-bold text-[#4d6247] hover:bg-[#dce8d6]">Convert to Format</button>{previewOpen&&<button type="button" onClick={()=>setPreviewOpen(false)} className="rounded-xl border border-[#d7e1d0] bg-white px-4 py-3 text-sm font-semibold text-[#647066]">Back to Writing</button>}</div></div>

            {previewOpen&&<div className="overflow-hidden rounded-[26px] border border-[#d9e2d5] bg-[#f1f5ed] p-4 sm:p-6"><div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7f9975]">Formatted Preview</p><p className="mt-1 text-xs text-[#7b887d]">This is how the message will be styled.</p></div><span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#647d5b]">JGO Hire</span></div><div className="overflow-hidden rounded-[22px] border border-[#e0e7dc] bg-white shadow-sm"><div className="bg-[linear-gradient(145deg,#e6efe2,#f7faf5)] px-6 py-5"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#647d5b]">JGO Hire</p>{subject&&<h3 className="mt-2 text-xl font-bold tracking-tight text-[#243128]">{subject}</h3>}</div><div className="space-y-4 px-6 py-6">{previewBlocks.map((block,index)=>block.type==="list"?<ul key={index} className="space-y-2 rounded-2xl bg-[#f4f7f1] p-4">{block.items?.map((item,i)=><li key={i} className="flex gap-3 text-sm leading-6 text-[#3b473d]"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7f9975]"/><span>{item}</span></li>)}</ul>:<p key={index} className="whitespace-pre-line text-sm leading-7 text-[#344039]">{block.text}</p>)}</div><div className="border-t border-[#edf0ea] px-6 py-4 text-[11px] text-[#8b948c]">JGO Hire · Career Coach + Recruiter</div></div></div>}

            <div className="flex flex-col gap-3 border-t border-[#edf0ea] pt-5 sm:flex-row sm:items-end sm:justify-between"><div className="flex-1"><label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#708075]">Save this as a template</label><div className="flex gap-2"><input value={templateName} onChange={(e)=>setTemplateName(e.target.value)} placeholder="Template name" className="min-w-0 flex-1 rounded-xl border px-3 py-2.5 text-sm"/><button disabled={pending} onClick={saveTemplate} className="rounded-xl border px-4 py-2.5 text-sm font-semibold text-[#4d6247]">Save</button></div></div><button disabled={sending} onClick={sendEmail} className="rounded-xl bg-[#647d5b] px-7 py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-60">{sending?"Sending...":"Send Email"}</button></div>
          </div></div>
          <aside className="space-y-5"><div className="rounded-3xl border border-[#dfe6db] bg-[#eef2ea] p-5"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#849083]">Quick Templates</p>{templates.length===0?<p className="mt-4 text-xs leading-5 text-[#7b887d]">No saved templates yet.</p>:<div className="mt-4 space-y-2">{templates.slice(0,5).map((t)=><button key={t.id} onClick={()=>useTemplate(t)} className="w-full rounded-2xl border bg-white/75 p-4 text-left shadow-sm"><strong className="block text-sm">{t.name}</strong><span className="mt-1 block truncate text-xs text-[#7b887d]">{t.subject}</span></button>)}</div>}</div><div className="rounded-3xl border border-[#e5e2d8] bg-[#fffdf8] p-5"><p className="text-sm font-bold">What “Convert to Format” does</p><p className="mt-2 text-xs leading-5 text-[#7b887d]">It keeps your words exactly as written, adds clean paragraph spacing, turns bullet lines into a polished list, and applies the JGO Hire email design.</p></div></aside>
        </div>}
        {tab==="templates"&&<div><div className="mb-6"><h2 className="text-2xl font-bold">Email Templates</h2><p className="mt-1 text-sm text-[#708075]">Saved in JGO OS and available wherever you log in.</p></div>{templates.length===0?<div className="rounded-3xl border border-dashed bg-white/60 p-12 text-center"><p className="font-semibold">No templates yet.</p></div>:<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{templates.map((t)=><article key={t.id} className="flex min-h-[250px] flex-col rounded-3xl border border-[#dfe6db] bg-white p-5 shadow-sm"><span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8aa080]">Template</span><h3 className="mt-3 text-lg font-bold">{t.name}</h3><p className="mt-2 text-sm font-semibold text-[#53664e]">{t.subject}</p><p className="mt-3 line-clamp-4 whitespace-pre-line text-xs leading-5 text-[#7b887d]">{t.body}</p><div className="mt-auto flex gap-2 pt-5"><button onClick={()=>useTemplate(t)} className="flex-1 rounded-xl bg-[#647d5b] px-3 py-2.5 text-xs font-semibold text-white">Use Template</button><button disabled={pending} onClick={()=>removeTemplate(t.id)} className="rounded-xl border px-3 py-2.5 text-xs font-semibold text-[#8a655f]">Delete</button></div></article>)}</div>}</div>}
        {tab==="sent"&&<div><div className="mb-6"><h2 className="text-2xl font-bold">Sent History</h2><p className="mt-1 text-sm text-[#708075]">Emails actually sent from JGO OS.</p></div>{sent.length===0?<div className="rounded-3xl border border-dashed bg-white/60 p-12 text-center"><p className="font-semibold">No emails sent yet.</p></div>:<div className="overflow-hidden rounded-3xl border bg-white shadow-sm">{sent.map((e)=><div key={e.id} className="grid gap-3 border-b p-5 last:border-0 md:grid-cols-[220px_1fr_180px]"><div><strong className="block text-sm">{e.recipient_name||e.recipient_email}</strong><span className="text-xs text-[#7b887d]">{e.recipient_email}</span></div><div><strong className="block text-sm">{e.subject}</strong><p className="mt-1 line-clamp-2 whitespace-pre-line text-xs leading-5 text-[#7b887d]">{e.body}</p></div><span className="text-xs text-[#8b948c] md:text-right">{new Date(e.sent_at).toLocaleString()}</span></div>)}</div>}</div>}
      </div>
    </section>
  );
}
