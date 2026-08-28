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
  client: "", transformationBefore: "", transformationAfter: "", changes: [], targetRoles: [], sellingPoints: [],
  biggestDifferenceBefore: "", biggestDifferenceNow: "", positioning: "", targetLevel: "", primaryAlignment: "",
  industries: "", differentiators: "", status: "READY",
};

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
  const m = line.trim().match(/^\[\/?([A-Z0-9_ &-]+)\]$/i);
  return m ? m[1].toUpperCase().replace(/[ &-]+/g, "_") : null;
}
function getTaggedBlocks(raw: string) {
  const lines = raw.replace(/\r/g, "").split("\n");
  const blocks: { tag: string; value: string }[] = [];
  let tag = ""; let buffer: string[] = [];
  const flush = () => { if (tag) blocks.push({ tag, value: buffer.join("\n").trim() }); buffer = []; };
  for (const line of lines) {
    const nextTag = normalizeTag(line);
    if (nextTag) { if (nextTag === "JGO_REPORT") continue; flush(); tag = nextTag; }
    else if (tag) buffer.push(line);
  }
  flush(); return blocks;
}
function parseStructured(raw: string): ReportData | null {
  if (!/\[JGO_REPORT\]/i.test(raw) && !/\[TRANSFORMATION_BEFORE\]/i.test(raw)) return null;
  const out: ReportData = { ...emptyReport, changes: [], targetRoles: [], sellingPoints: [] };
  const blocks = getTaggedBlocks(raw); let currentChange: Partial<Change> | null = null; let currentRole: Partial<TargetRole> | null = null;
  const pushChange = () => { if (currentChange && (currentChange.title || currentChange.body)) out.changes.push({ title: currentChange.title || "Resume Improvement", body: currentChange.body || "" }); currentChange = null; };
  const pushRole = () => { if (currentRole && (currentRole.company || currentRole.role || currentRole.alignment)) out.targetRoles.push({ company: currentRole.company || "", role: currentRole.role || "", alignment: currentRole.alignment || "" }); currentRole = null; };
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
  pushChange(); pushRole(); return out;
}
function parseLegacy(raw: string): ReportData {
  const out: ReportData = { ...emptyReport, changes: [], targetRoles: [], sellingPoints: [] };
  const lines = raw.replace(/\r/g, "").split("\n");
  let section = "", subsection = ""; let buf: string[] = [];
  const flush = () => {
    const text = buf.map(clean).filter(Boolean).join("\n").trim(); if (!text) { buf = []; return; }
    if (section === "BEFORE") out.transformationBefore = text;
    else if (section === "AFTER") out.transformationAfter = text;
    else if (section === "SELLING") out.sellingPoints = splitLines(text);
    else if (section === "CHANGE" && subsection) out.changes.push({ title: subsection, body: text });
    else if (section === "TARGET" && subsection) { const [company, ...roleParts] = subsection.split("|").map(x => x.trim()); out.targetRoles.push({ company, role: roleParts.join(" | "), alignment: text }); }
    buf = [];
  };
  for (const rawLine of lines) {
    const line = clean(rawLine); if (!line) continue; const upper = line.toUpperCase().replace(/:$/, "");
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
    if (!["YOUR RESUME TRANSFORMATION","WHAT CHANGED"].includes(upper)) buf.push(line);
  }
  flush(); return out;
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

function sentenceBullets(text: string) {
  return text.replace(/\s+/g," ").trim().split(/(?<=[.!?])\s+(?=[A-Z0-9])/).map(x=>x.trim()).filter(Boolean);
}

async function makePdf(data: ReportData) {
  await loadScript("https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js","jgo-report-jspdf");
  const jsPDF=window.jspdf?.jsPDF; if(!jsPDF) throw new Error("PDF generator did not load.");
  const d=new jsPDF({unit:"pt",format:"letter",orientation:"portrait"});
  const W=612,H=792,M=34,CW=W-M*2,G=16,COL=(CW-G)/2;
  const sage:[number,number,number]=[77,98,72], charcoal:[number,number,number]=[45,52,44], muted:[number,number,number]=[107,119,105], light:[number,number,number]=[240,244,237], pale:[number,number,number]=[248,250,246], rule:[number,number,number]=[216,224,211];
  const setText=(size:number,bold=false,color=charcoal)=>{d.setFont("helvetica",bold?"bold":"normal");d.setFontSize(size);d.setTextColor(...color);};
  const footer=(page:number)=>{d.setDrawColor(...rule);d.line(M,H-26,W-M,H-26);setText(6.6,true,muted);d.text("JGO HIRE  |  RESUME READY REPORT",M,H-13);d.text(`${page} / 2`,W-M,H-13,{align:"right"});};
  const pill=(text:string,x:number,y:number,w?:number)=>{setText(6.7,true,sage);const pw=w||Math.max(44,d.getTextWidth(text)+16);d.setFillColor(...light);d.roundedRect(x,y-9,pw,15,7,7,"F");d.text(text,x+8,y+1);return pw;};
  const sectionTitle=(text:string,x:number,y:number,w:number)=>{setText(8.3,true,sage);d.text(text,x,y);d.setDrawColor(...rule);d.line(x,y+5,x+w,y+5);return y+17;};
  const fitBlock=(text:string,x:number,y:number,w:number,h:number,opts?:{min?:number;max?:number;bold?:boolean;bullet?:boolean;leading?:number})=>{
    if(!text) return y;
    const min=opts?.min||6.3,max=opts?.max||8.1,bold=!!opts?.bold,bullet=!!opts?.bullet;
    let size=max, lines:string[]=[]; let lineH=0;
    while(size>=min){ setText(size,bold); lines=d.splitTextToSize(text,w-(bullet?12:0)); lineH=size*(opts?.leading||1.25); if(lines.length*lineH<=h) break; size-=.2; }
    setText(size,bold); if(bullet){ d.setFillColor(...sage);d.circle(x+2,y-2,1.4,"F");d.text(lines,x+10,y); } else d.text(lines,x,y);
    return y+lines.length*lineH;
  };
  const bulletList=(items:string[],x:number,y:number,w:number,h:number,max=7.7)=>{
    const cleaned=items.filter(Boolean); if(!cleaned.length) return y;
    let size=max; let wrapped:string[][]=[]; let lineH=0;
    while(size>=6.1){ setText(size,false); wrapped=cleaned.map(t=>d.splitTextToSize(t,w-14));lineH=size*1.22;const needed=wrapped.reduce((s,a)=>s+a.length*lineH+4,0);if(needed<=h)break;size-=.2; }
    setText(size,false);for(const lines of wrapped){d.setFillColor(...sage);d.circle(x+2,y-2,1.35,"F");d.text(lines,x+11,y);y+=lines.length*lineH+4;}return y;
  };
  const header=async(page:number)=>{
    if(page===1){
      try{const logo=await imageData("/jgo-hire-logo.png");d.addImage(logo,"PNG",M,30,72,28,undefined,"FAST");}catch{setText(17,true);d.text("JGO Hire",M,50);}
      setText(7,true,sage);d.text("RESUME READY REPORT",W-M,38,{align:"right"});setText(20,true,[30,34,29]);d.text(data.client||"Client",W-M,57,{align:"right"});
      d.setFillColor(...sage);d.rect(M,70,CW,3,"F");
    } else {
      setText(8,true,sage);d.text("JGO HIRE",M,37);setText(15,true,[30,34,29]);d.text("Resume Ready Report",M,55);setText(8,true,muted);d.text(data.client||"Client",W-M,53,{align:"right"});d.setDrawColor(...rule);d.line(M,67,W-M,67);
    }
  };

  await header(1);
  let y=92;
  setText(8.4,true,sage);d.text("YOUR RESUME TRANSFORMATION",M,y);y+=15;
  const boxH=126;
  d.setFillColor(...pale);d.roundedRect(M,y,COL,boxH,9,9,"F");d.setFillColor(...light);d.roundedRect(M+COL+G,y,COL,boxH,9,9,"F");
  pill("BEFORE",M+12,y+19);pill("AFTER",M+COL+G+12,y+19);
  const beforeItems=sentenceBullets(data.transformationBefore);const afterItems=sentenceBullets(data.transformationAfter);
  bulletList(beforeItems,M+12,y+43,COL-24,boxH-52,7.4);bulletList(afterItems,M+COL+G+12,y+43,COL-24,boxH-52,7.4);
  y+=boxH+24;

  y=sectionTitle("WHAT CHANGED",M,y,CW);
  const changeTop=y; const changeBottom=738; const changeArea=changeBottom-changeTop; const left=data.changes.filter((_,i)=>i%2===0), right=data.changes.filter((_,i)=>i%2===1);
  const renderChanges=(items:Change[],x:number)=>{
    let cy=changeTop; const available=changeArea; const each=Math.max(54,(available-(items.length-1)*7)/Math.max(items.length,1));
    items.forEach((c,idx)=>{const sourceIndex=data.changes.indexOf(c)+1;d.setFillColor(...pale);d.roundedRect(x,cy,COL,each-3,7,7,"F");pill(String(sourceIndex).padStart(2,"0"),x+10,cy+18,28);setText(7.5,true,[48,61,45]);const title=d.splitTextToSize(c.title.toUpperCase(),COL-58);d.text(title,x+46,cy+16);const titleH=title.length*9;const bullets=sentenceBullets(c.body);bulletList(bullets,x+12,cy+30+titleH,COL-24,each-43-titleH,6.9);cy+=each+7;});
  };
  renderChanges(left,M);renderChanges(right,M+COL+G);footer(1);

  d.addPage();await header(2);y=88;
  if(data.targetRoles.length){
    y=sectionTitle("TARGET ROLE ALIGNMENT",M,y,CW);
    const roleH=Math.min(196,Math.max(108,data.targetRoles.length*58));
    const roleCols=data.targetRoles.length>1; const rw=roleCols?COL:CW;
    data.targetRoles.forEach((r,i)=>{const x=roleCols?(i%2===0?M:M+COL+G):M;const row=Math.floor(i/(roleCols?2:1));const rows=Math.ceil(data.targetRoles.length/(roleCols?2:1));const h=(roleH-(rows-1)*8)/rows;const ry=y+row*(h+8);d.setFillColor(...pale);d.roundedRect(x,ry,rw,h,8,8,"F");setText(7.1,true,sage);d.text((r.company||"TARGET COMPANY").toUpperCase(),x+12,ry+16);setText(8.2,true,charcoal);const rl=d.splitTextToSize(r.role||"Target Role",rw-24);d.text(rl,x+12,ry+30);const start=ry+31+rl.length*9;bulletList(sentenceBullets(r.alignment),x+12,start,rw-24,h-(start-ry)-8,6.8);});
    y+=roleH+20;
  }

  const contentBottom=735; const remaining=contentBottom-y; const topH=Math.min(176,Math.max(132,remaining*.43));
  const xLeft=M,xRight=M+COL+G;
  let ly=sectionTitle("YOUR STRONGEST SELLING POINTS",xLeft,y,COL);
  bulletList(data.sellingPoints,xLeft,ly,COL,topH-20,7.2);
  let ry=sectionTitle("THE BIGGEST DIFFERENCE",xRight,y,COL);
  d.setFillColor(...pale);d.roundedRect(xRight,ry,COL,topH-25,8,8,"F");pill("BEFORE",xRight+10,ry+19);let dy=fitBlock(data.biggestDifferenceBefore,xRight+12,ry+42,COL-24,(topH-58)/2,{min:6.2,max:7.2});
  const divider=ry+(topH-25)/2;d.setDrawColor(...rule);d.line(xRight+12,divider,xRight+COL-12,divider);pill("NOW",xRight+10,divider+22);fitBlock(data.biggestDifferenceNow,xRight+12,divider+44,COL-24,ry+topH-32-(divider+44),{min:6.2,max:7.2,bold:true});
  y+=topH+12;

  y=sectionTitle("JGO HIRE FINAL ASSESSMENT",M,y,CW);
  const assessmentH=contentBottom-y;
  d.setFillColor(...light);d.roundedRect(M,y,CW,assessmentH,9,9,"F");
  const label=(k:string,v:string,x:number,yy:number,w:number)=>{setText(6.2,true,sage);d.text(k.toUpperCase(),x,yy);fitBlock(v,x,yy+12,w,31,{min:6.2,max:7.4,bold:true});};
  const half=(CW-32)/2;label("Resume Positioning",data.positioning,M+14,y+18,half);label("Target Level",data.targetLevel,M+18+half,y+18,half);
  label("Primary Areas of Alignment",data.primaryAlignment,M+14,y+62,half);label("Industry Strengths",data.industries,M+18+half,y+62,half);
  if(assessmentH>130){label("Key Differentiators",data.differentiators,M+14,y+106,CW-112);pill((data.status||"READY").toUpperCase(),W-M-82,y+117,68);}
  footer(2);d.save(`${fileBaseName(data.client)}.pdf`);
}

export default function ResumeReadyReportPage(){
  const [report,setReport]=useState<ReportData>(emptyReport); const [importText,setImportText]=useState(""); const [status,setStatus]=useState("");
  const completion=useMemo(()=>{const checks=[report.client,report.transformationBefore,report.transformationAfter,report.changes.length,report.targetRoles.length,report.sellingPoints.length,report.biggestDifferenceBefore,report.biggestDifferenceNow,report.positioning,report.targetLevel,report.primaryAlignment,report.differentiators];return Math.round(checks.filter(Boolean).length/checks.length*100);},[report]);
  const doImport=()=>{const parsed=parseImport(importText);setReport(parsed);setStatus(parsed.client?`Report parsed for ${parsed.client}. Review below, then download.`:"Report parsed. Add the client name if it was not detected.");};
  const update=(key:keyof ReportData,value:any)=>setReport(r=>({...r,[key]:value}));
  const download=async()=>{try{setStatus("Building clean two-page report...");await makePdf(report);setStatus("Two-page Resume Ready Report downloaded.");}catch(e:any){setStatus(e?.message||"Could not create PDF.");}};
  return <main className="min-h-screen bg-[#f8faf6] px-4 py-7 text-[#344132] md:px-8 md:py-9"><div className="mx-auto max-w-[1320px]">
    <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#80907e]">JGO Hire</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Resume Ready Report Builder</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#738071]">Paste one complete ChatGPT report. JGO OS separates the content automatically and turns it into a clean, skimmable two-page client report.</p></div><div className="rounded-2xl border border-[#dfe6dc] bg-white px-5 py-3 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#80907e]">Report readiness</p><div className="mt-2 flex items-center gap-3"><div className="h-2 w-36 overflow-hidden rounded-full bg-[#edf1e9]"><div className="h-full rounded-full bg-[#81987a]" style={{width:`${completion}%`}}/></div><span className="text-sm font-bold text-[#53664f]">{completion}%</span></div></div></div>
    <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
      <aside className="space-y-5"><section className="rounded-3xl border border-[#dde5d9] bg-white p-5 shadow-[0_12px_35px_rgba(65,83,59,.06)]"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold">Quick Paste</h2><p className="mt-1 text-xs leading-5 text-[#7a8778]">Paste the full JGO OS-ready report from ChatGPT. The PDF automatically converts dense paragraphs into clean bullets while preserving the content.</p></div><span className="rounded-full bg-[#edf3e9] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#61755d]">2 Pages</span></div><textarea value={importText} onChange={e=>setImportText(e.target.value)} rows={22} placeholder="Paste the entire Resume Ready Report here..." className="mt-4 w-full resize-y rounded-2xl border border-[#dce4d8] bg-[#fbfcfa] px-4 py-3 text-sm leading-6 outline-none focus:border-[#aebda8] focus:ring-4 focus:ring-[#dfe8da]/60"/><button onClick={doImport} disabled={!importText.trim()} className="mt-3 w-full rounded-2xl bg-[#53684f] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Format Report</button>{status&&<p className="mt-3 rounded-xl bg-[#f2f6ef] px-3 py-2 text-xs leading-5 text-[#61705d]">{status}</p>}</section>
      <section className="rounded-3xl border border-[#dde5d9] bg-[#eef4ea] p-5"><h3 className="text-sm font-bold">New report format</h3><p className="mt-2 text-xs leading-5 text-[#657361]">Page 1: transformation + key improvements. Page 2: target-role alignment + strongest selling points + biggest difference + final assessment. Long content automatically scales to stay within two pages.</p></section></aside>
      <section className="space-y-5"><div className="rounded-3xl border border-[#dde5d9] bg-white p-6 shadow-[0_12px_35px_rgba(65,83,59,.06)]"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-bold">Review & Edit</h2><p className="mt-1 text-xs text-[#7a8778]">The content stays detailed here. The PDF handles the cleaner visual formatting.</p></div><button onClick={download} disabled={!report.client} className="rounded-2xl bg-[#53684f] px-5 py-3 text-sm font-bold text-white disabled:opacity-40">Download 2-Page PDF</button></div>
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
