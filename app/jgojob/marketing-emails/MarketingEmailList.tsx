"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
type Subscriber={email:string;name:string;consentedAt:string};
export default function MarketingEmailList({subscribers}:{subscribers:Subscriber[]}){
 const [query,setQuery]=useState("");
 const filtered=useMemo(()=>subscribers.filter(s=>(s.email+" "+s.name).toLowerCase().includes(query.toLowerCase())),[subscribers,query]);
 function download(){
  const escape=(s:string)=>'"'+s.replace(/"/g,'""')+'"';
  const csv=["Email,Name,Consent Date,Source",...filtered.map(s=>[s.email,s.name,s.consentedAt,"JGO Job signup"].map(escape).join(","))].join("\r\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="jgojob-marketing-opt-ins.csv";a.click();URL.revokeObjectURL(url);
 }
 return <main className="min-h-screen bg-[#f7f8f3] p-5 lg:p-9"><div className="mx-auto max-w-5xl">
 <Link href="/jgojob" className="text-sm text-[#496b54]">← JGO Job</Link>
 <p className="mt-8 text-xs font-semibold uppercase tracking-widest text-[#78917d]">JGO OS · JGO JOB</p>
 <h1 className="mt-2 text-3xl font-bold text-[#2b4535]">Marketing Emails</h1>
 <p className="mt-2 text-sm text-slate-600">Only JGO Job users who explicitly checked the optional marketing email box during signup appear here. Other accounts are excluded.</p>
 <div className="mt-6 rounded-2xl border border-[#dfe6db] bg-white p-5">
 <div className="flex flex-wrap items-center justify-between gap-4"><div><div className="text-3xl font-semibold text-[#284536]">{subscribers.length}</div><div className="text-sm text-slate-500">Opted-in email addresses</div></div><button onClick={download} className="rounded-xl bg-[#355c44] px-5 py-3 text-sm font-semibold text-white">Export CSV</button></div>
 <p className="mt-3 text-xs text-slate-500">Before sending campaigns, exclude anyone who later unsubscribed through your email provider. This list records signup consent, not unsubscribe status.</p>
 <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name or email" className="mt-5 w-full rounded-xl border border-slate-200 p-3 text-sm"/>
 <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="py-3">Email</th><th>Name</th><th>Consent date</th></tr></thead><tbody>{filtered.map(s=><tr key={s.email} className="border-b border-slate-100"><td className="py-3 font-medium">{s.email}</td><td>{s.name||"—"}</td><td>{new Date(s.consentedAt).toLocaleDateString()}</td></tr>)}</tbody></table>{!filtered.length&&<p className="py-8 text-center text-sm text-slate-500">No opted-in subscribers found.</p>}</div>
 </div></div></main>;
}
