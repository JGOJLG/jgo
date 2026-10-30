"use client";
import { useEffect, useRef, useState } from "react";

import EmailHubClient from "./EmailHubClient";
import MarketingStudio from "../marketing-studio/page";

type Contact = { id:number;name:string|null;email:string|null;status:string|null;company:string|null };
type EmailContact = { id:number;name:string|null;email:string;company:string|null;client_id:number|null;first_contacted_at:string|null;last_contacted_at:string|null;email_count:number;marketing_opt_in:boolean;notes:string|null };
type AudienceContact = {email:string;name:string;clientId:number|null;groups:string[];optedIn:boolean};
type Template = {id:number;name:string;subject:string;body:string};
type SentEmail = {id:number;client_id:number|null;recipient_name:string|null;recipient_email:string;subject:string;body:string;template_id:number|null;email_tags?:string[];sent_at:string};
export default function EmailWorkspace(props:{audienceContacts:AudienceContact[];contacts:Contact[];initialEmailContacts:EmailContact[];initialTemplates:Template[];initialSent:SentEmail[]}){
 const [page,setPage]=useState<"home"|"compose"|"templates"|"contacts"|"sent"|"design">("home");
 const [brand,setBrand]=useState<"JGO Hire"|"JGO Job">("JGO Hire");
 const [previous,setPrevious]=useState<typeof page[]>([]);
 const pageRef=useRef(page);
 const pageIds=["home","compose","templates","contacts","sent","design"] as const;
 useEffect(()=>{const onPop=()=>{const target=new URLSearchParams(window.location.search).get("section");const next=pageIds.find(p=>p===target)||"home";pageRef.current=next;setPage(next);setPrevious([]);};window.addEventListener("popstate",onPop);onPop();return()=>window.removeEventListener("popstate",onPop)},[]);
 useEffect(()=>{const handler=()=>choose("compose");window.addEventListener("jgo-email-compose",handler);return()=>window.removeEventListener("jgo-email-compose",handler)},[]);
 const nav=[{id:"home",label:"Overview",icon:""},{id:"compose",label:"Compose",icon:""},{id:"templates",label:"Templates",icon:""},{id:"contacts",label:"Audience",icon:""},{id:"sent",label:"Sent",icon:""}] as const;
 const title=nav.find(n=>n.id===page)?.label||"Email Hub";
 const brandAudience=props.audienceContacts.filter(c=>brand==="JGO Job"?c.groups.includes("JGO Job Signups"):c.groups.some(g=>g!=="JGO Job Signups"));
 const optedIn=brandAudience.filter(c=>c.optedIn).length;
 const latest=props.initialSent.slice(0,4);
 const choose=(p:typeof page)=>{if(p===pageRef.current)return;setPrevious(prev=>[...prev,pageRef.current]);pageRef.current=p;setPage(p);const url=new URL(window.location.href);if(p==="home")url.searchParams.delete("section");else url.searchParams.set("section",p);window.history.pushState({emailSection:p},"",url.toString());window.scrollTo({top:0,behavior:"instant"});};
 const goBack=()=>{const last=previous[previous.length-1]||"home";setPrevious(prev=>prev.slice(0,-1));pageRef.current=last;setPage(last);const url=new URL(window.location.href);if(last==="home")url.searchParams.delete("section");else url.searchParams.set("section",last);window.history.replaceState({emailSection:last},"",url.toString());window.scrollTo({top:0,behavior:"instant"});};
 return <div className="min-h-screen min-w-0 w-full max-w-full overflow-x-hidden bg-[#f8fafc] pb-32 text-[#1f2937] md:pb-8">
  <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6"><div className="min-w-0"><p className="text-xs font-semibold tracking-wide text-slate-500">JGO OS</p><h1 className="text-xl font-semibold tracking-tight">Email Hub</h1></div><button type="button" onClick={()=>choose("compose")} className="shrink-0 rounded-md bg-[#294a7a] px-4 py-2.5 text-sm font-semibold text-white">New email</button></div></header>
  <div className="mx-auto max-w-6xl px-3 pt-4 sm:px-6">
   <div className="mb-4 flex w-full items-center gap-1 rounded-lg border border-slate-200 bg-white p-1" role="group" aria-label="Choose brand">{(["JGO Hire","JGO Job"] as const).map(b=><button type="button" key={b} aria-pressed={brand===b} onClick={()=>setBrand(b)} className={`min-w-0 flex-1 rounded-md px-3 py-3 text-sm font-semibold transition-colors ${brand===b?"bg-[#294a7a] text-white":"text-slate-600 hover:bg-slate-50"}`}>{b}</button>)}</div>
   <nav aria-label="Email Hub" className="mb-5 grid grid-cols-5 gap-0.5 rounded-lg border border-slate-200 bg-white p-1">{nav.map(n=><button type="button" key={n.id} onClick={()=>choose(n.id)} aria-current={page===n.id?"page":undefined} className={`min-w-0 rounded-md px-0.5 py-3 text-center text-[10px] font-semibold tracking-tight sm:text-sm ${page===n.id?"bg-[#e8eef8] text-[#294a7a]":"text-slate-600 hover:bg-slate-50"}`}>{n.label}</button>)}</nav>
   <main className="min-w-0 max-w-full">
    {page==="home"?<div className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-7"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{brand} workspace</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Email marketing, organized.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Write a message, use a template, or manage your audience.</p><div className="mt-5 flex flex-wrap gap-2"><button onClick={()=>choose("compose")} className="rounded-md bg-[#294a7a] px-4 py-3 text-sm font-semibold text-white">Create email</button><button onClick={()=>choose("templates")} className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700">Browse templates</button></div></section>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[{label:"Contacts",value:brandAudience.length,to:"contacts"},{label:"Opted in",value:optedIn,to:"contacts"},{label:"Templates",value:brand==="JGO Hire"?props.initialTemplates.length:50,to:"templates"},{label:"Sent messages",value:props.initialSent.length,to:"sent"}].map(k=><button key={k.label} onClick={()=>choose(k.to as typeof page)} className="rounded-lg border border-slate-200 bg-white p-4 text-left"><p className="text-2xl font-semibold text-[#294a7a]">{k.value}</p><p className="mt-1 text-xs text-slate-600">{k.label}</p></button>)}</section>
      <section className="rounded-lg border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><h3 className="text-base font-semibold">Recent emails</h3><button onClick={()=>choose("sent")} className="text-sm font-semibold text-[#294a7a]">View sent</button></div><div className="mt-3 divide-y divide-slate-100">{latest.length?latest.map(m=><div key={m.id} className="min-w-0 py-3"><p className="truncate text-sm font-medium">{m.subject||"Untitled"}</p><p className="mt-1 truncate text-xs text-slate-500">{m.recipient_email}</p></div>):<p className="py-4 text-sm text-slate-500">No recent messages.</p>}</div></section>
     </div>:<div className="min-w-0">
       <div className="mb-4 flex min-w-0 flex-wrap items-center gap-3"><button type="button" onClick={goBack} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">← Back</button><h2 className="text-lg font-semibold">{page==="design"?"Email designer":title}</h2><span className="ml-auto text-xs font-medium text-slate-500">{brand}</span></div>
       {page==="compose"&&<div className="mb-3 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3"><span className="text-sm text-slate-600">Need a designed newsletter?</span><button onClick={()=>choose("design")} className="text-sm font-semibold text-[#294a7a]">Open designer</button></div>}
       {page==="design"&&<div className="mb-3 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3"><span className="text-sm text-slate-600">Prefer a simple message?</span><button onClick={()=>choose("compose")} className="text-sm font-semibold text-[#294a7a]">Compose email</button></div>}
       {(page==="templates"||page==="design")&&<div className="min-w-0 max-w-full overflow-x-hidden rounded-lg border border-slate-200 bg-white"><MarketingStudio key={`${brand}-${page}`} legacyTemplates={brand==="JGO Hire"?props.initialTemplates:[]} hubContacts={brandAudience} selectedBrand={brand} initialTab={page==="templates"?"Templates":"Campaigns"}/></div>}
       {page!=="templates"&&page!=="design"&&<div className="min-w-0 max-w-full overflow-x-hidden rounded-lg border border-slate-200 bg-white"><EmailHubClient key={`${page}-${brand}`} {...props} selectedBrand={brand} activeTab={page==="contacts"?"contacts":page==="sent"?"sent":"compose"} compact/></div>}
      </div>}
   </main>
  </div>
 </div>;
}
