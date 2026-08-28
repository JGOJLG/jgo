"use client";

import { useMemo, useState } from "react";

declare global { interface Window { jspdf?: any } }

type ReportData = {
  candidate: string;
  targetRole: string;
  overallAssessment: string;
  keyImprovements: string[];
  positioningStrategy: string;
  competencies: string[];
  targetRoleAlignment: string;
  atsStrategy: string;
  keywordThemes: string[];
  recruiterPerspective: string;
  recommendations: string[];
  proTipClose: string;
};

const emptyReport: ReportData = {
  candidate: "",
  targetRole: "",
  overallAssessment: "",
  keyImprovements: [],
  positioningStrategy: "",
  competencies: [],
  targetRoleAlignment: "",
  atsStrategy: "",
  keywordThemes: [],
  recruiterPerspective: "",
  recommendations: [],
  proTipClose: "",
};

const SECTION_MAP: Record<string, keyof ReportData> = {
  "OVERALL ASSESSMENT": "overallAssessment",
  "KEY IMPROVEMENTS": "keyImprovements",
  "POSITIONING STRATEGY": "positioningStrategy",
  "TARGET ROLE ALIGNMENT": "targetRoleAlignment",
  "ATS & KEYWORD STRATEGY": "atsStrategy",
  "ATS AND KEYWORD STRATEGY": "atsStrategy",
  "RECRUITER PERSPECTIVE": "recruiterPerspective",
  "JGO HIRE RECOMMENDATIONS": "recommendations",
  "JGO HIRE PRO TIP": "proTipClose",
};

function cleanLine(v: string) {
  return v.replace(/^#{1,6}\s*/, "").replace(/^\*\*(.*?)\*\*$/, "$1").replace(/\*\*/g, "").trim();
}
function bulletLine(v: string) { return v.replace(/^[•●▪◦\-*]\s*/, "").trim(); }
function splitList(v: string) { return v.split(/\n|\s*[•|]\s*/).map(bulletLine).map(x => x.trim()).filter(Boolean); }
function fileBaseName(name: string) {
  const cleaned = name.replace(/[^a-zA-Z0-9 .'-]/g, "").replace(/\s+/g, " ").trim();
  return `${cleaned || "JGO Hire"} Resume Ready Report`;
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
    const s = document.createElement("script");
    s.id = id; s.src = src; s.async = true;
    s.onload = () => { s.dataset.loaded = "true"; resolve(); };
    s.onerror = () => reject(new Error("Could not load PDF tools."));
    document.head.appendChild(s);
  });
}

function parseImport(raw: string, current: ReportData): ReportData {
  const lines = raw.replace(/\r/g, "").split("\n").map(cleanLine);
  const next: ReportData = { ...current };
  let active: keyof ReportData | "competencies" | "keywordThemes" | null = null;
  const buffers: Partial<Record<keyof ReportData, string[]>> = {};

  for (const original of lines) {
    const line = original.trim();
    if (!line) continue;
    const upper = line.replace(/:$/, "").toUpperCase();
    if (SECTION_MAP[upper]) { active = SECTION_MAP[upper]; buffers[active] = []; continue; }
    if (/^CANDIDATE\s*:/i.test(line)) { next.candidate = line.replace(/^CANDIDATE\s*:/i, "").trim(); continue; }
    if (/^TARGET ROLE\s*:/i.test(line)) { next.targetRole = line.replace(/^TARGET ROLE\s*:/i, "").trim(); continue; }
    if (/^(PRIMARY )?COMPETENC(IES|Y)( EMPHASIZED)?\s*:/i.test(line)) {
      const value = line.replace(/^(PRIMARY )?COMPETENC(IES|Y)( EMPHASIZED)?\s*:/i, "").trim();
      next.competencies = splitList(value); active = "competencies"; continue;
    }
    if (/^KEYWORD THEMES( INCORPORATED)?\s*:/i.test(line)) {
      const value = line.replace(/^KEYWORD THEMES( INCORPORATED)?\s*:/i, "").trim();
      next.keywordThemes = splitList(value); active = "keywordThemes"; continue;
    }
    if (active === "competencies") { next.competencies.push(...splitList(line)); continue; }
    if (active === "keywordThemes") { next.keywordThemes.push(...splitList(line)); continue; }
    if (active) (buffers[active] ||= []).push(line);
  }

  const listKeys: (keyof ReportData)[] = ["keyImprovements", "recommendations"];
  for (const [k, values] of Object.entries(buffers) as [keyof ReportData, string[]][]) {
    if (listKeys.includes(k)) (next as any)[k] = values.map(bulletLine).filter(Boolean);
    else (next as any)[k] = values.join(" ").trim();
  }
  return next;
}

function Field({ label, value, onChange, placeholder = "", rows = 4 }: { label:string; value:string; onChange:(v:string)=>void; placeholder?:string; rows?:number }) {
  return <label className="block"><span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-[#71806f]">{label}</span><textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} className="w-full resize-y rounded-2xl border border-[#dce4d8] bg-white px-4 py-3 text-sm leading-6 text-[#364234] outline-none transition focus:border-[#aebda8] focus:ring-4 focus:ring-[#dfe8da]/60" /></label>;
}
function ListField({ label, values, onChange, placeholder }: { label:string; values:string[]; onChange:(v:string[])=>void; placeholder:string }) {
  return <Field label={label} value={values.join("\n")} onChange={v=>onChange(v.split("\n").map(bulletLine).filter(Boolean))} placeholder={placeholder} rows={6}/>;
}

async function imageData(url: string) {
  const blob = await fetch(url).then(r => { if (!r.ok) throw new Error("Logo not found"); return r.blob(); });
  return await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob); });
}

async function makePdf(data: ReportData) {
  await loadScript("https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js", "jgo-report-jspdf");
  const jsPDF = window.jspdf?.jsPDF;
  if (!jsPDF) throw new Error("PDF generator did not load.");
  const d = new jsPDF({ unit:"pt", format:"letter", orientation:"portrait" });
  const W=612,H=792,L=46,R=46,T=42,B=46,max=W-L-R;
  const sage=[78,99,72], charcoal=[45,52,44], light=[238,242,234], line=[216,224,211];
  let y=T;
  const pageFooter=()=>{ d.setDrawColor(...line); d.line(L,H-31,W-R,H-31); d.setFont("helvetica","normal"); d.setFontSize(7.5); d.setTextColor(112,126,111); d.text("JGO HIRE  |  RESUME READY REPORT",L,H-17); d.text(String(d.getNumberOfPages()),W-R,H-17,{align:"right"}); };
  const newPage=()=>{ pageFooter(); d.addPage(); y=T; };
  const ensure=(h:number)=>{ if(y+h>H-B) newPage(); };
  const body=(text:string,size=9.3,bold=false,indent=0)=>{ if(!text) return; d.setFont("helvetica",bold?"bold":"normal"); d.setFontSize(size); d.setTextColor(...charcoal); const ls=d.splitTextToSize(text,max-indent); ensure(ls.length*(size*1.38)+4); d.text(ls,L+indent,y); y+=ls.length*(size*1.38)+5; };
  const section=(name:string)=>{ ensure(25); y+=7; d.setFont("helvetica","bold"); d.setFontSize(11.2); d.setTextColor(...sage); d.text(name,L,y); y+=5; d.setDrawColor(...line); d.line(L,y,W-R,y); y+=11; };
  const bullet=(text:string)=>{ if(!text) return; d.setFont("helvetica","normal"); d.setFontSize(9.1); d.setTextColor(...charcoal); const ls=d.splitTextToSize(text,max-18); ensure(ls.length*12.4+4); d.text("•",L+2,y); d.text(ls,L+13,y); y+=ls.length*12.4+3; };

  try { const logo=await imageData("/jgo-hire-logo.png"); d.addImage(logo,"PNG",L,y,78,30,undefined,"FAST"); y+=38; } catch { d.setFont("times","italic"); d.setFontSize(20); d.setTextColor(25,25,25); d.text("JGO",L,y+17); d.setFont("helvetica","bold"); d.setFontSize(15); d.text("hire",L+41,y+17); y+=35; }
  d.setFont("helvetica","bold"); d.setFontSize(8.2); d.setTextColor(...sage); d.text("JGO HIRE",L,y); y+=16;
  d.setFont("helvetica","bold"); d.setFontSize(20); d.setTextColor(20,20,20); d.text("Resume Ready Report",L,y); y+=15;

  ensure(58); d.setFillColor(...light); d.roundedRect(L,y,max,54,8,8,"F");
  d.setFontSize(7.3); d.setFont("helvetica","bold"); d.setTextColor(...sage); d.text("CANDIDATE",L+12,y+14); d.text("TARGET ROLE",L+275,y+14);
  d.setFontSize(9.4); d.setFont("helvetica","normal"); d.setTextColor(...charcoal); d.text(data.candidate||"Candidate",L+12,y+29); d.text(d.splitTextToSize(data.targetRole||"Target Role",230),L+275,y+29); y+=65;

  section("OVERALL ASSESSMENT"); body(data.overallAssessment);
  section("KEY IMPROVEMENTS"); data.keyImprovements.forEach(bullet);
  section("POSITIONING STRATEGY"); body(data.positioningStrategy);
  if(data.competencies.length){ body("Primary competencies emphasized:",9.1,true); body(data.competencies.join("  •  "),8.8); }
  section("TARGET ROLE ALIGNMENT"); body(data.targetRoleAlignment);
  section("ATS & KEYWORD STRATEGY"); body(data.atsStrategy); if(data.keywordThemes.length){ body("Keyword themes incorporated:",9.1,true); body(data.keywordThemes.join("  |  "),8.8); }
  section("RECRUITER PERSPECTIVE"); body(data.recruiterPerspective);
  section("JGO HIRE RECOMMENDATIONS"); data.recommendations.forEach(bullet);
  section("JGO HIRE PRO TIP");
  const tip="A great resume should answer three questions quickly: 1. Can you do the job? 2. Why are you a strong fit for this position? 3. Why should the employer interview you?";
  ensure(84); d.setFillColor(246,247,244); d.setDrawColor(...sage); d.roundedRect(L,y,max,74,8,8,"FD"); d.setFont("helvetica","bold"); d.setFontSize(9.2); d.setTextColor(...charcoal); const tipLines=d.splitTextToSize(tip,max-24); d.text(tipLines,L+12,y+18); const closeLines=d.splitTextToSize(data.proTipClose||"Your updated resume was intentionally designed to answer those questions by highlighting the experience, skills, and impact most relevant to the opportunities you are pursuing.",max-24); d.setFont("helvetica","normal"); d.text(closeLines,L+12,y+18+tipLines.length*11.5+8); y+=82;
  pageFooter();
  d.save(`${fileBaseName(data.candidate)}.pdf`);
}

export default function ResumeReadyReportPage() {
  const [report,setReport]=useState<ReportData>(emptyReport);
  const [importText,setImportText]=useState("");
  const [status,setStatus]=useState("");
  const update=<K extends keyof ReportData>(key:K,value:ReportData[K])=>setReport(r=>({...r,[key]:value}));
  const completeness=useMemo(()=>{
    const checks=[report.candidate,report.targetRole,report.overallAssessment,report.keyImprovements.length,report.positioningStrategy,report.targetRoleAlignment,report.atsStrategy,report.recruiterPerspective,report.recommendations.length];
    return Math.round(checks.filter(Boolean).length/checks.length*100);
  },[report]);
  const importAnalysis=()=>{ setReport(r=>parseImport(importText,r)); setStatus("Analysis imported. Review each section, then download the PDF."); };
  const download=async()=>{ try{setStatus("Building branded PDF..."); await makePdf(report); setStatus("Resume Ready Report downloaded.");}catch(e:any){setStatus(e?.message||"Could not create PDF.");} };

  return <main className="min-h-screen bg-[#f8faf6] px-4 py-7 text-[#344132] md:px-8 md:py-9">
    <div className="mx-auto max-w-[1280px]">
      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#80907e]">JGO Hire</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-[#344132]">Resume Ready Report Builder</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#738071]">Paste the analysis from ChatGPT, review the sections, and download a polished JGO Hire branded Resume Ready Report.</p></div>
        <div className="rounded-2xl border border-[#dfe6dc] bg-white px-5 py-3 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#80907e]">Report readiness</p><div className="mt-2 flex items-center gap-3"><div className="h-2 w-36 overflow-hidden rounded-full bg-[#edf1e9]"><div className="h-full rounded-full bg-[#81987a]" style={{width:`${completeness}%`}} /></div><span className="text-sm font-bold text-[#53664f]">{completeness}%</span></div></div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <aside className="space-y-5">
          <section className="rounded-3xl border border-[#dde5d9] bg-white p-5 shadow-[0_12px_35px_rgba(65,83,59,.06)]">
            <h2 className="text-lg font-bold">1. Paste ChatGPT analysis</h2><p className="mt-1 text-xs leading-5 text-[#7a8778]">Use headings such as Overall Assessment, Key Improvements, Positioning Strategy, Target Role Alignment, ATS & Keyword Strategy, Recruiter Perspective, JGO Hire Recommendations, and JGO Hire Pro Tip.</p>
            <textarea value={importText} onChange={e=>setImportText(e.target.value)} rows={18} placeholder="Paste the completed JGO Resume Ready analysis here..." className="mt-4 w-full resize-y rounded-2xl border border-[#dce4d8] bg-[#fbfcfa] px-4 py-3 text-sm leading-6 outline-none focus:border-[#aebda8] focus:ring-4 focus:ring-[#dfe8da]/60" />
            <button type="button" onClick={importAnalysis} className="mt-3 w-full rounded-xl bg-[#4f6549] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#43583e]">Import & Auto-Format</button>
          </section>
          <section className="rounded-3xl border border-[#dde5d9] bg-[#eef3eb] p-5"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#60725c]">Workflow</p><p className="mt-2 text-sm leading-6 text-[#586755]">Ask ChatGPT to compare the old resume, new resume, and target role. Paste the finished analysis here. JGO OS separates it into the report sections and creates the branded PDF.</p></section>
        </aside>

        <section className="rounded-3xl border border-[#dde5d9] bg-white p-5 shadow-[0_12px_35px_rgba(65,83,59,.06)] md:p-7">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block"><span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-[#71806f]">Candidate</span><input value={report.candidate} onChange={e=>update("candidate",e.target.value)} placeholder="Candidate name" className="w-full rounded-xl border border-[#dce4d8] px-4 py-3 text-sm outline-none focus:border-[#aebda8] focus:ring-4 focus:ring-[#dfe8da]/60" /></label>
            <label className="block"><span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-[#71806f]">Target Role</span><input value={report.targetRole} onChange={e=>update("targetRole",e.target.value)} placeholder="Target role or role family" className="w-full rounded-xl border border-[#dce4d8] px-4 py-3 text-sm outline-none focus:border-[#aebda8] focus:ring-4 focus:ring-[#dfe8da]/60" /></label>
          </div>
          <div className="mt-6 space-y-6">
            <Field label="Overall Assessment" value={report.overallAssessment} onChange={v=>update("overallAssessment",v)} rows={6}/>
            <ListField label="Key Improvements" values={report.keyImprovements} onChange={v=>update("keyImprovements",v)} placeholder="One improvement per line"/>
            <Field label="Positioning Strategy" value={report.positioningStrategy} onChange={v=>update("positioningStrategy",v)} rows={5}/>
            <ListField label="Primary Competencies" values={report.competencies} onChange={v=>update("competencies",v)} placeholder="One competency per line"/>
            <Field label="Target Role Alignment" value={report.targetRoleAlignment} onChange={v=>update("targetRoleAlignment",v)} rows={5}/>
            <Field label="ATS & Keyword Strategy" value={report.atsStrategy} onChange={v=>update("atsStrategy",v)} rows={5}/>
            <ListField label="Keyword Themes" values={report.keywordThemes} onChange={v=>update("keywordThemes",v)} placeholder="One keyword theme per line"/>
            <Field label="Recruiter Perspective" value={report.recruiterPerspective} onChange={v=>update("recruiterPerspective",v)} rows={5}/>
            <ListField label="JGO Hire Recommendations" values={report.recommendations} onChange={v=>update("recommendations",v)} placeholder="One recommendation per line"/>
            <Field label="JGO Hire Pro Tip Closing" value={report.proTipClose} onChange={v=>update("proTipClose",v)} placeholder="1–2 candidate-specific closing sentences" rows={3}/>
          </div>
          <div className="mt-7 flex flex-col gap-3 border-t border-[#e7ece4] pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-[#788575]">{status || "Review the imported content before downloading."}</p><div className="flex gap-2"><button type="button" onClick={()=>{setReport(emptyReport);setImportText("");setStatus("")}} className="rounded-xl border border-[#d7e1d3] bg-white px-4 py-2.5 text-sm font-semibold text-[#5d6c59] hover:bg-[#f6f8f4]">Clear</button><button type="button" onClick={download} className="rounded-xl bg-[#4f6549] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#43583e]">Download Branded PDF</button></div></div>
        </section>
      </div>
    </div>
  </main>;
}
