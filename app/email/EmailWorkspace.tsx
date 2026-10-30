"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import EmailHubClient from "./EmailHubClient";
import MarketingStudio from "../marketing-studio/page";
type Contact = { id:number;name:string|null;email:string|null;status:string|null;company:string|null };
type EmailContact = { id:number;name:string|null;email:string;company:string|null;client_id:number|null;first_contacted_at:string|null;last_contacted_at:string|null;email_count:number;marketing_opt_in:boolean;notes:string|null };
type AudienceContact = {email:string;name:string;clientId:number|null;groups:string[];optedIn:boolean};
type Template = {id:number;name:string;subject:string;body:string};
type SentEmail = {id:number;client_id:number|null;recipient_name:string|null;recipient_email:string;subject:string;body:string;template_id:number|null;email_tags?:string[];sent_at:string};
export default function EmailWorkspace(props:{audienceContacts:AudienceContact[];contacts:Contact[];initialEmailContacts:EmailContact[];initialTemplates:Template[];initialSent:SentEmail[]}){
 const [page,setPage]=useState<"home"|"compose"|"templates"|"contacts"|"sent"|"design">("home");
 useEffect(()=>{const handler=()=>setPage("compose");window.addEventListener("jgo-email-compose",handler);return()=>window.removeEventListener("jgo-email-compose",handler)},[]);
 const nav=[{id:"home",label:"Overview",icon:"⌂"},{id:"compose",label:"Create email",icon:"✉"},{id:"templates",label:"Templates",icon:"▤"},{id:"contacts",label:"Audience",icon:"♧"},{id:"sent",label:"Sent emails",icon:"✓"},{id:"design",label:"Email designer",icon:"✦"}] as const;
 const title=nav.find(n=>n.id===page)?.label||"Email Hub";
 const choose=(p:typeof page)=>setPage(p);
 return <div className="min-h-screen min-w-0 max-w-full overflow-x-clip bg-[#f7f8fb] pb-28 text-[#253047] md:pb-8">
  <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-8 sm:py-5"><div className="mx-auto flex max-w-[1440px] min-w-0 flex-wrap items-center justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[.15em] text-[#5d8978]">JGO OS / Marketing</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Email Hub</h1><p className="mt-1 text-sm text-slate-500">Create, send and manage your emails in one place.</p></div><button onClick={()=>choose("compose")} className="rounded-xl bg-[#334e8a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#253c70] sm:px-5 sm:py-3">+ Create email</button></div></div>
  <div className="mx-auto grid min-w-0 max-w-[1440px] gap-4 px-3 py-4 sm:p-6 lg:grid-cols-[210px_minmax(0,1fr)]">
   <nav aria-label="Email Hub sections" className="grid grid-cols-3 gap-1 rounded-2xl border border-slate-200 bg-white p-2 sm:grid-cols-6 lg:h-fit lg:grid-cols-1 lg:gap-1 lg:p-3">
    {nav.map(n=><button key={n.id} onClick={()=>choose(n.id)} aria-current={page===n.id?"page":undefined} className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2.5 text-center text-[11px] font-semibold transition-colors sm:text-xs lg:flex-row lg:justify-start lg:gap-3 lg:px-4 lg:py-3 lg:text-left lg:text-sm ${page===n.id?"bg-[#e9eef9] text-[#294b8c]":"text-slate-600 hover:bg-slate-100"}`}><span aria-hidden="true" className="text-center text-lg lg:w-5 lg:text-base">{n.icon}</span>{n.label}</button>)}
   </nav>
   <main className="min-w-0 max-w-full">
    {page==="home" ? <div className="space-y-6">
      <div className="rounded-2xl border border-[#e5ebe7] bg-white p-6 sm:p-8"><h2 className="text-xl font-bold">What would you like to do?</h2><p className="mt-1 text-sm text-slate-500">Everything you need, without the extra steps.</p><div className="mt-6 grid gap-3 sm:grid-cols-2">
       <button onClick={()=>choose("compose")} className="rounded-xl border border-[#dce4f3] bg-[#f1f4fb] p-5 text-left hover:border-[#94a9d5]"><div className="text-2xl">✉</div><div className="mt-3 font-bold">Create an email</div><p className="mt-1 text-sm text-slate-600">Write, preview and send a message.</p></button>
       <button onClick={()=>choose("design")} className="rounded-xl border border-[#e4e9e6] p-5 text-left hover:border-[#94a9d5]"><div className="text-2xl">✦</div><div className="mt-3 font-bold">Design a newsletter</div><p className="mt-1 text-sm text-slate-600">Use the visual designer and saved campaigns.</p></button>
       <button onClick={()=>choose("templates")} className="rounded-xl border border-[#e4e9e6] p-5 text-left hover:border-[#94a9d5]"><div className="text-2xl">▤</div><div className="mt-3 font-bold">My templates</div><p className="mt-1 text-sm text-slate-600">Open and reuse your saved email templates.</p></button>
       <button onClick={()=>choose("contacts")} className="rounded-xl border border-[#e4e9e6] p-5 text-left hover:border-[#94a9d5]"><div className="text-2xl">♧</div><div className="mt-3 font-bold">My audience</div><p className="mt-1 text-sm text-slate-600">See contacts and manage recipients.</p></button>
      </div></div>
      <div className="grid gap-3 sm:grid-cols-3">{[{n:props.initialTemplates.length,label:"Saved templates",go:"templates"},{n:props.audienceContacts.length,label:"Contacts across lists",go:"contacts"},{n:props.initialSent.length,label:"Sent messages",go:"sent"}].map(c=><button key={c.label} onClick={()=>choose(c.go as typeof page)} className="rounded-2xl border border-[#e5ebe7] bg-white p-5 text-left"><div className="text-3xl font-bold text-[#334e8a]">{c.n}</div><div className="mt-1 text-sm text-slate-500">{c.label}</div></button>)}</div>
     </div> : <>
      <div className="mb-4"><h2 className="text-xl font-bold">{title}</h2><p className="mt-1 text-sm text-slate-500">{page==="design"?"Create beautiful emails or edit your saved Studio campaigns.":page==="templates"?"Your saved templates, ready to reuse.":page==="contacts"?"Manage your contact lists and recipients.":page==="sent"?"See the messages you have sent.":"Write and send your next email."}</p></div>
      <div style={{display:page==="design"?"block":"none"}} className="min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white"><MarketingStudio legacyTemplates={props.initialTemplates} hubContacts={props.audienceContacts}/></div>
      <div style={{display:page!=="design"?"block":"none"}} className="overflow-hidden rounded-2xl border border-[#e5ebe7] bg-white">{page!=="design"&&<EmailHubClient key={page} {...props} activeTab={page==="templates"?"templates":page==="contacts"?"contacts":page==="sent"?"sent":"compose"} compact/>}</div>
     </>}
   </main>
  </div>
 </div>;
}
