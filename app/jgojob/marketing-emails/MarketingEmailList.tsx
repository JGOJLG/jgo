"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
type Subscriber={email:string;name:string;consentedAt:string;optedIn:boolean;signupAt:string};
export default function MarketingEmailList({subscribers}:{subscribers:Subscriber[]}){
 const [query,setQuery]=useState("");const [filter,setFilter]=useState<"all"|"yes"|"no">("all");
 const filtered=useMemo(()=>subscribers.filter(s=>(filter==="all"||(filter==="yes"?s.optedIn:!s.optedIn))&&(s.email+" "+s.name).toLowerCase().includes(query.toLowerCase())),[subscribers,query,filter]);
 function download(){
  const escape=(s:string)=>'"'+s.replace(/"/g,'""')+'"';
  const csv=["Email,Name,Signup Date,Marketing Opt-in,Consent Date,Source",...filtered.map(s=>[s.email,s.name,s.signupAt,s.optedIn?"Yes":"No",s.consentedAt,"JGO Job signup"].map(escape).join(","))].join("\r\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="jgojob-marketing-opt-ins.csv";a.click();URL.revokeObjectURL(url);
 }
 return <main className="min-h-screen bg-[#f7f8f3] p-5 lg:p-9"><div className="mx-auto max-w-5xl">
 <Link href="/jgojob" className="text-sm text-[#496b54]">← JGO Job</Link>
 <p className="mt-8 text-xs font-semibold uppercase tracking-widest text-[#78917d]">JGO OS · JGO JOB</p>
 <h1 className="mt-2 text-3xl font-bold text-[#2b4535]">Marketing Emails</h1>
 <p className="mt-2 text-sm text-slate-600">All JGO Job signups appear here. Marketing consent is tracked separately. Only opted-in users are eligible for marketing emails.</p>
 <div className="mt-6 rounded-2xl border border-[#dfe6db] bg-white p-5">
 <div className="flex flex-wrap items-center justify-between gap-4"><div><div className="text-3xl font-semibold text-[#284536]">{subscribers.length}</div><div className="text-sm text-slate-500">Total signup emails</div></div><button onClick={download} className="rounded-xl bg-[#355c44] px-5 py-3 text-sm font-semibold text-white">Export CSV</button></div>
 <div className="mt-3 flex flex-wrap gap-3 text-sm"><span className="rounded-full bg-green-50 px-3 py-1 text-green-800">Opted in: {subscribers.filter(s=>s.optedIn).length}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Not opted in: {subscribers.filter(s=>!s.optedIn).length}</span></div><p className="mt-3 text-xs text-slate-500">Before sending campaigns, exclude anyone who later unsubscribed through your email provider. This list records signup consent, not unsubscribe status.</p>
 <div className="mt-4 flex gap-2">{(["all","yes","no"] as const).map(value=><button key={value} onClick={()=>setFilter(value)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${filter===value?"bg-[#355c44] text-white":"bg-slate-100 text-slate-600"}`}>{value==="all"?"All":value==="yes"?"Opted in":"Not opted in"}</button>)}</div><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name or email" className="mt-5 w-full rounded-xl border border-slate-200 p-3 text-sm"/>
 <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="py-3">Email</th><th>Name</th><th>Marketing</th><th>Signup date</th></tr></thead><tbody>{filtered.map(s=><tr key={s.email} className="border-b border-slate-100"><td className="py-3 font-medium">{s.email}</td><td>{s.name||"—"}</td><td><span className={s.optedIn?"text-green-700":"text-slate-500"}>{s.optedIn?"Opted in":"Not opted in"}</span></td><td>{new Date(s.signupAt).toLocaleDateString()}</td></tr>)}</tbody></table>{!filtered.length&&<p className="py-8 text-center text-sm text-slate-500">No opted-in subscribers found.</p>}</div>
 </div></div></main>;
}
