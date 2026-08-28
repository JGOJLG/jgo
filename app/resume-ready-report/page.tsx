"use client";

import { useMemo, useState } from "react";

declare global { interface Window { jspdf?: any } }

type Change = { title: string; body: string };
type ReportData = {
  client: string;
  overallFeedback: string;
  changes: Change[];
  recruiterPerspective: string;
  futureUpdates: string[];
  finalRecommendation: string;
};

const emptyReport: ReportData = {
  client: "",
  overallFeedback: "",
  changes: [],
  recruiterPerspective: "",
  futureUpdates: [],
  finalRecommendation: "",
};

const STANDARD_RECOMMENDATIONS = [
  (client: string) => `Save as “${client || "First Last"} Resume.pdf” and submit the PDF unless Word is specifically requested.`,
  () => "Add your updated LinkedIn URL to the resume.",
  () => "Make sure LinkedIn matches the new resume. More at jgohire.com/guide.",
  () => "Tailor your summary and keywords to each role before applying.",
  () => "Use a tailored cover letter when it adds context or strengthens your story.",
  () => "Review the final PDF for spacing, links, and page breaks before submitting.",
  () => "Prepare interview examples tied to the strongest experience highlighted in the resume.",
  () => "Apply early and reach out directly to the recruiter or hiring manager when possible.",
];

const DEFAULT_FUTURE_UPDATES = [
  "Keep adding measurable results as your work evolves.",
  "Track changes in team size, budget, scope, customers, markets, or programs supported.",
  "Add promotions, expanded responsibilities, major launches, certifications, or recognition.",
  "Keep the top of the resume aligned to the specific role you are targeting.",
];

const CHATGPT_PROMPT = `I am creating a JGO Hire Resume Ready Report for a client. I will give you TWO resumes below: the ORIGINAL resume and the NEW revised resume.

Act as an experienced recruiter and career coach reviewing the actual differences between the two resumes. Compare them carefully and write a client-facing report explaining what was improved and why the new version is stronger.

IMPORTANT WRITING RULES:
- Sound like a real recruiter/career coach speaking to a client, not AI.
- Use natural, straightforward language. Do not use overly polished corporate filler.
- Do not invent anything that is not supported by the resumes.
- Be specific about the actual changes you see between the original and revised resume.
- Focus on what changed, why it matters to a recruiter, and how the revised resume improves the candidate's positioning.
- Do not overpraise. If something could still be improved, say so constructively.
- Do not use em dashes.
- This MUST fit comfortably into a polished 2-page client report. Be selective. Do not repeat the same point in multiple sections.
- WHAT I CHANGED is the most important section, but it must be easy to scan. Give 5 meaningful changes. Use a 6th only when it adds a truly different point.
- Keep EACH What I Changed explanation to about 45 to 65 words maximum. Use 2 to 3 sentences. Do not write long paragraphs.
- For each change, briefly cover: what was different before, what changed, and why it matters to a recruiter.
- Preserve important metrics, numbers, scope, leadership details, or achievements exactly when they appear in the resumes.
- If the revised resume removed something valuable from the original, call it out in one of the changes or future suggestions.
- Overall Feedback should be ONE concise paragraph of about 90 to 120 words.
- Recruiter's Perspective should be ONE concise paragraph of about 90 to 120 words.
- Future Resume Updates should be exactly 4 short bullets, each no more than about 25 words.
- Final Recommendation should be about 50 to 75 words.
- DO NOT include JGO Hire Recommendations or a JGO Hire Pro Tip. Those are automatically added by my report generator.

RETURN ONLY THE PLAIN TEXT FORMAT BELOW. Do not add markdown, code fences, commentary, or sections that are not listed.

JGO Hire Resume Ready Report
Client: [CLIENT NAME]

Overall Feedback
[ONE concise paragraph, about 90 to 120 words.]

What I Changed
1. [SHORT CHANGE TITLE]
- [45 to 65 words maximum. Explain what was different before, what changed, and why it matters.]

2. [SHORT CHANGE TITLE]
- [45 to 65 words maximum.]

3. [SHORT CHANGE TITLE]
- [45 to 65 words maximum.]

4. [SHORT CHANGE TITLE]
- [45 to 65 words maximum.]

5. [SHORT CHANGE TITLE]
- [45 to 65 words maximum.]

6. [ONLY if there is a truly different sixth change]
- [45 to 65 words maximum.]

Recruiter's Perspective
[ONE concise paragraph, about 90 to 120 words.]

Suggestions for Future Resume Updates
- [Short, specific suggestion. Maximum about 25 words.]
- [Short, specific suggestion. Maximum about 25 words.]
- [Short, specific suggestion. Maximum about 25 words.]
- [Short, specific suggestion. Maximum about 25 words.]

Final Recommendation: [About 50 to 75 words. Include any remaining change you would still make before applying. If ready, say so clearly.]

ORIGINAL RESUME:
[PASTE ORIGINAL RESUME HERE]

NEW REVISED RESUME:
[PASTE NEW RESUME HERE]`;

function clean(v: string) {
  return v.replace(/^#{1,6}\s*/, "").replace(/^\*\*(.*?)\*\*$/, "$1").replace(/\*\*/g, "").replace(/^__|__$/g, "").replace(/\u00a0/g, " ").trim();
}
function cleanBullet(v: string) { return clean(v).replace(/^[•●▪◦\-*]\s*/, "").trim(); }
function normalize(raw: string) { return raw.replace(/\r/g, "").replace(/[’]/g, "'").replace(/\t/g, " "); }
function key(v: string) { return clean(v).replace(/:$/, "").replace(/\s+/g, " ").toUpperCase(); }
function splitLines(v: string) { return v.split(/\n+/).map(cleanBullet).filter(Boolean); }
function isBullet(v: string) { return /^[•●▪◦\-*]\s*/.test(v.trim()); }
function fileBaseName(name: string) {
  const x = name.replace(/[^a-zA-Z0-9 .'-]/g, "").replace(/\s+/g, " ").trim();
  return `${x || "JGO Hire"} Resume Ready Report`;
}
function section(lines: string[], starts: string[], ends: string[]) {
  const start = lines.findIndex(l => starts.includes(key(l)));
  if (start < 0) return [];
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const k = key(lines[i]);
    if (ends.includes(k) || /^FINAL RECOMMENDATION\s*:/i.test(clean(lines[i]))) { end = i; break; }
  }
  return lines.slice(start + 1, end);
}
function paragraphs(lines: string[]) {
  const out: string[] = [];
  let buf: string[] = [];
  const flush = () => { if (buf.length) { out.push(buf.join(" ").replace(/\s+/g, " ").trim()); buf = []; } };
  for (const raw of lines) {
    const l = clean(raw);
    if (!l) { flush(); continue; }
    if (isBullet(raw)) { flush(); out.push(cleanBullet(raw)); continue; }
    buf.push(l);
  }
  flush();
  return out.join("\n\n");
}
function parseChangeBlock(lines: string[]) {
  const out: Change[] = [];
  let title = "";
  let body: string[] = [];
  const flush = () => {
    const text = body.map(cleanBullet).filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    if (title && text) out.push({ title: title.replace(/^\d+[.)]\s*/, "").trim(), body: text });
    title = ""; body = [];
  };

  // ChatGPT usually returns each numbered change on its own line, but copying from
  // rich text can occasionally collapse 1-5 into a single paragraph. Reinsert a
  // line break before numbered change markers so every item remains its own block.
  const expandedLines = lines
    .join("\n")
    .replace(/([^\n])\s+(?=[1-6][.)]\s+[A-Z])/g, "$1\n")
    .split("\n")
    .flatMap(raw => {
      const l = clean(raw);
      const numbered = l.match(/^(\d+[.)]\s+)(.+)$/);
      if (!numbered) return [raw];

      // Also support pasted output like: "1. Title - explanation" on one line.
      const inline = numbered[2].match(/^(.{1,100}?)\s+-\s+(.+)$/);
      if (!inline) return [raw];
      return [`${numbered[1]}${inline[1]}`, `- ${inline[2]}`];
    });

  for (const raw of expandedLines) {
    const l = clean(raw);
    if (!l) continue;
    if (/^\d+[.)]\s+/.test(l)) { flush(); title = l; continue; }
    if (isBullet(raw)) { body.push(raw); continue; }
    if (!title) { title = l; continue; }
    body.push(raw);
  }
  flush();
  return out;
}
function parseFuture(lines: string[]) {
  const out: string[] = [];
  let current = "";
  for (const raw of lines) {
    const l = clean(raw);
    if (!l) continue;
    if (isBullet(raw)) {
      if (current) out.push(current.trim());
      current = cleanBullet(raw);
    } else if (current) current += ` ${l}`;
    else current = l;
  }
  if (current) out.push(current.trim());
  return out.filter(Boolean);
}
function detectClient(lines: string[]) {
  const cleaned = lines.map(clean).filter(Boolean);
  const explicit = cleaned.find(l => /^CLIENT\s*:/i.test(l) || /^PREPARED FOR\s+/i.test(l));
  if (explicit) return explicit.replace(/^CLIENT\s*:/i, "").replace(/^PREPARED FOR\s+/i, "").trim();
  return "";
}
function parseReport(raw: string): ReportData {
  const lines = normalize(raw).split("\n");
  const out: ReportData = { ...emptyReport, changes: [], futureUpdates: [] };
  out.client = detectClient(lines);

  const overall = section(lines,
    ["OVERALL FEEDBACK", "OVERALL ASSESSMENT"],
    ["WHAT I CHANGED", "WHAT CHANGED", "KEY IMPROVEMENTS", "RECRUITER'S PERSPECTIVE", "RECRUITER PERSPECTIVE", "SUGGESTIONS FOR FUTURE RESUME UPDATES"]
  );
  if (overall.length) out.overallFeedback = paragraphs(overall);

  const changes = section(lines,
    ["WHAT I CHANGED", "WHAT CHANGED", "KEY IMPROVEMENTS"],
    ["RECRUITER'S PERSPECTIVE", "RECRUITER PERSPECTIVE", "RECRUITERS PERSPECTIVE", "SUGGESTIONS FOR FUTURE RESUME UPDATES", "FINAL RECOMMENDATION"]
  );
  out.changes = parseChangeBlock(changes);

  const perspective = section(lines,
    ["RECRUITER'S PERSPECTIVE", "RECRUITER PERSPECTIVE", "RECRUITERS PERSPECTIVE"],
    ["SUGGESTIONS FOR FUTURE RESUME UPDATES", "FINAL RECOMMENDATION"]
  );
  if (perspective.length) out.recruiterPerspective = paragraphs(perspective);

  const future = section(lines,
    ["SUGGESTIONS FOR FUTURE RESUME UPDATES"],
    ["FINAL RECOMMENDATION"]
  );
  if (future.length) out.futureUpdates = parseFuture(future);

  const finalIndex = lines.findIndex(l => /^FINAL RECOMMENDATION\s*:/i.test(clean(l)) || key(l) === "FINAL RECOMMENDATION");
  if (finalIndex >= 0) {
    const first = clean(lines[finalIndex]).replace(/^FINAL RECOMMENDATION\s*:\s*/i, "").replace(/^FINAL RECOMMENDATION$/i, "").trim();
    const tail = lines.slice(finalIndex + 1).map(clean).filter(Boolean);
    out.finalRecommendation = [first, ...tail].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  }

  if (!out.futureUpdates.length) out.futureUpdates = DEFAULT_FUTURE_UPDATES;
  return out;
}

function Field({ label, value, onChange, rows = 5 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return <label className="block"><span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7b8779]">{label}</span><textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} className="w-full resize-y rounded-xl border border-[#e0e5dc] bg-white px-4 py-3 text-sm leading-6 text-[#343b33] outline-none transition focus:border-[#aab6a6] focus:ring-2 focus:ring-[#e7ece4]" /></label>;
}
function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <label className="block"><span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7b8779]">{label}</span><input value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-xl border border-[#e0e5dc] bg-white px-4 py-3 text-sm text-[#343b33] outline-none transition focus:border-[#aab6a6] focus:ring-2 focus:ring-[#e7ece4]" /></label>;
}
function loadScript(src: string, id: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === "true") return resolve();
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Could not load PDF tools.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.id = id; script.src = src; script.async = true;
    script.onload = () => { script.dataset.loaded = "true"; resolve(); };
    script.onerror = () => reject(new Error("Could not load PDF tools."));
    document.head.appendChild(script);
  });
}
async function imageData(url: string) {
  const blob = await fetch(url).then(r => { if (!r.ok) throw new Error("Logo not found"); return r.blob(); });
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob);
  });
}

async function makePdf(data: ReportData) {
  await loadScript("https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js", "jgo-report-jspdf");
  const jsPDF = window.jspdf?.jsPDF;
  if (!jsPDF) throw new Error("PDF generator did not load.");

  const d = new jsPDF({ unit: "pt", format: "letter" });
  const W = 612, M = 46, CW = W - M * 2;
  const ink: [number, number, number] = [38, 43, 37];
  const sage: [number, number, number] = [76, 96, 72];
  const muted: [number, number, number] = [105, 112, 102];
  const rule: [number, number, number] = [222, 227, 219];
  const soft: [number, number, number] = [247, 249, 245];

  const font = (s: number, b = false, c = ink) => { d.setFont("helvetica", b ? "bold" : "normal"); d.setFontSize(s); d.setTextColor(...c); };
  const wrap = (t: string, w: number, s = 8.6, b = false) => { font(s, b); return d.splitTextToSize(t || "", w) as string[]; };
  const drawText = (t: string, x: number, y: number, w: number, s = 8.6, b = false, c = ink, leading = 1.28) => {
    const paras = (t || "").split(/\n\n+/).filter(Boolean);
    let yy = y;
    paras.forEach((p, idx) => {
      const lines = wrap(p, w, s, b); font(s, b, c); d.text(lines, x, yy); yy += lines.length * s * leading;
      if (idx < paras.length - 1) yy += s * .45;
    });
    return yy;
  };
  const heading = (label: string, y: number) => {
    font(8.3, true, sage); d.text(label.toUpperCase(), M, y);
    d.setDrawColor(...rule); d.setLineWidth(.65); d.line(M, y + 6, W - M, y + 6);
    return y + 20;
  };
  const footer = (page: number) => {
    d.setDrawColor(...rule); d.line(M, 748, W - M, 748);
    font(6.8, false, muted); d.text("JGO HIRE", M, 765); d.text(`Resume Ready Report  |  ${page}`, W - M, 765, { align: "right" });
  };
  const continuationHeader = async () => {
    try { const logo = await imageData("/jgo-hire-logo.png"); d.addImage(logo, "PNG", M, 25, 56, 21); }
    catch { font(12.5, true); d.text("JGO Hire", M, 42); }
    font(6.8, true, muted); d.text("RESUME READY REPORT™", W - M, 33, { align: "right" });
    font(11.5, true, ink); d.text(data.client || "Client", W - M, 49, { align: "right" });
    d.setDrawColor(...rule); d.line(M, 64, W - M, 64);
  };

  try { const logo = await imageData("/jgo-hire-logo.png"); d.addImage(logo, "PNG", M, 24, 66, 25); }
  catch { font(14.5, true); d.text("JGO Hire", M, 45); }
  font(6.8, true, muted); d.text("RESUME READY REPORT™", W - M, 29, { align: "right" });
  font(19, true, ink); d.text(data.client || "Client", W - M, 50, { align: "right" });
  font(7.5, false, muted); d.text("Prepared by Jen Gordon | Certified Career Coach & Recruiter", W - M, 65, { align: "right" });
  d.setDrawColor(...rule); d.line(M, 78, W - M, 78);

  let y = 101;
  y = heading("Overall Feedback", y);
  y = drawText(data.overallFeedback, M, y, CW, 8.7, false, ink, 1.27) + 11;

  y = heading("What I Changed", y);
  data.changes.slice(0, 6).forEach((c, i) => {
    const titleLines = wrap(`${i + 1}. ${c.title}`, CW, 8.6, true);
    font(8.6, true, ink); d.text(titleLines, M, y);
    y += titleLines.length * 10.4 + 3;
    y = drawText(c.body, M + 14, y, CW - 14, 8.15, false, ink, 1.24) + 7;
    if (i < Math.min(data.changes.length, 6) - 1) {
      d.setDrawColor(235, 238, 232); d.line(M + 14, y - 2, W - M, y - 2); y += 5;
    }
  });

  y += 3;
  y = heading("Recruiter's Perspective", y);
  drawText(data.recruiterPerspective, M, y, CW, 8.55, false, ink, 1.27);
  footer(1);

  d.addPage();
  await continuationHeader();
  y = 88;

  y = heading("Suggestions for Future Resume Updates", y);
  data.futureUpdates.slice(0, 4).forEach(item => {
    d.setFillColor(...sage); d.circle(M + 2, y - 2.5, 1.25, "F");
    y = drawText(item, M + 13, y, CW - 13, 8.25, false, ink, 1.24) + 5;
  });
  y += 4;

  y = heading("Final Recommendation", y);
  const recLines = wrap(data.finalRecommendation, CW - 24, 8.45, true);
  const boxH = Math.max(48, recLines.length * 10.9 + 22);
  d.setFillColor(...soft); d.roundedRect(M, y - 6, CW, boxH, 6, 6, "F");
  font(8.45, true, ink); d.text(recLines, M + 12, y + 8); y += boxH + 10;

  y = heading("JGO Hire Recommendations", y);
  STANDARD_RECOMMENDATIONS.forEach(f => {
    d.setFillColor(...sage); d.circle(M + 2, y - 2.4, 1.2, "F");
    y = drawText(f(data.client), M + 13, y, CW - 13, 7.95, false, ink, 1.22) + 4;
  });
  y += 5;

  y = heading("JGO Hire Pro Tip", y);
  y = drawText("A great resume should answer three questions within the first 30 to 60 seconds:", M, y, CW, 8.2, false, ink, 1.24) + 6;
  ["Can you do the job?", "Why are you a strong fit for this position?", "Why should the employer interview you?"].forEach((q, i) => {
    font(8.2, true, ink); d.text(`${i + 1}. ${q}`, M + 7, y); y += 12;
  });
  y += 2;
  drawText("Your updated resume is designed to make those answers easier to see without making the reader search for them.", M, y, CW, 8.05, false, muted, 1.23);

  footer(2);
  d.save(`${fileBaseName(data.client)}.pdf`);
}

export default function ResumeReadyReportPage() {
  const [report, setReport] = useState<ReportData>(emptyReport);
  const [importText, setImportText] = useState("");
  const [status, setStatus] = useState("");
  const [promptCopied, setPromptCopied] = useState(false);

  const completion = useMemo(() => {
    const checks = [report.client, report.overallFeedback, report.changes.length, report.recruiterPerspective, report.futureUpdates.length, report.finalRecommendation];
    return Math.round(checks.filter(Boolean).length / checks.length * 100);
  }, [report]);

  const update = (k: keyof ReportData, v: any) => setReport(r => ({ ...r, [k]: v }));
  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(CHATGPT_PROMPT); setPromptCopied(true); window.setTimeout(() => setPromptCopied(false), 1800);
    } catch { setStatus("Could not copy automatically. Select the prompt text and copy it manually."); }
  };
  const doImport = () => {
    try {
      const parsed = parseReport(importText);
      const found = [parsed.client, parsed.overallFeedback, parsed.changes.length, parsed.recruiterPerspective, parsed.futureUpdates.length, parsed.finalRecommendation].filter(Boolean).length;
      setReport(parsed);
      setStatus(found >= 4 ? `Formatted successfully${parsed.client ? ` for ${parsed.client}` : ""}. ${found} personalized sections were filled.` : `I filled ${found} sections. Review the fields on the right and add anything missing.`);
    } catch (e: any) { setStatus(e?.message || "Could not format this report."); }
  };
  const download = async () => {
    try { setStatus("Building polished two-page JGO Hire report..."); await makePdf(report); setStatus("Report downloaded."); }
    catch (e: any) { setStatus(e?.message || "Could not create PDF."); }
  };

  return <main className="min-h-screen bg-[#f6f7f4] px-4 py-8 text-[#30372f] md:px-8 md:py-10">
    <div className="mx-auto max-w-[1320px]">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7e8a7b]">JGO Hire</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#2e352d]">Resume Ready Report</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#7a8378]">Use the JGO prompt with the original and revised resume, then paste ChatGPT's plain-text report back here. The generator is designed for a clean two-page client report.</p>
        </div>
        <div className="flex items-center gap-3 rounded-full border border-[#e1e5dd] bg-white px-4 py-2 shadow-sm">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#edf0eb]"><div className="h-full rounded-full bg-[#758a70]" style={{ width: `${completion}%` }} /></div>
          <span className="text-xs font-semibold text-[#596656]">{completion}% ready</span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <aside className="space-y-4">
          <section className="rounded-2xl border border-[#dce3d8] bg-[#eef3eb] p-5 shadow-[0_8px_30px_rgba(51,61,48,.04)]">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#71806d]">Step 1</p><h2 className="mt-1 text-base font-semibold">Get the ChatGPT Prompt</h2></div>
              <button type="button" onClick={copyPrompt} className="shrink-0 rounded-lg bg-[#4f614b] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#445441]">{promptCopied ? "Copied!" : "Copy Prompt"}</button>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#697465]">The prompt now controls section length so the report stays strong without turning What I Changed into long blocks of text.</p>
            <textarea readOnly value={CHATGPT_PROMPT} rows={12} onFocus={e => e.currentTarget.select()} className="mt-4 w-full resize-y rounded-xl border border-[#d8e0d4] bg-white px-4 py-3 text-xs leading-5 text-[#465044] outline-none" />
          </section>

          <section className="rounded-2xl border border-[#e1e5dd] bg-white p-5 shadow-[0_8px_30px_rgba(51,61,48,.04)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7b8779]">Step 2</p>
            <h2 className="mt-1 text-base font-semibold">Paste ChatGPT's Report</h2>
            <p className="mt-1 text-xs leading-5 text-[#7d867b]">Paste the plain-text response exactly as ChatGPT gives it to you. The OS will place each section into the correct field.</p>
            <textarea value={importText} onChange={e => setImportText(e.target.value)} rows={18} className="mt-4 w-full resize-y rounded-xl border border-[#e0e5dc] bg-[#fafbf9] px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#aab6a6] focus:ring-2 focus:ring-[#e7ece4]" placeholder="Paste ChatGPT report here..." />
            <button type="button" onClick={doImport} disabled={!importText.trim()} className="mt-3 w-full rounded-xl bg-[#4f614b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#445441] disabled:opacity-40">Format Report</button>
            {status && <p className="mt-3 rounded-lg bg-[#f3f6f1] px-3 py-2 text-xs leading-5 text-[#566452]">{status}</p>}
          </section>

          <section className="rounded-2xl border border-[#e1e5dd] bg-white p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#7b8779]">Two-Page Standard</p>
            <p className="mt-2 text-sm font-semibold">Strong, but easy to scan</p>
            <p className="mt-1 text-xs leading-5 text-[#7d867b]">Page 1 covers Overall Feedback, concise What I Changed points, and Recruiter's Perspective. Page 2 holds future updates, final recommendation, JGO recommendations, and the Pro Tip.</p>
          </section>
        </aside>

        <section className="rounded-2xl border border-[#e1e5dd] bg-white p-6 shadow-[0_8px_30px_rgba(51,61,48,.04)] md:p-7">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7b8779]">Step 3</p><h2 className="mt-1 text-base font-semibold">Review, Edit & Download</h2><p className="mt-1 text-xs text-[#7d867b]">Make any final edits before generating the client report.</p></div>
            <button type="button" onClick={download} disabled={!report.client} className="rounded-xl bg-[#4f614b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#445441] disabled:opacity-40">Download PDF</button>
          </div>

          <Input label="Client" value={report.client} onChange={v => update("client", v)} />
          <div className="mt-6"><Field label="Overall Feedback" value={report.overallFeedback} onChange={v => update("overallFeedback", v)} rows={6} /></div>

          <div className="mt-7 border-t border-[#edf0ea] pt-6">
            <div className="mb-4 flex items-center justify-between"><div><h3 className="text-sm font-semibold">What I Changed</h3><p className="mt-1 text-xs text-[#8a9287]">Aim for 5 strong changes with short explanations, not long paragraphs.</p></div><button type="button" onClick={() => update("changes", [...report.changes, { title: "", body: "" }])} className="text-xs font-semibold text-[#60705d]">+ Add Change</button></div>
            <div className="space-y-3">
              {report.changes.map((c, i) => <div key={i} className="rounded-xl bg-[#fafbf9] p-4">
                <Input label={`Change ${i + 1} Title`} value={c.title} onChange={v => { const n = [...report.changes]; n[i] = { ...n[i], title: v }; update("changes", n); }} />
                <div className="mt-3"><Field label="Explanation" value={c.body} onChange={v => { const n = [...report.changes]; n[i] = { ...n[i], body: v }; update("changes", n); }} rows={3} /></div>
              </div>)}
            </div>
          </div>

          <div className="mt-7 border-t border-[#edf0ea] pt-6"><Field label="Recruiter's Perspective" value={report.recruiterPerspective} onChange={v => update("recruiterPerspective", v)} rows={6} /></div>
          <div className="mt-7 border-t border-[#edf0ea] pt-6"><Field label="Suggestions for Future Resume Updates - one per line" value={report.futureUpdates.join("\n")} onChange={v => update("futureUpdates", splitLines(v))} rows={5} /></div>
          <div className="mt-7 border-t border-[#edf0ea] pt-6"><Field label="Final Recommendation" value={report.finalRecommendation} onChange={v => update("finalRecommendation", v)} rows={4} /></div>
        </section>
      </div>
    </div>
  </main>;
}
