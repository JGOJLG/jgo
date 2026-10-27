"use client";
import { useMemo, useState } from "react";
export type AudienceContact = { email:string; name:string; clientId:number|null; groups:string[]; optedIn:boolean };
const GROUPS=["Survival Guide","Leads","Clients","Email Contacts"];
export default function AudiencePicker({contacts,onApply}:{contacts:AudienceContact[];onApply:(recipients:{email:string;name:string;clientId:number|null}[])=>void}) {
 const [groups,setGroups]=useState<string[]>([]);
 const [excluded,setExcluded]=useState<string[]>([]);
 const [query,setQuery]=useState("");
 const [consentedOnly,setConsentedOnly]=useState(true);
 const selected=useMemo(()=>contacts.filter(c=>(groups.includes("All")||c.groups.some(g=>groups.includes(g)))&&(!consentedOnly||c.optedIn)),[contacts,groups,consentedOnly]);
 const visible=selected.filter(c=>(c.email+" "+c.name).toLowerCase().includes(query.toLowerCase()));
 const included=selected.filter(c=>!excluded.includes(c.email));
 const toggle=(group:string)=>{setGroups(old=>group==="All"?(old.includes("All")?[]:["All"]):old.includes(group)?old.filter(g=>g!==group&&g!=="All"):[...old.filter(g=>g!=="All"),group]);setExcluded([])};
 return <div className="rounded-2xl border border-[#d7e1d0] bg-[#f8faf6] p-4 space-y-3">
  <div><h3 className="font-bold text-[#3f5140]">Audience Manager</h3><p className="text-xs text-[#708075]">Select categories, then remove individual people. One email per address.</p></div>
  <div className="flex flex-wrap gap-2">{[...GROUPS,"All"].map(g=><button key={g} type="button" onClick={()=>toggle(g)} className={`rounded-full border px-3 py-2 text-xs font-semibold ${groups.includes(g)?"bg-[#647d5b] text-white":"bg-white text-[#4d6247]"}`}>{g}</button>)}</div>
  <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={consentedOnly} onChange={e=>setConsentedOnly(e.target.checked)}/>Only show contacts with recorded marketing opt-in</label>
  {!consentedOnly&&<p className="text-xs text-amber-800">Unverified contacts must not receive promotional campaigns. The server must verify consent before sending.</p>}
  <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">{included.length} selected</strong><button type="button" className="text-xs underline" onClick={()=>setExcluded(selected.map(c=>c.email))}>Exclude all</button></div>
  <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search people to include or exclude" className="w-full rounded-xl border bg-white px-3 py-2 text-sm"/>
  <div className="max-h-48 overflow-y-auto space-y-1">{visible.map(c=><label key={c.email} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs"><input type="checkbox" checked={!excluded.includes(c.email)} onChange={e=>setExcluded(old=>e.target.checked?old.filter(x=>x!==c.email):[...old,c.email])}/><span className="min-w-0 flex-1 truncate">{c.name||c.email} · {c.email}</span><span className="text-[#708075]">{c.groups.join(", ")}</span></label>)}</div>
  <button type="button" disabled={!included.length||!consentedOnly} onClick={()=>onApply(included.map(c=>({email:c.email,name:c.name,clientId:c.clientId})))} className="rounded-xl bg-[#647d5b] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Use {included.length} recipients in email</button>
 </div>;
}
