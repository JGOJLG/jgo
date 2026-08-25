"use client";

import { useState } from "react";

type Props = { clientId:number; clientName:string; email:string|null; linked:boolean };

export default function ClientPortalAccess({clientId,clientName,email,linked}:Props){
 const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");
 async function invite(){
  if(!email){setMessage("Add an email address to this client first.");return;}
  setBusy(true);setMessage("");
  try{const r=await fetch("/api/client-portal/invite",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({clientId})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to send invite.");setMessage(d.message||"Portal invite sent.");}
  catch(e){setMessage(e instanceof Error?e.message:"Unable to send invite.");}finally{setBusy(false);}
 }
 return <section className="rounded-2xl border border-[#dfe6db] bg-white p-6">
  <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#7f9975]">Client Portal</p><h2 className="mt-1 text-xl font-bold text-[#243128]">{linked?"Portal Active":"Give client access"}</h2><p className="mt-1 max-w-xl text-sm text-[#708075]">{linked?`${clientName} has a portal account connected to this client record.`:`Invite ${clientName} to their private JGO Hire portal for documents, resources, and their job tracker.`}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${linked?"bg-[#e8eee3] text-[#4d6247]":"bg-[#f4efe5] text-[#8a7444]"}`}>{linked?"Active":"Not invited"}</span></div>
  <div className="mt-5 flex flex-wrap items-center gap-3"><button type="button" onClick={invite} disabled={busy||linked} className="rounded-xl bg-[#647d5b] px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{linked?"Portal Connected":busy?"Sending...":"Invite to Client Portal"}</button>{email?<span className="text-sm text-[#708075]">{email}</span>:<span className="text-sm font-semibold text-[#9a554d]">Client needs an email first.</span>}</div>
  {message?<p className="mt-3 text-sm font-semibold text-[#4d6247]">{message}</p>:null}
 </section>;
}
