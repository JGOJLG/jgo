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
  (client: string) => `Save your resume as a PDF named "${client || "First Last"} Resume.pdf." Unless an employer specifically requests a Word document, submit the PDF version to preserve formatting.`,
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

const DEFAULT_FUTURE_UPDATES = [
  "Keep adding measurable results such as revenue, savings, growth, efficiency, adoption, reach, or other business impact.",
  "Track the scale of your work, including team size, budget, customers, users, departments, markets, or programs supported.",
  "Capture examples of leadership, cross-functional influence, executive partnership, and ownership of high-priority initiatives.",
  "Add new promotions, expanded scope, major launches, awards, speaking engagements, certifications, or industry recognition as they happen.",
  "Refresh your summary and keywords as your target roles change so the resume stays aligned with the opportunities you want next.",
];

function clean(v: string) {
  return v
    .replace(/^#{1,6}\s*/, "")
    .replace(/^\*\*(.*?)\*\*$/, "$1")
    .replace(/\*\*/g, "")
    .replace(/^__|__$/g, "")
    .replace(/\u00a0/g, " ")
    .trim();
}
function cleanBullet(v: string) { return clean(v).replace(/^[•●▪◦\-*]\s*/, "").trim(); }
function normalize(raw: string) { return raw.replace(/\r/g, "").replace(/[’]/g, "'").replace(/\t/g, " "); }
function key(v: string) { return clean(v).replace(/:$/, "").replace(/\s+/g, " ").toUpperCase(); }
function splitLines(v: string) { return v.split(/\n+/).map(cleanBullet).filter(Boolean); }
function fileBaseName(name: string) {
  const x = name.replace(/[^a-zA-Z0-9 .'-]/g, "").replace(/\s+/g, " ").trim();
  return `${x || "JGO Hire"} Resume Ready Report`;
}
function isBullet(v: string) { return /^[•●▪◦\-*]\s*/.test(v.trim()); }
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
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const l = clean(raw);
    if (!l) continue;
    const numbered = /^\d+[.)]\s+/.test(l);
    if (numbered) { flush(); title = l; continue; }
    if (isBullet(raw)) { body.push(raw); continue; }
    if (!title) { title = l; continue; }
    if (body.length && l.length < 90 && !/[.!?]$/.test(l)) { flush(); title = l; continue; }
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
    if (/^As your (career|role)|^As you continue|^Keep track of measurable/i.test(l)) continue;
    if (isBullet(raw)) {
      if (current) out.push(current.trim());
      current = cleanBullet(raw);
    } else if (current) current += ` ${l}`;
    else current = l;
  }
  if (current) out.push(current.trim());
  return out.filter(Boolean);
}
function inlineValue(lines: string[], labels: string[]) {
  for (const raw of lines) {
    const l = clean(raw);
    for (const label of labels) {
      const re = new RegExp(`^${label.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\s*:\\s*(.+)$`, "i");
      const m = l.match(re);
      if (m) return m[1].trim();
    }
  }
  return "";
}
function detectClient(lines: string[]) {
  const cleaned = lines.map(clean).filter(Boolean);
  const explicit = cleaned.find(l => /^CLIENT\s*:/i.test(l) || /^PREPARED FOR\s+/i.test(l));
  if (explicit) return explicit.replace(/^CLIENT\s*:/i, "").replace(/^PREPARED FOR\s+/i, "").trim();
  const titleIdx = cleaned.findIndex(l => /JGO HIRE RESUME READY REPORT/i.test(l));
  if (titleIdx >= 0) {
    for (let i = titleIdx + 1; i < cleaned.length; i++) {
      const l = cleaned[i];
      if (/^Prepared by/i.test(l)) continue;
      if (["OVERALL FEEDBACK", "YOUR RESUME TRANSFORMATION", "WHAT I CHANGED", "WHAT CHANGED"].includes(key(l))) continue;
      if (l.length <= 80) return l;
    }
  }
  const firstHeading = cleaned.findIndex(l => ["OVERALL FEEDBACK", "YOUR RESUME TRANSFORMATION", "WHAT CHANGED", "WHAT I CHANGED"].includes(key(l)));
  if (firstHeading > 0) {
    for (let i = firstHeading - 1; i >= 0; i--) {
      const l = cleaned[i];
      if (/^Prepared by/i.test(l) || /JGO HIRE/i.test(l)) continue;
      if (l.length <= 80) return l;
    }
  }
  return "";
}

function parseTagged(raw: string): ReportData | null {
  if (!/\[(JGO_REPORT|CLIENT|OVERALL_FEEDBACK|TRANSFORMATION_BEFORE)\]/i.test(raw)) return null;
  const text = normalize(raw);
  const tag = (name: string) => {
    const m = text.match(new RegExp(`\\[${name}\\]([\\s\\S]*?)(?=\\n\\[[A-Z0-9_ &-]+\\]|$)`, "i"));
    return m ? m[1].trim() : "";
  };
  const out: ReportData = { ...emptyReport, changes: [], futureUpdates: [] };
  out.client = tag("CLIENT");
  out.overallFeedback = tag("OVERALL_FEEDBACK") || [tag("TRANSFORMATION_BEFORE"), tag("TRANSFORMATION_AFTER")].filter(Boolean).join("\n\n");
  out.recruiterPerspective = tag("RECRUITER_PERSPECTIVE") || tag("BIGGEST_DIFFERENCE_NOW");
  out.futureUpdates = splitLines(tag("FUTURE_UPDATES"));
  out.finalRecommendation = tag("FINAL_RECOMMENDATION") || tag("POSITIONING");
  const changeRe = /\[CHANGE\]([\s\S]*?)(?=\n\[CHANGE\]|\n\[[A-Z0-9_ &-]+\]|$)/gi;
  let m;
  while ((m = changeRe.exec(text))) {
    const tm = m[1].match(/\[TITLE\]([\s\S]*?)(?=\n\[BODY\]|$)/i);
    const bm = m[1].match(/\[BODY\]([\s\S]*)/i);
    if (tm || bm) out.changes.push({ title: tm ? tm[1].trim() : "Resume Improvement", body: bm ? bm[1].trim() : "" });
  }
  if (!out.futureUpdates.length) out.futureUpdates = DEFAULT_FUTURE_UPDATES;
  return out;
}

function parseReport(raw: string): ReportData {
  const text = normalize(raw);
  const lines = text.split("\n");
  const out: ReportData = { ...emptyReport, changes: [], futureUpdates: [] };
  out.client = detectClient(lines);

  const overall = section(lines, ["OVERALL FEEDBACK"], ["WHAT I CHANGED", "WHAT CHANGED", "RECRUITER'S PERSPECTIVE", "RECRUITERS PERSPECTIVE", "SUGGESTIONS FOR FUTURE RESUME UPDATES", "JGO HIRE RECOMMENDATIONS"]);
  if (overall.length) out.overallFeedback = paragraphs(overall);

  const transformation = section(lines, ["YOUR RESUME TRANSFORMATION", "RESUME TRANSFORMATION"], ["WHAT CHANGED", "WHAT I CHANGED", "TARGET ROLE ALIGNMENT", "YOUR STRONGEST SELLING POINTS"]);
  if (!out.overallFeedback && transformation.length) {
    const beforeIdx = transformation.findIndex(l => key(l) === "BEFORE");
    const afterIdx = transformation.findIndex(l => key(l) === "AFTER" || key(l) === "NOW");
    if (beforeIdx >= 0 || afterIdx >= 0) {
      const before = beforeIdx >= 0 ? paragraphs(transformation.slice(beforeIdx + 1, afterIdx >= 0 ? afterIdx : transformation.length)) : "";
      const after = afterIdx >= 0 ? paragraphs(transformation.slice(afterIdx + 1)) : "";
      out.overallFeedback = [before && `Before: ${before}`, after && `Now: ${after}`].filter(Boolean).join("\n\n");
    } else out.overallFeedback = paragraphs(transformation);
  }

  const changes = section(lines, ["WHAT I CHANGED", "WHAT CHANGED"], ["RECRUITER'S PERSPECTIVE", "RECRUITERS PERSPECTIVE", "TARGET ROLE ALIGNMENT", "YOUR STRONGEST SELLING POINTS", "THE BIGGEST DIFFERENCE", "SUGGESTIONS FOR FUTURE RESUME UPDATES", "JGO HIRE FINAL ASSESSMENT", "FINAL ASSESSMENT", "JGO HIRE RECOMMENDATIONS"]);
  out.changes = parseChangeBlock(changes);

  let perspective = section(lines, ["RECRUITER'S PERSPECTIVE", "RECRUITERS PERSPECTIVE"], ["SUGGESTIONS FOR FUTURE RESUME UPDATES", "JGO HIRE RECOMMENDATIONS", "JGO HIRE PRO TIP"]);
  if (perspective.length) out.recruiterPerspective = paragraphs(perspective);

  const biggest = section(lines, ["THE BIGGEST DIFFERENCE"], ["JGO HIRE FINAL ASSESSMENT", "FINAL ASSESSMENT", "SUGGESTIONS FOR FUTURE RESUME UPDATES", "JGO HIRE RECOMMENDATIONS"]);
  if (!out.recruiterPerspective && biggest.length) {
    const nowIdx = biggest.findIndex(l => /^(NOW|AFTER)\s*:/i.test(clean(l)) || ["NOW", "AFTER"].includes(key(l)));
    if (nowIdx >= 0) out.recruiterPerspective = paragraphs(biggest.slice(nowIdx));
    else out.recruiterPerspective = paragraphs(biggest);
  }

  const future = section(lines, ["SUGGESTIONS FOR FUTURE RESUME UPDATES"], ["JGO HIRE RECOMMENDATIONS", "JGO HIRE PRO TIP"]);
  let finalInFuture = future.findIndex(l => /^FINAL RECOMMENDATION\s*:/i.test(clean(l)));
  if (future.length) {
    out.futureUpdates = parseFuture(finalInFuture >= 0 ? future.slice(0, finalInFuture) : future);
    if (finalInFuture >= 0) {
      const first = clean(future[finalInFuture]).replace(/^FINAL RECOMMENDATION\s*:\s*/i, "");
      out.finalRecommendation = [first, ...future.slice(finalInFuture + 1).map(clean).filter(Boolean)].join(" ").replace(/\s+/g, " ").trim();
    }
  }

  if (!out.finalRecommendation) {
    const idx = lines.findIndex(l => /^FINAL RECOMMENDATION\s*:/i.test(clean(l)));
    if (idx >= 0) {
      const first = clean(lines[idx]).replace(/^FINAL RECOMMENDATION\s*:\s*/i, "");
      const tail: string[] = [];
      for (let i = idx + 1; i < lines.length; i++) {
        if (["JGO HIRE RECOMMENDATIONS", "JGO HIRE PRO TIP"].includes(key(lines[i]))) break;
        const l = clean(lines[i]); if (l) tail.push(l);
      }
      out.finalRecommendation = [first, ...tail].join(" ").replace(/\s+/g, " ").trim();
    }
  }

  const finalAssessment = section(lines, ["JGO HIRE FINAL ASSESSMENT", "FINAL ASSESSMENT"], ["JGO HIRE RECOMMENDATIONS", "JGO HIRE PRO TIP"]);
  const positioning = inlineValue(finalAssessment, ["Resume Positioning", "Positioning"]);
  const targetLevel = inlineValue(finalAssessment, ["Target Level"]);
  const alignment = inlineValue(finalAssessment, ["Primary Areas of Alignment", "Primary Alignment", "Best Fit"]);
  const differentiators = inlineValue(finalAssessment, ["Key Differentiators", "Differentiators"]);
  const status = inlineValue(finalAssessment, ["Resume Status", "Status"]);

  if (!out.recruiterPerspective && (positioning || targetLevel || alignment || differentiators)) {
    out.recruiterPerspective = [
      positioning && `Your resume is now positioned around ${positioning}.`,
      targetLevel && `The strongest target level is ${targetLevel}.`,
      alignment && `The clearest areas of alignment are ${alignment}.`,
      differentiators && `Your strongest differentiators are ${differentiators}.`,
    ].filter(Boolean).join(" ");
  }

  if (!out.finalRecommendation && finalAssessment.length) {
    const labeled = /^(Resume Positioning|Positioning|Target Level|Primary Areas of Alignment|Primary Alignment|Best Fit|Industry Strengths|Industries|Key Differentiators|Differentiators|Resume Status|Status)\s*:/i;
    const narrative = finalAssessment.map(clean).filter(l => l && !labeled.test(l) && !/^JGO Hire$/i.test(l) && !/^More than a resume/i.test(l));
    if (narrative.length) out.finalRecommendation = narrative.join(" ").replace(/\s+/g, " ").trim();
    else {
      out.finalRecommendation = [
        positioning && `Your resume is now positioned as ${positioning}.`,
        targetLevel && `It is aligned for ${targetLevel} opportunities.`,
        status && `Resume status: ${status}.`,
      ].filter(Boolean).join(" ");
    }
  }

  if (!out.futureUpdates.length) out.futureUpdates = DEFAULT_FUTURE_UPDATES;
  return out;
}

function parseImport(raw: string) {
  const tagged = parseTagged(raw);
  if (tagged) return tagged;
  return parseReport(raw);
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
    const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob);
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
  const font = (s: number, b = false, c = black) => { d.setFont("helvetica", b ? "bold" : "normal"); d.setFontSize(s); d.setTextColor(...c); };
  const wrap = (t: string, w: number, s = 9.1, b = false) => { font(s, b); return d.splitTextToSize(t, w) as string[]; };
  const addPage = () => { d.addPage(); y = TOP; };
  const ensure = (h: number) => { if (y + h > BOTTOM) addPage(); };
  const paragraph = (t: string, s = 9.2, b = false, gap = 11) => {
    if (!t.trim()) return;
    for (const p of t.split(/\n\s*\n/).map(x => x.replace(/\s+/g, " ").trim()).filter(Boolean)) {
      const lines = wrap(p, CW, s, b), h = lines.length * s * 1.34; ensure(h + gap); font(s, b); d.text(lines, M, y); y += h + gap;
    }
  };
  const heading = (t: string) => { ensure(28); y += 4; font(11.2, true); d.text(t, M, y); y += 16; };
  const subheading = (t: string) => { ensure(22); font(9.3, true); d.text(t, M, y); y += 14; };
  const bullet = (t: string, s = 9) => { const lines = wrap(t.replace(/\s+/g, " ").trim(), CW - 38, s), h = lines.length * s * 1.32 + 7; ensure(h); font(s); d.circle(M + 19, y - 3, 1.45, "F"); d.text(lines, M + 34, y); y += h; };
  try { const logo = await imageData("/jgo-hire-logo.png"); d.addImage(logo, "PNG", W - M - 78, 16, 74, 29); } catch {}
  font(15.5, true); d.text("JGO Hire Resume Ready Report", W / 2, 45, { align: "center" });
  font(7.5, true); d.text("TM", W / 2 + 107, 39);
  font(10.5); d.text(data.client || "Client Name", W / 2, 64, { align: "center" });
  font(8.5); d.text("Prepared by Jen Gordon | Certified Career Coach & Recruiter", W / 2, 80, { align: "center" });
  y = 103;
  heading("Overall Feedback"); paragraph(data.overallFeedback);
  heading("What I Changed"); data.changes.forEach(c => { subheading(c.title); bullet(c.body); y += 2; });
  heading("Recruiter's Perspective"); paragraph(data.recruiterPerspective);
  heading("Suggestions for Future Resume Updates"); paragraph("As your career continues to grow, keep track of measurable accomplishments that can strengthen future versions of your resume, including:", 9.2, false, 9); data.futureUpdates.forEach(i => bullet(i));
  ensure(48); font(9.2, true); d.text("Final Recommendation:", M, y); const rec = wrap(data.finalRecommendation, CW - 105, 9.2); font(9.2); d.text(rec, M + 105, y); y += Math.max(18, rec.length * 12.2) + 16;
  heading("JGO Hire Recommendations"); paragraph("Before submitting your application, complete the following steps to maximize your chances of landing an interview:", 9.2, false, 9); STANDARD_RECOMMENDATIONS.forEach(f => bullet(f(data.client), 8.9));
  heading("JGO Hire Pro Tip"); paragraph("A great resume should answer three questions within the first 30 to 60 seconds:", 9.2, false, 7);
  ["Can you do the job?", "Why are you a strong fit for this position?", "Why should the employer interview you?"].forEach((q, i) => { ensure(18); font(9.2); d.text(`${i + 1}. ${q}`, M + 13, y); y += 15; });
  y += 4; paragraph("Your updated resume was intentionally designed to answer those questions by making your most relevant experience, accomplishments, leadership, and value easier to see.", 9.2, false, 0);
  const pages = d.getNumberOfPages();
  for (let p = 1; p <= pages; p++) { d.setPage(p); font(6.5, false, gray); d.text(`JGO HIRE | RESUME READY REPORT | ${p} OF ${pages}`, W / 2, H - 18, { align: "center" }); }
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
  const update = (k: keyof ReportData, v: any) => setReport(r => ({ ...r, [k]: v }));
  const doImport = () => {
    try {
      const parsed = parseImport(importText);
      const found = [parsed.client, parsed.overallFeedback, parsed.changes.length, parsed.recruiterPerspective, parsed.futureUpdates.length, parsed.finalRecommendation].filter(Boolean).length;
      setReport(parsed);
      setStatus(found >= 4 ? `Formatted successfully${parsed.client ? ` for ${parsed.client}` : ""}. ${found} personalized sections were filled.` : `I filled ${found} sections. Review the fields on the right and add anything missing.`);
    } catch (e: any) { setStatus(e?.message || "Could not format this report."); }
  };
  const download = async () => {
    try { setStatus("Building JGO Hire Resume Ready Report..."); await makePdf(report); setStatus("Report downloaded."); }
    catch (e: any) { setStatus(e?.message || "Could not create PDF."); }
  };

  return <main className="min-h-screen bg-[#f6f7f4] px-4 py-8 text-[#30372f] md:px-8 md:py-10">
    <div className="mx-auto max-w-[1320px]">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7e8a7b]">JGO Hire</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#2e352d]">Resume Ready Report</h1><p className="mt-2 max-w-2xl text-sm text-[#7a8378]">Paste either the original JGO report format or the newer report format. Both are supported.</p></div>
        <div className="flex items-center gap-3 rounded-full border border-[#e1e5dd] bg-white px-4 py-2 shadow-sm"><div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#edf0eb]"><div className="h-full rounded-full bg-[#758a70]" style={{ width: `${completion}%` }} /></div><span className="text-xs font-semibold text-[#596656]">{completion}% ready</span></div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
        <aside className="space-y-4">
          <section className="rounded-2xl border border-[#e1e5dd] bg-white p-5 shadow-[0_8px_30px_rgba(51,61,48,.04)]"><h2 className="text-base font-semibold">Quick Paste</h2><p className="mt-1 text-xs leading-5 text-[#7d867b]">Paste the complete report from ChatGPT. Markdown, old JGO headings, new headings, wrapped bullets, and extra spacing are all supported.</p><textarea value={importText} onChange={e => setImportText(e.target.value)} rows={23} className="mt-4 w-full resize-y rounded-xl border border-[#e0e5dc] bg-[#fafbf9] px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#aab6a6] focus:ring-2 focus:ring-[#e7ece4]" placeholder="Paste report here..." /><button type="button" onClick={doImport} disabled={!importText.trim()} className="mt-3 w-full rounded-xl bg-[#4f614b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#445441] disabled:opacity-40">Format Report</button>{status && <p className="mt-3 rounded-lg bg-[#f3f6f1] px-3 py-2 text-xs leading-5 text-[#566452]">{status}</p>}</section>
          <section className="rounded-2xl border border-[#e1e5dd] bg-white p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#7b8779]">Always Included</p><p className="mt-2 text-sm font-semibold">JGO Hire Recommendations + Pro Tip</p><p className="mt-1 text-xs leading-5 text-[#7d867b]">These sections are standardized and automatically added to every client report.</p></section>
        </aside>
        <section className="rounded-2xl border border-[#e1e5dd] bg-white p-6 shadow-[0_8px_30px_rgba(51,61,48,.04)] md:p-7">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-base font-semibold">Review & Edit</h2><p className="mt-1 text-xs text-[#7d867b]">This is the personalized portion of the report.</p></div><button type="button" onClick={download} disabled={!report.client} className="rounded-xl bg-[#4f614b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#445441] disabled:opacity-40">Download PDF</button></div>
          <Input label="Client" value={report.client} onChange={v => update("client", v)} />
          <div className="mt-6"><Field label="Overall Feedback" value={report.overallFeedback} onChange={v => update("overallFeedback", v)} rows={8} /></div>
          <div className="mt-7 border-t border-[#edf0ea] pt-6"><div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-semibold">What I Changed</h3><button type="button" onClick={() => update("changes", [...report.changes, { title: "", body: "" }])} className="text-xs font-semibold text-[#60705d]">+ Add Change</button></div><div className="space-y-3">{report.changes.map((c, i) => <div key={i} className="rounded-xl bg-[#fafbf9] p-4"><Input label={`Change ${i + 1} Title`} value={c.title} onChange={v => { const n = [...report.changes]; n[i] = { ...n[i], title: v }; update("changes", n); }} /><div className="mt-3"><Field label="Explanation" value={c.body} onChange={v => { const n = [...report.changes]; n[i] = { ...n[i], body: v }; update("changes", n); }} rows={4} /></div></div>)}</div></div>
          <div className="mt-7 border-t border-[#edf0ea] pt-6"><Field label="Recruiter's Perspective" value={report.recruiterPerspective} onChange={v => update("recruiterPerspective", v)} rows={7} /></div>
          <div className="mt-7 border-t border-[#edf0ea] pt-6"><Field label="Suggestions for Future Resume Updates - one per line" value={report.futureUpdates.join("\n")} onChange={v => update("futureUpdates", splitLines(v))} rows={8} /></div>
          <div className="mt-7 border-t border-[#edf0ea] pt-6"><Field label="Final Recommendation" value={report.finalRecommendation} onChange={v => update("finalRecommendation", v)} rows={5} /></div>
        </section>
      </div>
    </div>
  </main>;
}
