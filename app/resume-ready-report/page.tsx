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
  (client: string) => `Save your resume as a PDF named \"${client || "First Last"} Resume.pdf.\" Unless an employer specifically requests a Word document, submit the PDF version to preserve formatting.`,
  () => "Add your LinkedIn profile URL to your resume after updating your profile.",
  () => "Update your LinkedIn profile so it matches your new resume, including your headline, About section, experience, and skills. Find more at jgohire.com/guide.",
  () => "Tailor your Professional Summary for each position by incorporating the most important keywords and priorities from the job description.",
  () => "Customize your resume when appropriate by adding relevant keywords from each posting to strengthen ATS alignment.",
  () => "Submit a tailored cover letter whenever possible. Use it to connect your background, motivation, and most relevant experience directly to the opportunity.",
  () => "Review the PDF before applying to make sure all formatting, spacing, links, and page breaks appear correctly.",
  () => "Prepare interview examples that reinforce the strongest accomplishments and leadership themes highlighted in your resume.",
  () => "Practice your career story so you can clearly explain where you have been, what you do best, and why this opportunity makes sense as your next step.",
  () => "Apply early and reach out directly. Whenever possible, apply within the first few days, identify the hiring manager or recruiter, and make a thoughtful connection on LinkedIn or by email.",
];

function clean(v: string) {
  return v.replace(/^#{1,6}\s*/, "").replace(/^\*\*(.*?)\*\*$/, "$1").replace(/\*\*/g, "").trim();
}
function cleanBullet(v: string) { return clean(v).replace(/^[•●▪◦\-*]\s*/, "").trim(); }
function splitLines(v: string) { return v.split(/\n+/).map(cleanBullet).filter(Boolean); }
function fileBaseName(name: string) {
  const cleaned = name.replace(/[^a-zA-Z0-9 .'-]/g, "").replace(/\s+/g, " ").trim();
  return `${cleaned || "JGO Hire"} Resume Ready Report`;
}
function normalizeTag(line: string) {
  const match = line.trim().match(/^\[\/?([A-Z0-9_ &-]+)\]$/i);
  return match ? match[1].toUpperCase().replace(/[ &-]+/g, "_") : null;
}
function getTaggedBlocks(raw: string) {
  const blocks: { tag: string; value: string }[] = [];
  let tag = "";
  let buffer: string[] = [];
  const flush = () => {
    if (tag) blocks.push({ tag, value: buffer.join("\n").trim() });
    buffer = [];
  };
  for (const line of raw.replace(/\r/g, "").split("\n")) {
    const nextTag = normalizeTag(line);
    if (nextTag) {
      if (nextTag === "JGO_REPORT") continue;
      flush();
      tag = nextTag;
    } else if (tag) {
      buffer.push(line);
    }
  }
  flush();
  return blocks;
}

function parseStructured(raw: string): ReportData | null {
  if (!/\[JGO_REPORT\]/i.test(raw) && !/\[OVERALL_FEEDBACK\]/i.test(raw)) return null;
  const out: ReportData = { ...emptyReport, changes: [], futureUpdates: [] };
  let currentChange: Partial<Change> | null = null;
  let legacyBefore = "";
  let legacyAfter = "";
  let legacyDifferenceNow = "";
  let legacyPositioning = "";
  let legacySelling: string[] = [];
  const pushChange = () => {
    if (currentChange && (currentChange.title || currentChange.body)) {
      out.changes.push({ title: currentChange.title || "Resume Improvement", body: currentChange.body || "" });
    }
    currentChange = null;
  };

  for (const block of getTaggedBlocks(raw)) {
    const value = block.value.trim();
    switch (block.tag) {
      case "CLIENT": out.client = value; break;
      case "OVERALL_FEEDBACK": out.overallFeedback = value; break;
      case "CHANGE": pushChange(); currentChange = {}; break;
      case "TITLE": if (currentChange) currentChange.title = value; break;
      case "BODY": if (currentChange) currentChange.body = value; break;
      case "RECRUITER_PERSPECTIVE": out.recruiterPerspective = value; break;
      case "FUTURE_UPDATES": out.futureUpdates = splitLines(value); break;
      case "FINAL_RECOMMENDATION": out.finalRecommendation = value; break;
      case "TRANSFORMATION_BEFORE": legacyBefore = value; break;
      case "TRANSFORMATION_AFTER": legacyAfter = value; break;
      case "BIGGEST_DIFFERENCE_NOW": legacyDifferenceNow = value; break;
      case "POSITIONING": legacyPositioning = value; break;
      case "SELLING_POINTS": legacySelling = splitLines(value); break;
    }
  }
  pushChange();

  if (!out.overallFeedback && (legacyBefore || legacyAfter)) {
    out.overallFeedback = [legacyBefore, legacyAfter].filter(Boolean).join("\n\n");
  }
  if (!out.recruiterPerspective) out.recruiterPerspective = legacyDifferenceNow;
  if (!out.futureUpdates.length) out.futureUpdates = legacySelling.slice(0, 6);
  if (!out.finalRecommendation) out.finalRecommendation = legacyPositioning;
  return out;
}

function parseLegacy(raw: string): ReportData {
  const out: ReportData = { ...emptyReport, changes: [], futureUpdates: [] };
  const lines = raw.replace(/\r/g, "").split("\n");
  let section = "";
  let subsection = "";
  let buffer: string[] = [];
  const flush = () => {
    const text = buffer.map(clean).filter(Boolean).join("\n").trim();
    if (!text) { buffer = []; return; }
    if (section === "OVERALL") out.overallFeedback = text;
    else if (section === "CHANGE" && subsection) out.changes.push({ title: subsection, body: text });
    else if (section === "PERSPECTIVE") out.recruiterPerspective = text;
    else if (section === "FUTURE") out.futureUpdates = splitLines(text);
    else if (section === "FINAL") out.finalRecommendation = text.replace(/^Final Recommendation:\s*/i, "").trim();
    buffer = [];
  };

  for (const rawLine of lines) {
    const line = clean(rawLine);
    if (!line) continue;
    const upper = line.toUpperCase().replace(/:$/, "");
    if (/^PREPARED FOR\s+/i.test(line)) { out.client = line.replace(/^PREPARED FOR\s+/i, "").trim(); continue; }
    if (/^CLIENT\s*:/i.test(line)) { out.client = line.replace(/^CLIENT\s*:/i, "").trim(); continue; }
    if (!out.client && !/JGO HIRE RESUME READY REPORT/i.test(line) && !/^Prepared by/i.test(line) && !["OVERALL FEEDBACK","WHAT I CHANGED","RECRUITER'S PERSPECTIVE","SUGGESTIONS FOR FUTURE RESUME UPDATES"].includes(upper)) {
      const next = lines[lines.indexOf(rawLine) - 1];
      if (next && /JGO HIRE RESUME READY REPORT/i.test(clean(next))) { out.client = line; continue; }
    }
    if (upper === "OVERALL FEEDBACK") { flush(); section = "OVERALL"; subsection = ""; continue; }
    if (upper === "WHAT I CHANGED") { flush(); section = "CHANGE"; subsection = ""; continue; }
    if (upper === "RECRUITER'S PERSPECTIVE" || upper === "RECRUITERS PERSPECTIVE") { flush(); section = "PERSPECTIVE"; subsection = ""; continue; }
    if (upper === "SUGGESTIONS FOR FUTURE RESUME UPDATES") { flush(); section = "FUTURE"; subsection = ""; continue; }
    if (/^FINAL RECOMMENDATION\s*:/i.test(line)) { flush(); section = "FINAL"; subsection = ""; buffer.push(line); continue; }
    if (section === "CHANGE" && !/^[•●▪◦\-*]/.test(rawLine.trim())) {
      flush();
      subsection = line;
      continue;
    }
    buffer.push(line);
  }
  flush();
  return out;
}

function parseImport(raw: string) { return parseStructured(raw) || parseLegacy(raw); }

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
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => { script.dataset.loaded = "true"; resolve(); };
    script.onerror = () => reject(new Error("Could not load PDF tools."));
    document.head.appendChild(script);
  });
}
async function imageData(url: string) {
  const blob = await fetch(url).then(r => { if (!r.ok) throw new Error("Logo not found"); return r.blob(); });
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function makePdf(data: ReportData) {
  await loadScript("https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js", "jgo-report-jspdf");
  const jsPDF = window.jspdf?.jsPDF;
  if (!jsPDF) throw new Error("PDF generator did not load.");

  const d = new jsPDF({ unit: "pt", format: "letter" });
  const W = 612, H = 792, M = 40, CW = W - M * 2, TOP = 48, BOTTOM = 742;
  const black: [number, number, number] = [22, 22, 22];
  const gray: [number, number, number] = [95, 95, 95];
  let y = TOP;

  const font = (size: number, bold = false, color = black) => {
    d.setFont("helvetica", bold ? "bold" : "normal");
    d.setFontSize(size);
    d.setTextColor(...color);
  };
  const wrap = (text: string, width: number, size = 9.1, bold = false) => {
    font(size, bold);
    return d.splitTextToSize(text, width) as string[];
  };
  const addPage = () => {
    d.addPage();
    y = TOP;
  };
  const ensure = (height: number) => {
    if (y + height > BOTTOM) addPage();
  };
  const paragraph = (text: string, size = 9.2, bold = false, gap = 11) => {
    if (!text.trim()) return;
    for (const para of text.split(/\n\s*\n/).map(p => p.replace(/\s+/g, " ").trim()).filter(Boolean)) {
      const lines = wrap(para, CW, size, bold);
      const height = lines.length * size * 1.34;
      ensure(height + gap);
      font(size, bold);
      d.text(lines, M, y);
      y += height + gap;
    }
  };
  const heading = (title: string) => {
    ensure(28);
    y += 4;
    font(11.2, true);
    d.text(title, M, y);
    y += 16;
  };
  const subheading = (title: string) => {
    ensure(22);
    font(9.3, true);
    d.text(title, M, y);
    y += 14;
  };
  const bullet = (text: string, size = 9) => {
    const lines = wrap(text.replace(/\s+/g, " ").trim(), CW - 38, size, false);
    const height = lines.length * size * 1.32 + 7;
    ensure(height);
    font(size, false);
    d.circle(M + 19, y - 3, 1.45, "F");
    d.text(lines, M + 34, y);
    y += height;
  };

  try {
    const logo = await imageData("/jgo-hire-logo.png");
    d.addImage(logo, "PNG", W - M - 78, 16, 74, 29);
  } catch {}
  font(15.5, true);
  d.text("JGO Hire Resume Ready Report", W / 2, 45, { align: "center" });
  font(7.5, true);
  d.text("TM", W / 2 + 107, 39);
  font(10.5, false);
  d.text(data.client || "Client Name", W / 2, 64, { align: "center" });
  font(8.5, false);
  d.text("Prepared by Jen Gordon | Certified Career Coach & Recruiter", W / 2, 80, { align: "center" });
  y = 103;

  heading("Overall Feedback");
  paragraph(data.overallFeedback);

  heading("What I Changed");
  data.changes.forEach(change => {
    subheading(change.title);
    bullet(change.body);
    y += 2;
  });

  heading("Recruiter's Perspective");
  paragraph(data.recruiterPerspective);

  heading("Suggestions for Future Resume Updates");
  paragraph("As your career continues to grow, keep track of measurable accomplishments that can strengthen future versions of your resume, including:", 9.2, false, 9);
  data.futureUpdates.forEach(item => bullet(item));

  ensure(48);
  font(9.2, true);
  d.text("Final Recommendation:", M, y);
  const recommendationLines = wrap(data.finalRecommendation, CW - 105, 9.2, false);
  font(9.2, false);
  d.text(recommendationLines, M + 105, y);
  y += Math.max(18, recommendationLines.length * 12.2) + 16;

  heading("JGO Hire Recommendations");
  paragraph("Before submitting your application, complete the following steps to maximize your chances of landing an interview:", 9.2, false, 9);
  STANDARD_RECOMMENDATIONS.forEach(makeText => bullet(makeText(data.client), 8.9));

  heading("JGO Hire Pro Tip");
  paragraph("A great resume should answer three questions within the first 30 to 60 seconds:", 9.2, false, 7);
  ["Can you do the job?", "Why are you a strong fit for this position?", "Why should the employer interview you?"].forEach((q, i) => {
    ensure(18);
    font(9.2, false);
    d.text(`${i + 1}. ${q}`, M + 13, y);
    y += 15;
  });
  y += 4;
  paragraph("Your updated resume was intentionally designed to answer those questions by making your most relevant experience, accomplishments, leadership, and value easier to see.", 9.2, false, 0);

  const pages = d.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    d.setPage(page);
    font(6.5, false, gray);
    d.text(`JGO HIRE | RESUME READY REPORT | ${page} OF ${pages}`, W / 2, H - 18, { align: "center" });
  }
  d.save(`${fileBaseName(data.client)}.pdf`);
}

export default function ResumeReadyReportPage() {
  const [report, setReport] = useState<ReportData>(emptyReport);
  const [importText, setImportText] = useState("");
  const [status, setStatus] = useState("");
  const completion = useMemo(() => {
    const checks = [report.client, report.overallFeedback, report.changes.length, report.recruiterPerspective, report.futureUpdates.length, report.finalRecommendation];
    return Math.round(checks.filter(Boolean).length / checks.length * 100);
  }, [report]);
  const update = (key: keyof ReportData, value: any) => setReport(r => ({ ...r, [key]: value }));
  const doImport = () => {
    const parsed = parseImport(importText);
    setReport(parsed);
    setStatus(parsed.client ? `Report ready for ${parsed.client}. Review below, then download.` : "Report parsed. Add the client name.");
  };
  const download = async () => {
    try {
      setStatus("Building JGO Hire Resume Ready Report...");
      await makePdf(report);
      setStatus("Report downloaded.");
    } catch (e: any) {
      setStatus(e?.message || "Could not create PDF.");
    }
  };

  return <main className="min-h-screen bg-[#f6f7f4] px-4 py-8 text-[#30372f] md:px-8 md:py-10">
    <div className="mx-auto max-w-[1320px]">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7e8a7b]">JGO Hire</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#2e352d]">Resume Ready Report</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#7a8378]">Personalized recruiter feedback first. Standard JGO Hire recommendations automatically added to every report.</p>
        </div>
        <div className="flex items-center gap-3 rounded-full border border-[#e1e5dd] bg-white px-4 py-2 shadow-sm">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#edf0eb]"><div className="h-full rounded-full bg-[#758a70]" style={{ width: `${completion}%` }} /></div>
          <span className="text-xs font-semibold text-[#596656]">{completion}% ready</span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
        <aside className="space-y-4">
          <section className="rounded-2xl border border-[#e1e5dd] bg-white p-5 shadow-[0_8px_30px_rgba(51,61,48,.04)]">
            <h2 className="text-base font-semibold">Quick Paste</h2>
            <p className="mt-1 text-xs leading-5 text-[#7d867b]">Paste the complete JGO report from ChatGPT. The builder separates each section automatically.</p>
            <textarea value={importText} onChange={e => setImportText(e.target.value)} rows={23} className="mt-4 w-full resize-y rounded-xl border border-[#e0e5dc] bg-[#fafbf9] px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#aab6a6] focus:ring-2 focus:ring-[#e7ece4]" placeholder="Paste report here..." />
            <button onClick={doImport} disabled={!importText.trim()} className="mt-3 w-full rounded-xl bg-[#4f614b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#445441] disabled:opacity-40">Format Report</button>
            {status && <p className="mt-3 text-xs leading-5 text-[#667163]">{status}</p>}
          </section>
          <section className="rounded-2xl border border-[#e1e5dd] bg-white p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#7b8779]">Always Included</p>
            <p className="mt-2 text-sm font-semibold">JGO Hire Recommendations + Pro Tip</p>
            <p className="mt-1 text-xs leading-5 text-[#7d867b]">These sections are standardized and automatically added to every client report.</p>
          </section>
        </aside>

        <section className="rounded-2xl border border-[#e1e5dd] bg-white p-6 shadow-[0_8px_30px_rgba(51,61,48,.04)] md:p-7">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold">Review & Edit</h2>
              <p className="mt-1 text-xs text-[#7d867b]">This is the personalized portion of the report.</p>
            </div>
            <button onClick={download} disabled={!report.client} className="rounded-xl bg-[#4f614b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#445441] disabled:opacity-40">Download PDF</button>
          </div>

          <Input label="Client" value={report.client} onChange={v => update("client", v)} />
          <div className="mt-6"><Field label="Overall Feedback" value={report.overallFeedback} onChange={v => update("overallFeedback", v)} rows={8} /></div>

          <div className="mt-7 border-t border-[#edf0ea] pt-6">
            <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-semibold">What I Changed</h3><button onClick={() => update("changes", [...report.changes, { title: "", body: "" }])} className="text-xs font-semibold text-[#60705d]">+ Add Change</button></div>
            <div className="space-y-3">
              {report.changes.map((change, i) => <div key={i} className="rounded-xl bg-[#fafbf9] p-4">
                <Input label={`Change ${i + 1} Title`} value={change.title} onChange={v => { const next = [...report.changes]; next[i] = { ...next[i], title: v }; update("changes", next); }} />
                <div className="mt-3"><Field label="Explanation" value={change.body} onChange={v => { const next = [...report.changes]; next[i] = { ...next[i], body: v }; update("changes", next); }} rows={4} /></div>
              </div>)}
            </div>
          </div>

          <div className="mt-7 border-t border-[#edf0ea] pt-6"><Field label="Recruiter's Perspective" value={report.recruiterPerspective} onChange={v => update("recruiterPerspective", v)} rows={7} /></div>
          <div className="mt-7 border-t border-[#edf0ea] pt-6"><Field label="Suggestions for Future Resume Updates - one per line" value={report.futureUpdates.join("\n")} onChange={v => update("futureUpdates", splitLines(v))} rows={8} /></div>
          <div className="mt-7 border-t border-[#edf0ea] pt-6"><Field label="Final Recommendation" value={report.finalRecommendation} onChange={v => update("finalRecommendation", v)} rows={5} /></div>
        </section>
      </div>
    </div>
  </main>;
}
