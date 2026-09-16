"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createEwcEntry, reorderEwcEntries, updateEwcEntry, updateEwcMoved, type EwcEntryType } from "./actions";

export type EwcEntry = {
  id: number; section: EwcEntryType; client_name: string; service_date: string | null; service_type: string;
  amount_owed: number; amount_paid: number; amount_received: number | null; stripe_fee: number;
  date_paid: string | null; notes: string | null; moved: boolean; sort_order: number; created_at: string; updated_at: string;
};
type FinanceView = "week" | "month" | "year" | "total";
type TextField = "client_name" | "service_date" | "service_type" | "date_paid" | "notes";
type MoneyField = "amount_owed" | "amount_paid" | "amount_received" | "stripe_fee";

function money(value: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number.isFinite(value) ? value : 0); }
function parseMoney(value: string) { const n = Number(value.replace(/[^0-9.-]/g, "")); return Number.isFinite(n) ? n : 0; }
function received(row: EwcEntry) { return Number(row.amount_received ?? row.amount_paid ?? 0); }
function deduction(row: EwcEntry) { return Math.max(Number(row.amount_paid || 0) - received(row), 0); }
function isOutstanding(row: EwcEntry) { return Number(row.amount_owed || 0) > 0 && received(row) <= 0; }
function parseLocalDate(value?: string | null) { if (!value) return null; const [y,m,d] = value.slice(0,10).split("-").map(Number); return y && m && d ? new Date(y,m-1,d) : null; }
function startOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function getRange(view: FinanceView, today: Date) {
  const end = startOfDay(today); if (view === "total") return { start: null, end };
  if (view === "year") return { start: new Date(end.getFullYear(),0,1), end };
  if (view === "month") return { start: new Date(end.getFullYear(),end.getMonth(),1), end };
  const day=end.getDay(), delta=day===0?6:day-1, start=new Date(end); start.setDate(end.getDate()-delta); return { start,end };
}
function fmtDate(d: Date) { return new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric"}).format(d); }

function MoneyInput({ value, onCommit }: { value:number; onCommit:(v:number)=>void }) {
  const [draft,setDraft]=useState(Number(value||0).toFixed(2));
  useEffect(()=>setDraft(Number(value||0).toFixed(2)),[value]);
  return <input value={draft} inputMode="decimal" onFocus={e=>e.currentTarget.select()} onChange={e=>setDraft(e.target.value.replace(/[^0-9.-]/g,""))} onBlur={()=>{const v=parseMoney(draft);setDraft(v.toFixed(2));onCommit(v);}} className="h-full w-full border-0 bg-transparent px-2.5 py-2 text-right text-[13px] text-[#243128] outline-none focus:bg-white focus:shadow-[inset_0_0_0_2px_rgba(100,125,91,0.24)]"/>;
}

export default function EwcTracker({ initialEntries }: { initialEntries:EwcEntry[] }) {
  const [entries,setEntries]=useState(initialEntries); const [dragged,setDragged]=useState<{section:EwcEntryType;id:number}|null>(null);
  const [savedMessage,setSavedMessage]=useState(""); const [financeView,setFinanceView]=useState<FinanceView>("total"); const [isPending,startTransition]=useTransition();
  const saveTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const bySection=(s:EwcEntryType)=>entries.filter(e=>e.section===s).sort((a,b)=>a.sort_order-b.sort_order);
  const sessions=useMemo(()=>bySection("Session"),[entries]); const linkedin=useMemo(()=>bySection("LinkedIn"),[entries]); const other=useMemo(()=>bySection("Other"),[entries]);

  const finance=useMemo(()=>{
    const {start,end}=getRange(financeView,new Date()); const rows=entries.filter(r=>{if(financeView==="total")return true; const d=parseLocalDate(r.date_paid??r.service_date??r.created_at); return !!d&&!!start&&d>=start&&d<=end;});
    const paidRows=rows.filter(r=>Number(r.amount_paid||0)>0); const owed=rows.filter(isOutstanding).reduce((s,r)=>s+Number(r.amount_owed||0),0); const paid=rows.reduce((s,r)=>s+Number(r.amount_paid||0),0); const rec=rows.reduce((s,r)=>s+received(r),0); const ded=rows.reduce((s,r)=>s+deduction(r),0);
    let label="All time"; if(financeView==="week"&&start)label=`${fmtDate(start)} – ${fmtDate(end)}`; if(financeView==="month")label=`${fmtDate(new Date(end.getFullYear(),end.getMonth(),1))} – ${fmtDate(end)}`; if(financeView==="year")label=`${end.getFullYear()} year to date`;
    return {owed,paid,received:rec,deductions:ded,final:rec,paidCount:paidRows.length,label};
  },[entries,financeView]);

  function flash(m="Saved to Supabase"){setSavedMessage(m);if(saveTimer.current)clearTimeout(saveTimer.current);saveTimer.current=setTimeout(()=>setSavedMessage(""),1600);}
  function updateLocal(id:number,field:TextField|MoneyField|"moved",value:string|number|boolean){setEntries(c=>c.map(r=>r.id===id?{...r,[field]:value}:r));}
  function formData(row:EwcEntry,over:Partial<EwcEntry>={}){const n={...row,...over},f=new FormData(); f.set("id",String(n.id));f.set("client_name",n.client_name);f.set("service_date",n.service_date??"");f.set("service_type",n.service_type);f.set("amount_owed",String(n.amount_owed??0));f.set("amount_paid",String(n.amount_paid??0));f.set("amount_received",String(n.amount_received??n.amount_paid??0));f.set("stripe_fee",String(n.stripe_fee??0));f.set("date_paid",n.date_paid??"");f.set("notes",n.notes??"");return f;}
  function persist(row:EwcEntry,over:Partial<EwcEntry>={}){const latest=entries.find(r=>r.id===row.id)??row;startTransition(async()=>{try{await updateEwcEntry(formData(latest,over));flash();}catch(e){console.error(e);flash("Could not save");}});}
  function addRow(section:EwcEntryType){startTransition(async()=>{try{const row=await createEwcEntry(section) as EwcEntry;setEntries(c=>[row,...c]);flash(`${section} row added`);}catch(e){console.error(e);flash("Could not add row");}});}
  function archive(row:EwcEntry){if(!window.confirm(`Are you sure you want to archive ${row.client_name||"this client"}? It will stay safely stored in JGO OS.`))return; const latest=entries.find(r=>r.id===row.id)??row;startTransition(async()=>{try{await updateEwcEntry(formData(latest));await updateEwcMoved(row.id,true);setEntries(c=>c.filter(e=>e.id!==row.id));flash("Archived and saved");}catch(e){console.error(e);flash("Could not archive");}});}
  function reorder(section:EwcEntryType,targetId:number){if(!dragged||dragged.section!==section||dragged.id===targetId)return;const rows=bySection(section),from=rows.findIndex(r=>r.id===dragged.id),to=rows.findIndex(r=>r.id===targetId);if(from<0||to<0)return;const next=[...rows],[m]=next.splice(from,1);next.splice(to,0,m);const map=new Map(next.map((r,i)=>[r.id,i+1]));setEntries(c=>c.map(r=>r.section===section?{...r,sort_order:map.get(r.id)??r.sort_order}:r));setDragged(null);startTransition(async()=>{try{await reorderEwcEntries(section,next.map(r=>r.id));flash("Order saved");}catch(e){console.error(e);flash("Could not reorder");}});}

  const inputClass="h-full w-full border-0 bg-transparent px-2.5 py-2 text-[13px] text-[#243128] outline-none focus:bg-white focus:shadow-[inset_0_0_0_2px_rgba(100,125,91,0.24)]";
  const dateClass="h-full w-full min-w-0 border-0 bg-transparent px-1.5 py-2 text-[11px] text-[#243128] outline-none focus:bg-white focus:shadow-[inset_0_0_0_2px_rgba(100,125,91,0.24)]";

  function table(section:EwcEntryType,rows:EwcEntry[]){const title=section==="Session"?"Sessions":section;return <section className="overflow-hidden rounded-2xl border border-[#dfe6db] bg-white shadow-sm">
    <div className="flex items-center justify-between border-b border-[#dfe6db] bg-[#fbfaf6] px-5 py-4"><div><h2 className="text-xl font-bold text-[#243128]">{title}</h2><p className="mt-1 text-sm text-[#708075]">Newest entries stay at the top. All edits auto-save.</p></div><button type="button" onClick={()=>addRow(section)} disabled={isPending} className="rounded-xl bg-[#647d5b] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">+ Add {section==="LinkedIn"?"LinkedIn Client":section}</button></div>
    <div className="overflow-x-auto"><div className="min-w-[1320px]">
      <div className="grid grid-cols-[44px_190px_92px_135px_105px_105px_110px_110px_110px_1fr_38px] border-b border-[#dfe6db] bg-[#eef2ea] text-[9px] font-bold uppercase tracking-[0.08em] text-[#647066]">{["#","Client","Date","Service","Owed","Paid","Received","Deduction","Final Earned","Notes",""].map((x,i)=><div key={`${x}-${i}`} className="border-r border-[#dfe6db] px-2 py-2.5 text-center">{x}</div>)}</div>
      {rows.length===0?<div className="p-10 text-center text-sm text-[#708075]">No entries yet.</div>:null}
      {rows.map((row,index)=>{const outstanding=isOutstanding(row);return <div key={row.id} onDragOver={e=>e.preventDefault()} onDrop={()=>reorder(section,row.id)} className={`group grid grid-cols-[44px_190px_92px_135px_105px_105px_110px_110px_110px_1fr_38px] border-b ${outstanding?"border-[#ead8a6] bg-[#fff8df] shadow-[inset_4px_0_0_#d6a93b]":index%2?"border-[#edf0ea] bg-[#fcfdfb]":"border-[#edf0ea] bg-white"}`}>
        <button type="button" draggable onDragStart={()=>setDragged({section,id:row.id})} className="cursor-grab border-r border-[#edf0ea] text-[#a5aea6]">⋮⋮</button>
        <input value={row.client_name} onChange={e=>updateLocal(row.id,"client_name",e.target.value)} onBlur={()=>persist(row)} placeholder="Client name" className={`${inputClass} border-r border-[#edf0ea] ${outstanding?"font-semibold":""}`}/>
        <input type="date" value={row.service_date??""} onChange={e=>{updateLocal(row.id,"service_date",e.target.value);persist(row,{service_date:e.target.value});}} className={`${dateClass} border-r border-[#edf0ea]`}/>
        <input value={row.service_type} onChange={e=>updateLocal(row.id,"service_type",e.target.value)} onBlur={()=>persist(row)} placeholder="Service" className={`${inputClass} border-r border-[#edf0ea]`}/>
        <div className={outstanding?"bg-[#fff0b8] font-bold text-[#7a5b00]":""}><MoneyInput value={Number(row.amount_owed||0)} onCommit={v=>{updateLocal(row.id,"amount_owed",v);persist(row,{amount_owed:v});}}/></div>
        <MoneyInput value={Number(row.amount_paid||0)} onCommit={v=>{updateLocal(row.id,"amount_paid",v);persist(row,{amount_paid:v});}}/>
        <MoneyInput value={received(row)} onCommit={v=>{updateLocal(row.id,"amount_received",v);persist(row,{amount_received:v});}}/>
        <div className="flex items-center justify-end border-r border-[#edf0ea] bg-[#fbf1ee] px-2.5 text-xs font-semibold text-[#9b6559]">{money(deduction(row))}</div>
        <div className="flex items-center justify-end border-r border-[#edf0ea] bg-[#edf5ee] px-2.5 text-xs font-bold text-[#4f755a]">{money(received(row))}</div>
        <input value={row.notes??""} onChange={e=>updateLocal(row.id,"notes",e.target.value)} onBlur={()=>persist(row)} placeholder="Notes" className={`${inputClass} border-r border-[#edf0ea]`}/>
        <div className="flex items-center justify-center"><button type="button" onClick={()=>archive(row)} className="flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium text-[#a8aea8] hover:bg-[#f1f2ef] hover:text-[#7b847c]" title="Archive">×</button></div>
      </div>})}
    </div></div>
  </section>}

  return <section className="min-w-0 flex-1 bg-[#f7f8f3] text-[#243128]">
    <header className="border-b border-[#dfe6db] bg-[#fbfaf6] px-6 py-7 lg:px-10"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7f9975]">Emily Weiss Consulting</p><h1 className="mt-2 text-3xl font-bold tracking-tight">EWC</h1></header>
    <div className="space-y-7 p-6 lg:p-10">
      <section className="w-full rounded-2xl border border-[#dfe6db] bg-white p-6 shadow-sm lg:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7f8d82]">Finance</p><p className="mt-2 text-4xl font-bold text-[#56754f]">{money(finance.final)}</p><p className="mt-1 text-xs font-medium text-[#879188]">Final earned · {finance.label}</p></div>
          <div className="inline-flex w-fit rounded-xl border border-[#dfe6db] bg-[#f7f8f3] p-1">{(["total","week","month","year"] as FinanceView[]).map(v=><button key={v} type="button" onClick={()=>setFinanceView(v)} className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition ${financeView===v?"bg-white text-[#4f6b49] shadow-sm":"text-[#7b877e] hover:text-[#4f6b49]"}`}>{v}</button>)}</div></div>
        <div className="mt-6 grid grid-cols-2 gap-y-4 border-t border-[#e7ebe4] pt-5 sm:grid-cols-5 sm:divide-x sm:divide-[#e7ebe4]">{[["Owed",finance.owed],["Paid",finance.paid],["Received",finance.received],["Deductions",finance.deductions],["Paid Entries",finance.paidCount]].map(([l,v],i)=><div key={String(l)} className={i?"sm:px-4":"sm:pr-4"}><p className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#8b958d]">{l}</p><p className={`mt-1 text-base font-bold ${l==="Owed"&&Number(v)>0?"text-[#9a6a00]":"text-[#35443a]"}`}>{l==="Paid Entries"?v:money(Number(v))}</p></div>)}</div>
      </section>
      <div className="flex items-center justify-between rounded-xl border border-[#dfe6db] bg-white px-4 py-3 text-xs text-[#708075]"><span>Everything auto-saves to Supabase. Archived rows stay safely stored in JGO OS.</span><span className="font-semibold text-[#647d5b]">{savedMessage||"Ready"}</span></div>
      {table("Session",sessions)}
      {table("LinkedIn",linkedin)}
      {table("Other",other)}
    </div>
  </section>;
}
