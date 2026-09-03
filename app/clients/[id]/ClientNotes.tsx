"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type EmailMessage = {
  id: number;
  recipient_email: string;
  subject: string;
  body: string;
  body_html?: string | null;
  status: string;
  sent_at: string;
};

type Note = {
  id: number;
  note_date: string | null;
  content: string;
  created_at: string | null;
  action?: string | null;
  email_message_id?: number | null;
  email?: EmailMessage | null;
};

function inline(t: string) {
  const p = t.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return p.filter(Boolean).map((x, i) =>
    x.startsWith("**") && x.endsWith("**") ? (
      <strong key={i}>{x.slice(2, -2)}</strong>
    ) : x.startsWith("*") && x.endsWith("*") ? (
      <em key={i}>{x.slice(1, -1)}</em>
    ) : (
      <span key={i}>{x}</span>
    ),
  );
}

function Body({ content }: { content: string }) {
  return (
    <div className="space-y-1 text-sm leading-6 text-[#344239]">
      {content.split("\n").map((line, i) => {
        const t = line.trim();
        if (/^[-•]\s+/.test(t)) {
          return (
            <div key={i} className="flex gap-2 pl-2">
              <span>•</span>
              <span>{inline(t.replace(/^[-•]\s+/, ""))}</span>
            </div>
          );
        }
        if (/^\d+\.\s+/.test(t)) {
          return (
            <div key={i} className="flex gap-2 pl-2">
              <span>{t.match(/^\d+\./)?.[0]}</span>
              <span>{inline(t.replace(/^\d+\.\s+/, ""))}</span>
            </div>
          );
        }
        return t ? <p key={i}>{inline(line)}</p> : <div key={i} className="h-2" />;
      })}
    </div>
  );
}

function htmlToMarkdown(root: HTMLElement) {
  function walk(n: Node): string {
    if (n.nodeType === Node.TEXT_NODE) return n.textContent || "";
    if (!(n instanceof HTMLElement)) return "";
    const inner = Array.from(n.childNodes).map(walk).join("");
    const tag = n.tagName.toLowerCase();
    if (tag === "strong" || tag === "b") return `**${inner}**`;
    if (tag === "em" || tag === "i") return `*${inner}*`;
    if (tag === "br") return "\n";
    if (tag === "li") return `- ${inner.trim()}\n`;
    if (tag === "p" || tag === "div") return `${inner.trim()}\n`;
    return inner;
  }
  return Array.from(root.childNodes)
    .map(walk)
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function addedTime(value: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  }).format(d);
}

const ACTIONS = ["Note", "Email", "Phone Call", "Text", "Meeting", "Follow Up"];

export default function ClientNotes({ clientId, notes }: { clientId: number; notes: Note[] }) {
  const router = useRouter();
  const editor = useRef<HTMLDivElement>(null);
  const draftKey = `jgo-client-note-draft-${clientId}`;
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [action, setAction] = useState("Note");
  const [editing, setEditing] = useState<Note | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [preview, setPreview] = useState<Note | null>(null);

  const shown = useMemo(
    () =>
      notes.filter(
        (n) =>
          !query.trim() ||
          n.content.toLowerCase().includes(query.toLowerCase()) ||
          String(n.note_date || "").includes(query) ||
          String(n.action || "").toLowerCase().includes(query.toLowerCase()) ||
          String(n.email?.subject || "").toLowerCase().includes(query.toLowerCase()),
      ),
    [notes, query],
  );
  const visible = expanded ? shown : shown.slice(0, 5);

  function command(c: string) {
    editor.current?.focus();
    document.execCommand(c, false);
  }

  function preserveDraft() {
    if (editing || !editor.current) return;
    const content = htmlToMarkdown(editor.current);
    if (content.trim()) {
      window.localStorage.setItem(
        draftKey,
        JSON.stringify({ content, date, action, savedAt: new Date().toISOString() }),
      );
    } else {
      window.localStorage.removeItem(draftKey);
    }
  }

  function closeEditor() {
    preserveDraft();
    setOpen(false);
    setEditing(null);
    setAction("Note");
    setSaveError("");
    if (editor.current) editor.current.innerHTML = "";
  }

  function begin(note?: Note) {
    setPreview(null);
    setEditing(note || null);
    setSaveError("");

    let initialDate = note?.note_date || new Date().toISOString().slice(0, 10);
    let initialAction = note?.action || "Note";
    let initialContent = note?.content || "";

    if (!note) {
      try {
        const raw = window.localStorage.getItem(draftKey);
        if (raw) {
          const draft = JSON.parse(raw) as { content?: string; date?: string; action?: string };
          initialContent = draft.content || "";
          initialDate = draft.date || initialDate;
          initialAction = draft.action || initialAction;
        }
      } catch {
        // Ignore a malformed local draft and continue with a clean editor.
      }
    }

    setDate(initialDate);
    setAction(initialAction);
    setOpen(true);
    setTimeout(() => {
      if (editor.current) {
        editor.current.innerText = initialContent;
        editor.current.focus();
      }
    }, 0);
  }

  async function save() {
    const content = editor.current ? htmlToMarkdown(editor.current) : "";
    if (!content.trim()) {
      setSaveError("Add some note text before saving.");
      return;
    }

    setSaving(true);
    setSaveError("");

    const result = editing
      ? await supabase
          .from("client_notes")
          .update({ note_date: date, content, action })
          .eq("id", editing.id)
          .eq("client_id", clientId)
          .select("id")
          .single()
      : await supabase
          .from("client_notes")
          .insert({ client_id: clientId, note_date: date, content, action })
          .select("id")
          .single();

    setSaving(false);

    if (result.error || !result.data?.id) {
      console.error("Client note save failed", result.error);
      if (!editing) preserveDraft();
      setSaveError("This note was not confirmed as saved. Your draft is still preserved here. Please try again.");
      return;
    }

    if (!editing) window.localStorage.removeItem(draftKey);
    setOpen(false);
    setEditing(null);
    setAction("Note");
    setSaveError("");
    if (editor.current) editor.current.innerHTML = "";
    router.refresh();
  }

  async function remove(id: number) {
    if (!confirm("Are you sure you want to remove this note? It will be archived and can be recovered.")) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("client_notes")
      .update({ archived_at: new Date().toISOString(), archived_by: user?.id ?? null })
      .eq("id", id)
      .eq("client_id", clientId)
      .is("archived_at", null);
    if (error) {
      console.error("Client note archive failed", error);
      alert("The note could not be archived. Nothing was removed.");
      return;
    }
    setPreview(null);
    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-[#dfe6db] bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#243128]">Notes & Emails</h2>
          <p className="mt-1 text-sm text-[#708075]">Client activity, including every JGO OS email sent to this address.</p>
        </div>
        <button type="button" onClick={() => begin()} className="w-fit rounded-xl bg-[#647d5b] px-4 py-2.5 text-sm font-semibold text-white">+ Add Note</button>
      </div>

      {notes.length > 3 ? (
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setExpanded(false);
          }}
          placeholder="Search notes, emails or actions..."
          className="mt-4 w-full rounded-xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-2.5 text-sm outline-none"
        />
      ) : null}

      {open ? (
        <div className="mt-5 rounded-2xl border border-[#d7e1d0] bg-[#fbfcf9] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border bg-white px-3 py-2 text-sm" />
            <select value={action} onChange={(e) => setAction(e.target.value)} className="rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-[#4f6152]">
              {ACTIONS.map((x) => <option key={x}>{x}</option>)}
            </select>
            <button type="button" onClick={() => command("bold")} className="h-9 min-w-9 rounded-lg border bg-white px-3 font-bold">B</button>
            <button type="button" onClick={() => command("italic")} className="h-9 min-w-9 rounded-lg border bg-white px-3 italic">I</button>
            <button type="button" onClick={() => command("insertUnorderedList")} className="h-9 rounded-lg border bg-white px-3 text-sm font-semibold">• List</button>
          </div>
          <div
            ref={editor}
            contentEditable
            suppressContentEditableWarning
            onInput={preserveDraft}
            className="mt-3 min-h-[130px] max-h-[320px] overflow-y-auto rounded-xl border border-[#d7e1d0] bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-[#9fb294]"
          />
          <p className="mt-2 text-xs text-[#7b887e]">Unsaved new-note text is preserved in this browser while you type. The editor only closes after Supabase confirms the save.</p>
          {saveError ? <p className="mt-2 rounded-lg bg-[#fff2ef] px-3 py-2 text-xs font-semibold text-[#9a554d]">{saveError}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={save} disabled={saving} className="rounded-xl bg-[#647d5b] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving..." : editing ? "Save Changes" : "Save Note"}</button>
            <button type="button" onClick={closeEditor} className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-[#647066]">Close</button>
          </div>
        </div>
      ) : null}

      <div className="mt-5 space-y-2">
        {visible.length ? visible.map((n) => (
          <article key={n.id} onClick={() => setPreview(n)} className={`group cursor-pointer rounded-xl border p-3.5 transition hover:-translate-y-px hover:shadow-sm ${n.action === "Email" ? "border-[#cfdcc9] bg-[#f5f8f2]" : "border-[#e4e9df] bg-[#fbfcf9]"}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${n.action === "Email" ? "bg-[#dfead9] text-[#4d6547]" : "bg-[#edf0ea] text-[#687568]"}`}>{n.action || "Note"}</span>
                  <span className="text-xs font-semibold text-[#708075]">{n.note_date}{addedTime(n.created_at) ? ` · ${addedTime(n.created_at)}` : ""}</span>
                </div>
                <p className="mt-2 truncate text-sm font-semibold text-[#344239]">{n.email ? n.email.subject : n.content.replace(/\s+/g, " ")}</p>
              </div>
              <span className="shrink-0 text-xs font-bold text-[#647d5b] opacity-70 group-hover:opacity-100">Preview</span>
            </div>
          </article>
        )) : (
          <p className="rounded-xl border border-dashed p-5 text-sm text-[#708075]">{query ? "No activity matches your search." : "No notes or emails yet."}</p>
        )}
      </div>

      {shown.length > 5 ? (
        <div className="mt-4 flex justify-center">
          <button type="button" onClick={() => setExpanded((v) => !v)} className="rounded-full border border-[#d4ded0] bg-[#f8faf6] px-4 py-2 text-xs font-bold text-[#586d55]">{expanded ? "Show less" : `Expand · ${shown.length - 5} more`}</button>
        </div>
      ) : null}

      {preview ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1d281f]/55 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setPreview(null); }}>
          <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#e1e7dd] px-6 py-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${preview.action === "Email" ? "bg-[#dfead9] text-[#4d6547]" : "bg-[#edf0ea] text-[#687568]"}`}>{preview.action || "Note"}</span>
                  <span className="text-xs text-[#708075]">{preview.note_date}{addedTime(preview.created_at) ? ` · ${addedTime(preview.created_at)}` : ""}</span>
                </div>
                <h3 className="mt-2 text-xl font-bold text-[#243128]">{preview.email ? preview.email.subject : "Activity Preview"}</h3>
                {preview.email ? <p className="mt-1 text-xs text-[#708075]">To: {preview.email.recipient_email} · {new Date(preview.email.sent_at).toLocaleString()}</p> : null}
              </div>
              <button onClick={() => setPreview(null)} className="rounded-full border px-3 py-1.5 text-lg">×</button>
            </div>
            <div className="max-h-[72vh] overflow-y-auto bg-[#f4f6f1] p-4 sm:p-6">
              {preview.email ? (
                preview.email.body_html ? (
                  <iframe title={`Email preview: ${preview.email.subject}`} sandbox="allow-popups allow-popups-to-escape-sandbox" srcDoc={preview.email.body_html} className="min-h-[620px] w-full rounded-2xl border border-[#dce3d8] bg-white shadow-sm" />
                ) : (
                  <div>
                    <div className="mb-3 rounded-xl border border-[#e2d8b7] bg-[#fff9e8] px-4 py-3 text-xs text-[#766537]">This email was sent before exact HTML previews were enabled, so only its saved text version is available.</div>
                    <div className="whitespace-pre-wrap rounded-2xl border border-[#e1e7dd] bg-white p-5 text-sm leading-7 text-[#344239]">{preview.email.body}</div>
                  </div>
                )
              ) : (
                <div className="rounded-2xl border border-[#e1e7dd] bg-white p-5"><Body content={preview.content} /></div>
              )}
            </div>
            {!preview.email ? (
              <div className="flex justify-end gap-2 border-t border-[#e1e7dd] px-6 py-4">
                <button type="button" onClick={() => begin(preview)} className="rounded-xl bg-[#647d5b] px-4 py-2 text-sm font-semibold text-white">Edit Note</button>
                <button type="button" onClick={() => remove(preview.id)} className="rounded-xl border border-[#ead3cf] bg-white px-4 py-2 text-sm font-semibold text-[#9a554d]">Archive Note</button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
