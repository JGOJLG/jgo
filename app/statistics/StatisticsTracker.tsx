"use client";
import {useMemo,useState} from "react";
import {createClient} from "@/lib/supabase-browser";
type Client={id:number;name:string;status:string};
type Event={id:number;client_id:number;kind:string;event_date:string;company:string|null;job_title:string|null;offer_status:string|null;notes:string|null};
const days=(a:string,b:string)=>Math.round((Date.parse(b+"T12:00:00Z")-Date.parse(a+"T12:00:00Z"))/86400000);
const fmt=(s:string)=>new Date(s+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
export default function StatisticsTracker({clients,initialEvents,setupError}:{clients:Client[];initialEvents:Event[];setupError:string|null}){
 const [events,setEvents]=useState<Event[]>(initialEvents);
 const [clientId,setClientId]=useState(String(clients[0]?.id??""));
 const [kind,setKind]=useState<"meeting"|"offer">("meeting");
 const [date,setDate]=useState("");
 const [company,setCompany]=useState("");
 const [jobTitle,setJobTitle]=useState("");
 const [status,setStatus]=useState("Received");
 const [notes,setNotes]=useState("");
 const [editing,setEditing]=useState<number|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState(setupError??"");
 const [year,setYear]=useState("all");
 const [filter,setFilter]=useState("all");
 const years=Array.from(new Set(events.map(e=>e.event_date.slice(0,4)))).sort().reverse();
 const filtered=events.filter(e=>(year==="all"||e.event_date.startsWith(year))&&(filter==="all"||String(e.client_id)===filter));
 const firstMeetings=new Map<number,string>();
 for(const e of events.filter(e=>e.kind==="meeting").sort((a,b)=>a.event_date.localeCompare(b.event_date)))if(!firstMeetings.has(e.client_id))firstMeetings.set(e.client_id,e.event_date);
 const offers=filtered.filter(e=>e.kind==="offer");
 const offeredClients=new Set(offers.map(e=>e.client_id));
 const firstOffers=Array.from(offeredClients).map(id=>offers.filter(e=>e.client_id===id).sort((a,b)=>a.event_date.localeCompare(b.event_date))[0]);
 const durations=firstOffers.map(o=>firstMeetings.has(o.client_id)?days(firstMeetings.get(o.client_id)!,o.event_date):null).filter((n):n is number=>n!==null&&n>=0);
 const avg=durations.length?Math.round(durations.reduce((a,b)=>a+b,0)/durations.length):null;
 const selected=events.filter(e=>String(e.client_id)===clientId).sort((a,b)=>a.event_date.localeCompare(b.event_date));
 const clientName=(id:number)=>clients.find(c=>c.id===id)?.name??"Client";
 const db=useMemo(()=>createClient(),[]);
 async function save(e:React.FormEvent){e.preventDefault();if(!clientId||!date)return;setBusy(true);setError("");
 const payload={client_id:Number(clientId),kind,event_date:date,company:kind==="offer"?company.trim()||null:null,job_title:kind==="offer"?jobTitle.trim()||null:null,offer_status:kind==="offer"?status:null,notes:notes.trim()||null};
 const result=editing!==null?await db.from("jgo_client_statistics").update(payload).eq("id",editing).select().single():await db.from("jgo_client_statistics").insert(payload).select().single();
 if(result.error)setError(result.error.message);else{setEvents(prev=>editing===null?[...prev,result.data as Event]:prev.map(x=>x.id===editing?result.data as Event:x));reset();}setBusy(false);
 }
 function reset(){setEditing(null);setDate("");setCompany("");setJobTitle("");setStatus("Received");setNotes("");setKind("meeting");}
 function edit(e:Event){setClientId(String(e.client_id));setKind(e.kind as "meeting"|"offer");setDate(e.event_date);setCompany(e.company??"");setJobTitle(e.job_title??"");setStatus(e.offer_status??"Received");setNotes(e.notes??"");setEditing(e.id);window.scrollTo({top:0,behavior:"smooth"});}
 async function remove(id:number){if(!window.confirm("Delete this entry?"))return;setBusy(true);const {error}=await db.from("jgo_client_statistics").delete().eq("id",id);if(error)setError(error.message);else setEvents(prev=>prev.filter(x=>x.id!==id));setBusy(false);}
 const input="w-full rounded-xl border border-[#dce5d7] bg-white px-3 py-2.5 text-sm text-[#243128] outline-none focus:border-[#7c9974]";
 const card="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm";
 return <main className="min-w-0 bg-[#f7f8f3] p-4 pb-24 sm:p-8 lg:p-10"><div className="mx-auto max-w-6xl space-y-6"><div><p className="text-xs font-semibold uppercase tracking-widest text-[#70866a]">JGO Hire</p><h1 className="mt-1 text-3xl font-bold text-[#243128]">Statistics</h1><p className="mt-2 text-sm text-[#708075]">Track coaching sessions, multiple offers, and time to placement.</p></div>
 {error&&<div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Unable to save or load statistics: {error}</div>}
 <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[["Clients with offers",String(offeredClients.size)],["Total offers",String(offers.length)],["Average days to first offer",avg===null?"—":String(avg)],["Clients tracked",String(new Set(filtered.map(e=>e.client_id)).size)]].map(([label,value])=><div key={label} className={card}><div className="text-3xl font-bold text-[#3d4d39]">{value}</div><p className="mt-2 text-xs text-[#708075]">{label}</p></div>)}</div>
 <section className={card}><h2 className="mb-4 text-lg font-bold text-[#243128]">{editing===null?"Add activity":"Edit activity"}</h2><form onSubmit={save} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">JGO Hire contact<select className={input+" mt-1"} value={clientId} onChange={e=>{setClientId(e.target.value);reset()}} required><option value="">Select a client</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="text-sm font-medium">Activity<select className={input+" mt-1"} value={kind} onChange={e=>setKind(e.target.value as "meeting"|"offer")}><option value="meeting">Coaching meeting</option><option value="offer">Job offer</option></select></label><label className="text-sm font-medium">Date<input type="date" className={input+" mt-1"} value={date} onChange={e=>setDate(e.target.value)} required/></label>{kind==="offer"&&<label className="text-sm font-medium">Offer status<select className={input+" mt-1"} value={status} onChange={e=>setStatus(e.target.value)}><option>Received</option><option>Accepted</option><option>Declined</option></select></label>}{kind==="offer"&&<><label className="text-sm font-medium">Company<input className={input+" mt-1"} value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company name"/></label><label className="text-sm font-medium">Job title<input className={input+" mt-1"} value={jobTitle} onChange={e=>setJobTitle(e.target.value)} placeholder="Optional"/></label></>}</div><label className="block text-sm font-medium">Notes (optional)<textarea className={input+" mt-1"} rows={2} value={notes} onChange={e=>setNotes(e.target.value)}/></label><div className="flex gap-3"><button disabled={busy||!!setupError} className="rounded-xl bg-[#526b4b] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy?"Saving…":editing===null?"Save activity":"Save changes"}</button>{editing!==null&&<button type="button" onClick={reset} className="rounded-xl border px-4 text-sm">Cancel</button>}</div></form></section>
 <section className={card}><h2 className="mb-4 text-lg font-bold">Client timeline</h2><p className="mb-3 text-xs text-[#708075]">Select a contact above to review and edit their meetings and offers.</p><div className="space-y-2">{selected.length?selected.map(e=><div key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e6ebe2] p-3"><div><p className="font-semibold text-[#243128]">{e.kind==="meeting"?"Coaching meeting":`Offer: ${e.company||"Company not entered"}`}</p><p className="text-xs text-[#708075]">{fmt(e.event_date)}{e.job_title?` · ${e.job_title}`:""}{e.offer_status?` · ${e.offer_status}`:""}</p>{e.notes&&<p className="mt-1 text-xs">{e.notes}</p>}</div><div className="flex gap-2"><button onClick={()=>edit(e)} className="rounded-lg border px-3 py-1.5 text-xs">Edit</button><button disabled={busy} onClick={()=>remove(e.id)} className="rounded-lg border px-3 py-1.5 text-xs text-red-700">Delete</button></div></div>):<p className="text-sm text-[#708075]">No activities recorded for this client yet.</p>}</div></section>
 <section className={card}><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold">Offer results</h2><div className="flex gap-2"><select aria-label="Year" className={input} value={year} onChange={e=>setYear(e.target.value)}><option value="all">All years</option>{years.map(y=><option key={y}>{y}</option>)}</select><select aria-label="Client filter" className={input} value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All clients</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead><tr className="border-b text-[#708075]"><th className="py-3">Client</th><th>Company</th><th>Offer date</th><th>Status</th><th>Days from first meeting</th></tr></thead><tbody>{offers.sort((a,b)=>b.event_date.localeCompare(a.event_date)).map(o=><tr key={o.id} className="border-b border-[#edf0ea]"><td className="py-3 font-medium">{clientName(o.client_id)}</td><td>{o.company||"—"}</td><td>{fmt(o.event_date)}</td><td>{o.offer_status||"Received"}</td><td>{firstMeetings.has(o.client_id)?Math.max(0,days(firstMeetings.get(o.client_id)!,o.event_date))+" days":"—"}</td></tr>)}</tbody></table>{!offers.length&&<p className="py-6 text-sm text-[#708075]">No offers recorded for this selection.</p>}</div></section></div></main>;
}
