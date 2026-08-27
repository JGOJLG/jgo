"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateEmailTemplate } from "../actions";

type Template = { id: number; name: string; subject: string; body: string };
const HTML_PREFIX = "__JGO_HTML__";

function bodyForEditor(value: string) {
  return value.startsWith(HTML_PREFIX) ? value.slice(HTML_PREFIX.length) : value;
}

function isHtmlTemplate(value: string) {
  return value.startsWith(HTML_PREFIX);
}

export default function TemplateManager({ initialTemplates }: { initialTemplates: Template[] }) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initialTemplates);
  const [selectedId, setSelectedId] = useState<number | null>(initialTemplates[0]?.id ?? null);
  const [name, setName] = useState(initialTemplates[0]?.name ?? "");
  const [subject, setSubject] = useState(initialTemplates[0]?.subject ?? "");
  const [body, setBody] = useState(initialTemplates[0] ? bodyForEditor(initialTemplates[0].body) : "");
  const [htmlMode, setHtmlMode] = useState(initialTemplates[0] ? isHtmlTemplate(initialTemplates[0].body) : false);
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();

  const selected = useMemo(() => templates.find((t) => t.id === selectedId) ?? null, [templates, selectedId]);

  function choose(template: Template) {
    setSelectedId(template.id);
    setName(template.name);
    setSubject(template.subject);
    setBody(bodyForEditor(template.body));
    setHtmlMode(isHtmlTemplate(template.body));
    setNotice("");
  }

  function save() {
    if (!selectedId) return;
    startTransition(async () => {
      const storedBody = htmlMode ? `${HTML_PREFIX}${body}` : body;
      const result = await updateEmailTemplate({ id: selectedId, name, subject, body: storedBody });
      if (!result.ok || !result.template) {
        setNotice(result.error || "Could not save template.");
        return;
      }
      const updated = result.template as Template;
      setTemplates((current) => current.map((t) => (t.id === selectedId ? updated : t)));
      setNotice("Saved");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="rounded-3xl border border-[#dfe6db] bg-white p-4 shadow-sm">
        <p className="px-2 pb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#7f9975]">Templates</p>
        <div className="space-y-2">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => choose(template)}
              className={`w-full rounded-2xl border p-4 text-left transition ${selectedId === template.id ? "border-[#9fb294] bg-[#edf3e9]" : "border-[#e3e8df] bg-[#fbfcf9] hover:bg-[#f6f8f4]"}`}
            >
              <strong className="block text-sm text-[#243128]">{template.name}</strong>
              <span className="mt-1 block truncate text-xs text-[#7b887d]">{template.subject}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="overflow-hidden rounded-3xl border border-[#dfe6db] bg-white shadow-sm">
        {!selected ? (
          <div className="p-10 text-center text-sm text-[#708075]">Choose a template to edit.</div>
        ) : (
          <>
            <div className="flex flex-col gap-3 border-b border-[#edf0ea] bg-[#fbfaf6] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#7f9975]">Edit Template</p>
                <h2 className="mt-1 text-xl font-bold text-[#243128]">{selected.name}</h2>
              </div>
              <div className="flex items-center gap-3">
                {notice && <span className="text-xs font-bold text-[#647d5b]">{notice}</span>}
                <button disabled={pending} onClick={save} className="rounded-xl bg-[#647d5b] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                  {pending ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[.1em] text-[#708075]">Template Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-2xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3 text-sm outline-none" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[.1em] text-[#708075]">Subject</label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-2xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3 text-sm outline-none" />
              </div>
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                  <label className="text-xs font-bold uppercase tracking-[.1em] text-[#708075]">Email Body</label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#647066]">
                    <input type="checkbox" checked={htmlMode} onChange={(e) => setHtmlMode(e.target.checked)} />
                    HTML / styled template
                  </label>
                </div>
                <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={18} className="w-full resize-y rounded-2xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3 font-mono text-sm leading-6 outline-none" />
                <p className="mt-2 text-xs leading-5 text-[#8b948c]">Keep <strong>{"{{first_name}}"}</strong> anywhere you want the recipient’s first name inserted. For styled templates, the saved HTML controls buttons and formatting.</p>
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[.1em] text-[#708075]">Preview</p>
                <div className="rounded-2xl border border-[#dfe6db] bg-[#f6f8f3] p-4">
                  {htmlMode ? (
                    <iframe title="Template preview" sandbox="allow-popups allow-popups-to-escape-sandbox" srcDoc={body.replaceAll("{{first_name}}", "First Name")} className="min-h-[420px] w-full rounded-xl border border-[#dfe6db] bg-white" />
                  ) : (
                    <div className="min-h-[220px] whitespace-pre-wrap rounded-xl bg-white p-5 text-sm leading-7 text-[#344239]">{body.replaceAll("{{first_name}}", "First Name")}</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
