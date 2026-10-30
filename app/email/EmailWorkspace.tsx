"use client";
import { useState } from "react";
import Link from "next/link";
import EmailHubClient from "./EmailHubClient";
import MarketingStudio from "../marketing-studio/page";
type Contact = { id:number;name:string|null;email:string|null;status:string|null;company:string|null };
type EmailContact = { id:number;name:string|null;email:string;company:string|null;client_id:number|null;first_contacted_at:string|null;last_contacted_at:string|null;email_count:number;marketing_opt_in:boolean;notes:string|null };
type AudienceContact = {email:string;name:string;clientId:number|null;groups:string[];optedIn:boolean};
type Template = {id:number;name:string;subject:string;body:string};
type SentEmail = {id:number;client_id:number|null;recipient_name:string|null;recipient_email:string;subject:string;body:string;template_id:number|null;email_tags?:string[];sent_at:string};
export default function EmailWorkspace(props:{audienceContacts:AudienceContact[];contacts:Contact[];initialEmailContacts:EmailContact[];initialTemplates:Template[];initialSent:SentEmail[]}){
 const [view,setView]=useState<"studio"|"send">("studio");
 return <div className="min-w-0">
  <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-[#dce6df] bg-white/95 px-5 py-4 backdrop-blur sm:px-8">
   <div><div className="text-[11px] font-bold uppercase tracking-[.16em] text-[#27826b]">JGO OS</div><h1 className="text-xl font-extrabold tracking-tight text-[#193b32]">Email Hub</h1><p className="text-xs text-slate-500">One home for your emails, templates, contacts and sending.</p></div>
   <div role="tablist" aria-label="Email workspace" className="flex rounded-xl bg-[#edf3ee] p-1">
    <button role="tab" aria-selected={view==="studio"} onClick={()=>setView("studio")} className={`rounded-lg px-4 py-2.5 text-sm font-bold ${view==="studio"?"bg-white text-[#176a55] shadow-sm":"text-[#60746b]"}`}>Design & templates</button>
    <button role="tab" aria-selected={view==="send"} onClick={()=>setView("send")} className={`rounded-lg px-4 py-2.5 text-sm font-bold ${view==="send"?"bg-white text-[#176a55] shadow-sm":"text-[#60746b]"}`}>Compose & send</button>
   </div>
  </div>
  <div style={{display:view==="studio"?"block":"none"}}><MarketingStudio/></div>
  <div style={{display:view==="send"?"block":"none"}}><EmailHubClient {...props}/></div>
 </div>;
}