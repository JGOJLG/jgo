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
 return <div className="min-h-screen bg-[#f8faf9] text-[#203a33]">
  <div className="border-b border-[#e3eae6] bg-white px-5 py-5 sm:px-8"><div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-[.15em] text-[#5d8978]">JGO OS / Marketing</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Email Hub</h1><p className="mt-1 text-sm text-slate-500">Create, send and manage your emails in one place.</p></div><button onClick={()=>choose("compose")} className="rounded-xl bg-[#245f4d] px-5 py-3 text-sm font-semibold text-white hover:bg-[#194b3c]">+ Create email</button></div></div>
  <div className="mx-auto grid max-w-[1440px] gap-6 p-4 sm:p-6 lg:grid-cols-[210px_minmax(0,1fr)]">
   <nav aria-label="Email Hub sections" className="flex gap-1 overflow-x-auto rounded-2xl border border-[#e5ebe7] bg-white p-2 lg:h-fit lg:flex-col lg:gap-1 lg:p-3">
    {nav.map(n=><button key={n.id} onClick={()=>choose(n.id)} aria-current={page===n.id?"page":undefined} className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors ${page===n.id?"bg-[#e8f2ec] text-[#185d46]":"text-[#53655d] hover:bg-[#f5f7f5]"}`}><span aria-hidden="true" className="w-5 text-center text-base">{n.icon}</span>{n.label}</button>)}
   </nav>
   <main className="min-w-0">
    {page==="home" ? <div className="space-y-6">
      <div className="rounded-2xl border border-[#e5ebe7] bg-white p-6 sm:p-8"><h2 className="text-xl font-bold">What would you like to do?</h2><p className="mt-1 text-sm text-slate-500">Everything you need, without the extra steps.</p><div className="mt-6 grid gap-3 sm:grid-cols-2">
       <button onClick={()=>choose("compose")} className="rounded-xl border border-[#dce9e0] bg-[#f2f8f4] p-5 text-left hover:border-[#8fbaa0]"><div className="text-2xl">✉</div><div className="mt-3 font-bold">Create an email</div><p className="mt-1 text-sm text-slate-600">Write, preview and send a message.</p></button>
       <button onClick={()=>choose("design")} className="rounded-xl border border-[#e4e9e6] p-5 text-left hover:border-[#8fbaa0]"><div className="text-2xl">✦</div><div className="mt-3 font-bold">Design a newsletter</div><p className="mt-1 text-sm text-slate-600">Use the visual designer and saved campaigns.</p></button>
       <button onClick={()=>choose("templates")} className="rounded-xl border border-[#e4e9e6] p-5 text-left hover:border-[#8fbaa0]"><div className="text-2xl">▤</div><div className="mt-3 font-bold">My templates</div><p className="mt-1 text-sm text-slate-600">Open and reuse your saved email templates.</p></button>
       <button onClick={()=>choose("contacts")} className="rounded-xl border border-[#e4e9e6] p-5 text-left hover:border-[#8fbaa0]"><div className="text-2xl">♧</div><div className="mt-3 font-bold">My audience</div><p className="mt-1 text-sm text-slate-600">See contacts and manage recipients.</p></button>
      </div></div>
      <div className="grid gap-3 sm:grid-cols-3">{[{n:props.initialTemplates.length,label:"Saved templates",go:"templates"},{n:props.audienceContacts.length,label:"Contacts across lists",go:"contacts"},{n:props.initialSent.length,label:"Sent messages",go:"sent"}].map(c=><button key={c.label} onClick={()=>choose(c.go as typeof page)} className="rounded-2xl border border-[#e5ebe7] bg-white p-5 text-left"><div className="text-3xl font-bold text-[#245f4d]">{c.n}</div><div className="mt-1 text-sm text-slate-500">{c.label}</div></button>)}</div>
     </div> : <>
      <div className="mb-4"><h2 className="text-xl font-bold">{title}</h2><p className="mt-1 text-sm text-slate-500">{page==="design"?"Create beautiful emails or edit your saved Studio campaigns.":page==="templates"?"Your saved templates, ready to reuse.":page==="contacts"?"Manage your contact lists and recipients.":page==="sent"?"See the messages you have sent.":"Write and send your next email."}</p></div>
      <div style={{display:page==="design"?"block":"none"}} className="overflow-hidden rounded-2xl border border-[#e5ebe7] bg-white"><MarketingStudio legacyTemplates={props.initialTemplates} hubContacts={props.audienceContacts}/></div>
      <div style={{display:page!=="design"?"block":"none"}} className="overflow-hidden rounded-2xl border border-[#e5ebe7] bg-white">{page!=="design"&&<EmailHubClient key={page} {...props} activeTab={page==="templates"?"templates":page==="contacts"?"contacts":page==="sent"?"sent":"compose"} compact/>}</div>
     </>}
   </main>
  </div>
 </div>;
}
