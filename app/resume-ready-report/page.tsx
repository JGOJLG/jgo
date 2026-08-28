"use client";

import { useMemo, useState } from "react";

declare global { interface Window { jspdf?: any } }

type Change = { title: string; body: string };
type TargetRole = { company: string; role: string; alignment: string };
type ReportData = {
  client: string;
  transformationBefore: string;
  transformationAfter: string;
  changes: Change[];
  targetRoles: TargetRole[];
  sellingPoints: string[];
  biggestDifferenceBefore: string;
  biggestDifferenceNow: string;
  positioning: string;
  targetLevel: string;
  primaryAlignment: string;
  industries: string;
  differentiators: string;
  status: string;
};

const emptyReport: ReportData = {
  client: "",
  transformationBefore: "",
  transformationAfter: "",
  changes: [],
  targetRoles: [],
  sellingPoints: [],
  biggestDifferenceBefore: "",
  biggestDifferenceNow: "",
  positioning: "",
  targetLevel: "",
  primaryAlignment: "",
  industries: "",
  differentiators: "",
  status: "READY",
};

function clean(v: string) {
  return v
    .replace(/^#{1,6}\s*/, "")
    .replace(/^\*\*(.*?)\*\*$/, "$1")
    .replace(/\*\*/g, "")
    .trim();
}
function cleanBullet(v: string) { return clean(v).replace(/^[•●▪◦\-*]\s*/, "").trim(); }
function splitLines(v: string) { return v.split(/\n+/).map(cleanBullet).filter(Boolean); }
function fileBaseName(name: string) {
  const cleaned = name.replace(/[^a-zA-Z0-9 .'-]/g, "").replace(/\s+/g, " ").trim();
  return `${cleaned || "JGO Hire"} Resume Ready Report`;
}
function normalizeTag(line: string) {
  const m = line.trim().match(/^\[\/?([A-Z0-9_ &-]+)\]$/i);
  return m ? m[1].toUpperCase().replace(/[ &-]+/g, "_") : null;
}
function getTaggedBlocks(raw: string) {
  const lines = raw.replace(/\r/g, "").split("\n");
  const blocks: { tag: string; value: string }[] = [];
  let tag = "";
  let buffer: string[] = [];
  const flush = () => {
    if (tag) blocks.push({ tag, value: buffer.join("\n").trim() });
    buffer = [];
  };
  for (const line of lines) {
    const nextTag = normalizeTag(line);
    if (nextTag) {
      if (nextTag === "JGO_REPORT") continue;
      flush(); tag = nextTag;
    } else if (tag) buffer.push(line);
  }
  flush();
  return blocks;
}

function parseStructured(raw: string): ReportData | null {
  if (!/\[JGO_REPORT\]/i.test(raw) && !/\[TRANSFORMATION_BEFORE\]/i.test(raw)) return null;
  const out: ReportData = { ...emptyReport, changes: [], targetRoles: [], sellingPoints: [] };
  const blocks = getTaggedBlocks(raw);
  let currentChange: Partial<Change> | null = null;
  let currentRole: Partial<TargetRole> | null = null;
  const pushChange = () => {
    if (currentChange && (currentChange.title || currentChange.body)) out.changes.push({ title: currentChange.title || "Resume Improvement", body: currentChange.body || "" });
    currentChange = null;
  };
  const pushRole = () => {
    if (currentRole && (currentRole.company || currentRole.role || currentRole.alignment)) out.targetRoles.push({ company: currentRole.company || "", role: currentRole.role || "", alignment: currentRole.alignment || "" });
    currentRole = null;
  };
  for (const b of blocks) {
    const value = b.value.trim();
    switch (b.tag) {
      case "CLIENT": out.client = value; break;
      case "TRANSFORMATION_BEFORE": out.transformationBefore = value; break;
      case "TRANSFORMATION_AFTER": out.transformationAfter = value; break;
      case "CHANGE": pushChange(); currentChange = {}; break;
      case "TITLE": if (currentChange) currentChange.title = value; break;
      case "BODY": if (currentChange) currentChange.body = value; break;
      case "TARGET_ROLE": pushRole(); currentRole = {}; break;
      case "COMPANY": if (currentRole) currentRole.company = value; break;
      case "ROLE": if (currentRole) currentRole.role = value; break;
      case "ALIGNMENT": if (currentRole) currentRole.alignment = value; break;
      case "SELLING_POINTS": out.sellingPoints = splitLines(value); break;
      case "BIGGEST_DIFFERENCE_BEFORE": out.biggestDifferenceBefore = value; break;
      case "BIGGEST_DIFFERENCE_NOW": out.biggestDifferenceNow = value; break;
      case "POSITIONING": out.positioning = value; break;
      case "TARGET_LEVEL": out.targetLevel = value; break;
      case "PRIMARY_ALIGNMENT": out.primaryAlignment = value; break;
      case "INDUSTRIES": out.industries = value; break;
      case "DIFFERENTIATORS": out.differentiators = value; break;
      case "STATUS": out.status = value || "READY"; break;
    }
  }
  pushChange(); pushRole();
  return out;
}

function parseLegacy(raw: string): ReportData {
  const out: ReportData = { ...emptyReport, changes: [], targetRoles: [], sellingPoints: [] };
  const lines = raw.replace(/\r/g, "").split("\n");
  const headings = [
    "YOUR RESUME TRANSFORMATION", "BEFORE", "AFTER", "WHAT CHANGED", "TARGET ROLE ALIGNMENT",
    "YOUR STRONGEST SELLING POINTS", "THE BIGGEST DIFFERENCE", "JGO HIRE FINAL ASSESSMENT"
  ];
  let section = "";
  let subsection = "";
  let buf: string[] = [];
  const flush = () => {
    const text = buf.map(clean).filter(Boolean).join("\n").trim();
    if (!text) { buf = []; return; }
    if (section === "BEFORE") out.transformationBefore = text;
    else if (section === "AFTER") out.transformationAfter = text;
    else if (section === "SELLING") out.sellingPoints = splitLines(text);
    else if (section === "CHANGE" && subsection) out.changes.push({ title: subsection, body: text });
    else if (section === "TARGET" && subsection) {
      const [company, ...roleParts] = subsection.split("|").map(x => x.trim());
      out.targetRoles.push({ company, role: roleParts.join(" | "), alignment: text });
    }
    buf = [];
  };
  for (const rawLine of lines) {
    const line = clean(rawLine);
    if (!line) { if (buf.length) buf.push(""); continue; }
    const upper = line.toUpperCase().replace(/:$/, "");
    if (/^PREPARED FOR\s+/i.test(line)) { out.client = line.replace(/^PREPARED FOR\s+/i, "").trim(); continue; }
    if (/^CLIENT\s*:/i.test(line)) { out.client = line.replace(/^CLIENT\s*:/i, "").trim(); continue; }
    if (upper === "BEFORE") { flush(); section = "BEFORE"; subsection = ""; continue; }
    if (upper === "AFTER") { flush(); section = "AFTER"; subsection = ""; continue; }
    if (upper === "TARGET ROLE ALIGNMENT") { flush(); section = "TARGET"; subsection = ""; continue; }
    if (upper === "YOUR STRONGEST SELLING POINTS") { flush(); section = "SELLING"; subsection = ""; continue; }
    if (upper === "THE BIGGEST DIFFERENCE") { flush(); section = "DIFFERENCE"; subsection = ""; continue; }
    if (upper === "JGO HIRE FINAL ASSESSMENT") { flush(); section = "FINAL"; subsection = ""; continue; }
    if (/^\d+\.\s+/.test(line)) { flush(); section = "CHANGE"; subsection = line.replace(/^\d+\.\s+/, "").trim(); continue; }
    if (section === "TARGET" && /\|/.test(line) && !line.endsWith(".")) { flush(); subsection = line; continue; }
    if (section === "DIFFERENCE") {
      if (/^BEFORE\s*:/i.test(line)) out.biggestDifferenceBefore = line.replace(/^BEFORE\s*:/i, "").trim();
      else if (/^(NOW|AFTER)\s*:/i.test(line)) out.biggestDifferenceNow = line.replace(/^(NOW|AFTER)\s*:/i, "").trim();
      else buf.push(line);
      continue;
    }
    if (section === "FINAL") {
      if (/^RESUME POSITIONING\s*:/i.test(line)) out.positioning = line.replace(/^RESUME POSITIONING\s*:/i, "").trim();
      else if (/^TARGET LEVEL\s*:/i.test(line)) out.targetLevel = line.replace(/^TARGET LEVEL\s*:/i, "").trim();
      else if (/^PRIMARY AREAS OF ALIGNMENT\s*:/i.test(line)) out.primaryAlignment = line.replace(/^PRIMARY AREAS OF ALIGNMENT\s*:/i, "").trim();
      else if (/^INDUSTRY STRENGTHS\s*:/i.test(line)) out.industries = line.replace(/^INDUSTRY STRENGTHS\s*:/i, "").trim();
      else if (/^KEY DIFFERENTIATORS\s*:/i.test(line)) out.differentiators = line.replace(/^KEY DIFFERENTIATORS\s*:/i, "").trim();
      else if (/^RESUME STATUS\s*:/i.test(line)) out.status = line.replace(/^RESUME STATUS\s*:/i, "").trim();
      continue;
    }
    if (!headings.includes(upper)) buf.push(line);
  }
  flush();
  if (!out.client) {
    const nameMatch = raw.match(/Prepared for\s+([^\n]+)/i);
    if (nameMatch) out.client = clean(nameMatch[1]);
  }
  return out;
}

function parseImport(raw: string) { return parseStructured(raw) || parseLegacy(raw); }

function Field({ label, value, onChange, rows = 4 }: { label:string; value:string; onChange:(v:string)=>void; rows?:number }) {
  return <label className="block"><span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-[#71806f]">{label}</span><textarea value={value} onChange={e=>onChange(e.target.value)} rows={rows} className="w-full resize-y rounded-2xl border border-[#dce4d8] bg-white px-4 py-3 text-sm leading-6 text-[#364234] outline-none transition focus:border-[#aebda8] focus:ring-4 focus:ring-[#dfe8da]/60" /></label>;
}
function Input({ label, value, onChange }: { label:string; value:string; onChange:(v:string)=>void }) {
  return <label className="block"><span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-[#71806f]">{label}</span><input value={value} onChange={e=>onChange(e.target.value)} className="w-full rounded-2xl border border-[#dce4d8] bg-white px-4 py-3 text-sm text-[#364234] outline-none focus:border-[#aebda8] focus:ring-4 focus:ring-[#dfe8da]/60" /></label>;
}
function loadScript(src:string,id:string){return new Promise<void>((resolve,reject)=>{const ex=document.getElementById(id) as HTMLScriptElement|null;if(ex){if(ex.dataset.loaded==="true")return resolve();ex.addEventListener("load",()=>resolve(),{once:true});ex.addEventListener("error",()=>reject(new Error("Could not load PDF tools.")),{once:true});return;}const s=document.createElement("script");s.id=id;s.src=src;s.async=true;s.onload=()=>{s.dataset.loaded="true";resolve();};s.onerror=()=>reject(new Error("Could not load PDF tools."));document.head.appendChild(s);});}
async function imageData(url:string){const blob=await fetch(url).then(r=>{if(!r.ok)throw new Error("Logo not found");return r.blob();});return await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(blob);});}

async function makePdf(data: ReportData) {
  await loadScript("https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js","jgo-report-jspdf");
  const jsPDF=window.jspdf?.jsPDF; if(!jsPDF) throw new Error("PDF generator did not load.");
  const d=new jsPDF({unit:"pt",format:"letter",orientation:"portrait"});
  const W=612,H=792,L=46,R=46,T=42,B=46,max=W-L-R; const sage=[78,99,72],charcoal=[45,52,44],light=[238,242,234],line=[216,224,211]; let y=T;
  const footer=()=>{d.setDrawColor(...line);d.line(L,H-31,W-R,H-31);d.setFont("helvetica","normal");d.setFontSize(7.5);d.setTextColor(112,126,111);d.text("JGO HIRE  |  RESUME READY REPORT",L,H-17);d.text(String(d.getNumberOfPages()),W-R,H-17,{align:"right"});};
  const newPage=()=>{footer();d.addPage();y=T;}; const ensure=(h:number)=>{if(y+h>H-B)newPage();};
  const body=(text:string,size=9.2,bold=false,indent=0)=>{if(!text)return;d.setFont("helvetica",bold?"bold":"normal");d.setFontSize(size);d.setTextColor(...charcoal);const ls=d.splitTextToSize(text,max-indent);ensure(ls.length*(size*1.38)+5);d.text(ls,L+indent,y);y+=ls.length*(size*1.38)+6;};
  const section=(name:string)=>{ensure(30);y+=8;d.setFont("helvetica","bold");d.setFontSize(11.2);d.setTextColor(...sage);d.text(name,L,y);y+=5;d.setDrawColor(...line);d.line(L,y,W-R,y);y+=13;};
  const bullet=(text:string)=>{if(!text)return;d.setFont("helvetica","normal");d.setFontSize(9.1);d.setTextColor(...charcoal);const ls=d.splitTextToSize(text,max-18);ensure(ls.length*12.5+4);d.text("•",L+2,y);d.text(ls,L+13,y);y+=ls.length*12.5+3;};
  try{const logo=await imageData("/jgo-hire-logo.png");d.addImage(logo,"PNG",L,y,78,30,undefined,"FAST");y+=40;}catch{body("JGO Hire",18,true);}
  d.setFont("helvetica","bold");d.setFontSize(20);d.setTextColor(20,20,20);d.text("Resume Ready Report",L,y);y+=18;
  d.setFillColor(...light);d.roundedRect(L,y,max,48,8,8,"F");d.setFontSize(7.3);d.setFont("helvetica","bold");d.setTextColor(...sage);d.text("PREPARED FOR",L+12,y+14);d.setFontSize(10);d.setTextColor(...charcoal);d.text(data.client||"Client",L+12,y+31);y+=62;
  section("YOUR RESUME TRANSFORMATION"); body("BEFORE",9.2,true); body(data.transformationBefore); y+=3; body("AFTER",9.2,true); body(data.transformationAfter);
  section("WHAT CHANGED"); data.changes.forEach((c,i)=>{body(`${i+1}. ${c.title.toUpperCase()}`,9.2,true);body(c.body);y+=3;});
  if(data.targetRoles.length){section("TARGET ROLE ALIGNMENT");data.targetRoles.forEach(r=>{body([r.company,r.role].filter(Boolean).join(" | "),9.2,true);body(r.alignment);y+=3;});}
  if(data.sellingPoints.length){section("YOUR STRONGEST SELLING POINTS");data.sellingPoints.forEach(bullet);}
  if(data.biggestDifferenceBefore||data.biggestDifferenceNow){section("THE BIGGEST DIFFERENCE");body(`Before: ${data.biggestDifferenceBefore}`);body(`Now: ${data.biggestDifferenceNow}`,9.2,true);}
  section("JGO HIRE FINAL ASSESSMENT");
  [["Resume Positioning",data.positioning],["Target Level",data.targetLevel],["Primary Areas of Alignment",data.primaryAlignment],["Industry Strengths",data.industries],["Key Differentiators",data.differentiators],["Resume Status",data.status]].forEach(([k,v])=>{if(v)body(`${k}: ${v}`,9.1,k==="Resume Status");});
  y+=8; body("Your resume is now positioned to tell a clearer, more strategic, and more competitive story about the leader behind the experience.",9.2,true);
  footer();d.save(`${fileBaseName(data.client)}.pdf`);
}

export default function ResumeReadyReportPage(){
  const [report,setReport]=useState<ReportData>(emptyReport); const [importText,setImportText]=useState(""); const [status,setStatus]=useState("");
  const completion=useMemo(()=>{const checks=[report.client,report.transformationBefore,report.transformationAfter,report.changes.length,report.targetRoles.length,report.sellingPoints.length,report.biggestDifferenceBefore,report.biggestDifferenceNow,report.positioning,report.targetLevel,report.primaryAlignment,report.differentiators];return Math.round(checks.filter(Boolean).length/checks.length*100);},[report]);
  const doImport=()=>{const parsed=parseImport(importText);setReport(parsed);setStatus(parsed.client?`Report parsed for ${parsed.client}. Review below, then download.`:"Report parsed. Add the client name if it was not detected.");};
  const update=(key:keyof ReportData,value:any)=>setReport(r=>({...r,[key]:value}));
  const download=async()=>{try{setStatus("Building branded PDF...");await makePdf(report);setStatus("Resume Ready Report downloaded.");}catch(e:any){setStatus(e?.message||"Could not create PDF.");}};
  return <main className="min-h-screen bg-[#f8faf6] px-4 py-7 text-[#344132] md:px-8 md:py-9"><div className="mx-auto max-w-[1320px]">
    <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#80907e]">JGO Hire</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Resume Ready Report Builder</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#738071]">Paste one complete ChatGPT report. JGO OS separates it into the correct sections automatically, then you can edit, preview, and download the branded PDF.</p></div><div className="rounded-2xl border border-[#dfe6dc] bg-white px-5 py-3 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#80907e]">Report readiness</p><div className="mt-2 flex items-center gap-3"><div className="h-2 w-36 overflow-hidden rounded-full bg-[#edf1e9]"><div className="h-full rounded-full bg-[#81987a]" style={{width:`${completion}%`}}/></div><span className="text-sm font-bold text-[#53664f]">{completion}%</span></div></div></div>
    <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
      <aside className="space-y-5"><section className="rounded-3xl border border-[#dde5d9] bg-white p-5 shadow-[0_12px_35px_rgba(65,83,59,.06)]"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold">Quick Paste</h2><p className="mt-1 text-xs leading-5 text-[#7a8778]">Paste the full JGO OS-ready report from ChatGPT. Structured [TAGS] are preferred, but the builder also recognizes the older report headings.</p></div><span className="rounded-full bg-[#edf3e9] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#61755d]">Recommended</span></div><textarea value={importText} onChange={e=>setImportText(e.target.value)} rows={22} placeholder="Paste the entire Resume Ready Report here..." className="mt-4 w-full resize-y rounded-2xl border border-[#dce4d8] bg-[#fbfcfa] px-4 py-3 text-sm leading-6 outline-none focus:border-[#aebda8] focus:ring-4 focus:ring-[#dfe8da]/60"/><button onClick={doImport} disabled={!importText.trim()} className="mt-3 w-full rounded-2xl bg-[#53684f] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Format Report</button>{status&&<p className="mt-3 rounded-xl bg-[#f2f6ef] px-3 py-2 text-xs leading-5 text-[#61705d]">{status}</p>}</section>
      <section className="rounded-3xl border border-[#dde5d9] bg-[#eef4ea] p-5"><h3 className="text-sm font-bold">How to use this with ChatGPT</h3><p className="mt-2 text-xs leading-5 text-[#657361]">Ask: <strong>“Create JGO Resume Ready Report in JGO OS paste-ready format.”</strong> Copy the entire tagged output and paste it above. You should never need to separate sections manually.</p></section></aside>
      <section className="space-y-5"><div className="rounded-3xl border border-[#dde5d9] bg-white p-6 shadow-[0_12px_35px_rgba(65,83,59,.06)]"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-bold">Review & Edit</h2><p className="mt-1 text-xs text-[#7a8778]">Everything below is populated automatically after Quick Paste.</p></div><button onClick={download} disabled={!report.client} className="rounded-2xl bg-[#53684f] px-5 py-3 text-sm font-bold text-white disabled:opacity-40">Download PDF</button></div>
      <div className="grid gap-4 md:grid-cols-2"><Input label="Client" value={report.client} onChange={v=>update("client",v)}/><Input label="Resume Status" value={report.status} onChange={v=>update("status",v)}/></div>
      <div className="mt-6 grid gap-4 md:grid-cols-2"><Field label="Transformation — Before" value={report.transformationBefore} onChange={v=>update("transformationBefore",v)} rows={8}/><Field label="Transformation — After" value={report.transformationAfter} onChange={v=>update("transformationAfter",v)} rows={8}/></div>
      <div className="mt-6"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold uppercase tracking-wider text-[#60705d]">What Changed</h3><button onClick={()=>update("changes",[...report.changes,{title:"",body:""}])} className="text-xs font-bold text-[#61755d]">+ Add improvement</button></div><div className="space-y-4">{report.changes.map((c,i)=><div key={i} className="rounded-2xl border border-[#e0e6dd] bg-[#fbfcfa] p-4"><Input label={`Improvement ${i+1} title`} value={c.title} onChange={v=>{const n=[...report.changes];n[i]={...n[i],title:v};update("changes",n);}}/><div className="mt-3"><Field label="Explanation" value={c.body} onChange={v=>{const n=[...report.changes];n[i]={...n[i],body:v};update("changes",n);}} rows={5}/></div></div>)}</div></div>
      <div className="mt-6"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold uppercase tracking-wider text-[#60705d]">Target Role Alignment</h3><button onClick={()=>update("targetRoles",[...report.targetRoles,{company:"",role:"",alignment:""}])} className="text-xs font-bold text-[#61755d]">+ Add role</button></div><div className="space-y-4">{report.targetRoles.map((r,i)=><div key={i} className="rounded-2xl border border-[#e0e6dd] bg-[#fbfcfa] p-4"><div className="grid gap-3 md:grid-cols-2"><Input label="Company" value={r.company} onChange={v=>{const n=[...report.targetRoles];n[i]={...n[i],company:v};update("targetRoles",n);}}/><Input label="Role" value={r.role} onChange={v=>{const n=[...report.targetRoles];n[i]={...n[i],role:v};update("targetRoles",n);}}/></div><div className="mt-3"><Field label="Alignment" value={r.alignment} onChange={v=>{const n=[...report.targetRoles];n[i]={...n[i],alignment:v};update("targetRoles",n);}} rows={4}/></div></div>)}</div></div>
      <div className="mt-6"><Field label="Strongest Selling Points — one per line" value={report.sellingPoints.join("\n")} onChange={v=>update("sellingPoints",splitLines(v))} rows={8}/></div>
      <div className="mt-6 grid gap-4 md:grid-cols-2"><Field label="Biggest Difference — Before" value={report.biggestDifferenceBefore} onChange={v=>update("biggestDifferenceBefore",v)} rows={4}/><Field label="Biggest Difference — Now" value={report.biggestDifferenceNow} onChange={v=>update("biggestDifferenceNow",v)} rows={4}/></div>
      <div className="mt-6 grid gap-4 md:grid-cols-2"><Input label="Resume Positioning" value={report.positioning} onChange={v=>update("positioning",v)}/><Input label="Target Level" value={report.targetLevel} onChange={v=>update("targetLevel",v)}/><Field label="Primary Areas of Alignment" value={report.primaryAlignment} onChange={v=>update("primaryAlignment",v)} rows={4}/><Field label="Industry Strengths" value={report.industries} onChange={v=>update("industries",v)} rows={4}/><div className="md:col-span-2"><Field label="Key Differentiators" value={report.differentiators} onChange={v=>update("differentiators",v)} rows={4}/></div></div>
      </div></section>
    </div>
  </div></main>;
}
