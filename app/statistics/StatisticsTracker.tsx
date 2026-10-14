"use client";
import {useMemo,useState} from "react";
import {createClient} from "@/lib/supabase-browser";
type Client={id:number;name:string;status:string};
type Event={id:number;client_id:number;kind:string;event_date:string;company:string|null;job_title:string|null;offer_status:string|null;notes:string|null};
type DraftOffer={date:string;company:string;title:string;status:string};
const dayDiff=(a:string,b:string)=>Math.round((Date.parse(b+"T12:00:00Z")-Date.parse(a+"T12:00:00Z"))/86400000);
const fmt=(d:string)=>new Date(d+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
const field="w-full rounded-xl border border-[#dce5d7] bg-white px-3 py-2.5 text-sm text-[#243128] focus:outline-none focus:border-[#708c67]";
const panel="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm";
export default function StatisticsTracker({clients,initialEvents,setupError}:{clients:Client[];initialEvents:Event[];setupError:string|null}){
 const db=useMemo(()=>createClient(),[]);
 const [events,setEvents]=useState<Event[]>(initialEvents);
 const [clientId,setClientId]=useState("");
 const [meetings,setMeetings]=useState<string[]>([""]);
 const [offers,setOffers]=useState<DraftOffer[]>([{date:"",company:"",title:"",status:"Received"}]);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState(setupError??"");
 const [year,setYear]=useState("all");
 const [filter,setFilter]=useState("all");
 const [editId,setEditId]=useState<number|null>(null);
 const [editDate,setEditDate]=useState("");
 const [editCompany,setEditCompany]=useState("");
 const [editTitle,setEditTitle]=useState("");
 const [editStatus,setEditStatus]=useState("Received");
 const clientName=(id:number)=>clients.find(c=>c.id===id)?.name??"Client";
 const selected=events.filter(e=>String(e.client_id)===clientId).sort((a,b)=>a.event_date.localeCompare(b.event_date));
 const firstMeetings=new Map<number,string>();
 events.filter(e=>e.kind==="meeting").sort((a,b)=>a.event_date.localeCompare(b.event_date)).forEach(e=>{if(!firstMeetings.has(e.client_id))firstMeetings.set(e.client_id,e.event_date)});
 const meetingDates=(id:number,offerDate:string)=>events.filter(e=>e.client_id===id&&e.kind==="meeting"&&e.event_date<=offerDate).map(e=>e.event_date).sort();
 const daysFromFirst=(o:Event)=>{const dates=meetingDates(o.client_id,o.event_date);return dates.length?dayDiff(dates[0],o.event_date):null};
 const daysFromLast=(o:Event)=>{const dates=meetingDates(o.client_id,o.event_date);return dates.length?dayDiff(dates[dates.length-1],o.event_date):null};
 const years=Array.from(new Set(events.map(e=>e.event_date.slice(0,4)))).sort().reverse();
 const filtered=events.filter(e=>(year==="all"||e.event_date.startsWith(year))&&(filter==="all"||String(e.client_id)===filter));
 const filteredOffers=filtered.filter(e=>e.kind==="offer");
 const offerClients=new Set(filteredOffers.map(e=>e.client_id));
 const firstOffers=Array.from(offerClients).map(id=>filteredOffers.filter(e=>e.client_id===id).sort((a,b)=>a.event_date.localeCompare(b.event_date))[0]);
 const durations=firstOffers.map(o=>firstMeetings.has(o.client_id)?dayDiff(firstMeetings.get(o.client_id)!,o.event_date):null).filter((n):n is number=>n!==null&&n>=0);
 const dashboardOffers=filteredOffers.filter(o=>daysFromFirst(o)!==null);
 const firstValues=dashboardOffers.map(o=>daysFromFirst(o) as number);
 const lastValues=dashboardOffers.map(o=>daysFromLast(o) as number);
 const avg=(v:number[])=>v.length?Math.round(v.reduce((a,b)=>a+b,0)/v.length):null;
 const median=(v:number[])=>{if(!v.length)return null;const a=[...v].sort((x,y)=>x-y);return Math.round((a[Math.floor((a.length-1)/2)]+a[Math.floor(a.length/2)])/2)};
 const clientIds=new Set(filtered.map(e=>e.client_id));
 const clientsWithMeeting=new Set(filtered.filter(e=>e.kind==="meeting").map(e=>e.client_id));
 const accepted=filteredOffers.filter(e=>e.offer_status==="Accepted");
 const offerMonths=Array.from({length:12},(_,i)=>({name:new Date(2026,i,1).toLocaleString("en-US",{month:"short"}),count:filteredOffers.filter(e=>Number(e.event_date.slice(5,7))===i+1).length}));
 const maxMonth=Math.max(1,...offerMonths.map(m=>m.count));
 const average=durations.length?Math.round(durations.reduce((a,b)=>a+b,0)/durations.length):null;
 const addMeeting=()=>setMeetings(v=>[...v,""]);
 const addOffer=()=>setOffers(v=>[...v,{date:"",company:"",title:"",status:"Received"}]);
 async function saveAll(e:React.FormEvent){e.preventDefault();if(!clientId)return;const dates=meetings.filter(Boolean);const validOffers=offers.filter(o=>o.date);if(!dates.length&&!validOffers.length){setError("Add at least one meeting or offer date.");return}
 setSaving(true);setError("");
 const rows=[...dates.map(d=>({client_id:Number(clientId),kind:"meeting",event_date:d,company:null,job_title:null,offer_status:null,notes:null})),...validOffers.map(o=>({client_id:Number(clientId),kind:"offer",event_date:o.date,company:o.company.trim()||null,job_title:o.title.trim()||null,offer_status:o.status,notes:null}))];
 const {data,error:saveError}=await db.from("jgo_client_statistics").insert(rows).select("id,client_id,kind,event_date,company,job_title,offer_status,notes");
 if(saveError)setError(saveError.message);else{setEvents(prev=>[...prev,...((data??[]) as Event[])]);setMeetings([""]);setOffers([{date:"",company:"",title:"",status:"Received"}]);}
 setSaving(false);
 }
 function startEdit(e:Event){setEditId(e.id);setEditDate(e.event_date);setEditCompany(e.company??"");setEditTitle(e.job_title??"");setEditStatus(e.offer_status??"Received")}
 async function saveEdit(){if(editId===null||!editDate)return;const original=events.find(e=>e.id===editId);if(!original)return;setSaving(true);setError("");const {data,error:saveError}=await db.from("jgo_client_statistics").update({event_date:editDate,company:original.kind==="offer"?editCompany||null:null,job_title:original.kind==="offer"?editTitle||null:null,offer_status:original.kind==="offer"?editStatus:null}).eq("id",editId).select().single();if(saveError)setError(saveError.message);else{setEvents(prev=>prev.map(e=>e.id===editId?data as Event:e));setEditId(null)}setSaving(false)}
 async function remove(id:number){if(!window.confirm("Delete this entry?"))return;setSaving(true);setError("");const {error:deleteError}=await db.from("jgo_client_statistics").delete().eq("id",id);if(deleteError)setError(deleteError.message);else setEvents(prev=>prev.filter(e=>e.id!==id));setSaving(false)}
 return <main className="min-w-0 bg-[#f7f8f3] p-4 pb-24 sm:p-8 lg:p-10"><div className="mx-auto max-w-6xl space-y-6"><div><p className="text-xs font-semibold uppercase tracking-widest text-[#70866a]">JGO Hire</p><h1 className="mt-1 text-3xl font-bold text-[#243128]">Statistics</h1><p className="mt-2 text-sm text-[#708075]">Select a client, add all the days you met, then add any offer dates.</p></div>
 {error&&<div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
 <form onSubmit={saveAll} className={panel+" space-y-6"}><h2 className="text-lg font-bold text-[#243128]">Client results</h2>
 <div><label htmlFor="stat-client" className="mb-2 block text-sm font-semibold">1. Select client</label><select id="stat-client" required className={field} value={clientId} onChange={e=>setClientId(e.target.value)}><option value="">Select a JGO Hire contact</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
 <div className="border-t border-[#e8ede4] pt-5"><div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-sm font-semibold">2. Days we met</h3><button type="button" onClick={addMeeting} className="rounded-xl border border-[#cad8c4] px-3 py-2 text-xs font-semibold text-[#526b4b]">+ Add another meeting</button></div><div className="grid gap-3 sm:grid-cols-2">{meetings.map((d,i)=><div key={i} className="flex items-center gap-2"><input aria-label={`Meeting date ${i+1}`} type="date" className={field} value={d} onChange={e=>setMeetings(v=>v.map((x,j)=>i===j?e.target.value:x))}/>{meetings.length>1&&<button type="button" aria-label="Remove meeting date" onClick={()=>setMeetings(v=>v.filter((_,j)=>j!==i))} className="rounded-lg border px-3 py-2 text-sm">×</button>}</div>)}</div></div>
 <div className="border-t border-[#e8ede4] pt-5"><div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-sm font-semibold">3. Offer dates</h3><button type="button" onClick={addOffer} className="rounded-xl border border-[#cad8c4] px-3 py-2 text-xs font-semibold text-[#526b4b]">+ Add another offer</button></div><div className="space-y-3">{offers.map((o,i)=><div key={i} className="rounded-xl border border-[#e6ebe2] bg-[#fbfcfa] p-3"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold text-[#708075]">Offer {i+1}</span>{offers.length>1&&<button type="button" onClick={()=>setOffers(v=>v.filter((_,j)=>j!==i))} className="text-xs text-red-700">Remove</button>}</div><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs">Offer date<input type="date" className={field+" mt-1"} value={o.date} onChange={e=>setOffers(v=>v.map((x,j)=>i===j?{...x,date:e.target.value}:x))}/></label><label className="text-xs">Status<select className={field+" mt-1"} value={o.status} onChange={e=>setOffers(v=>v.map((x,j)=>i===j?{...x,status:e.target.value}:x))}><option>Received</option><option>Accepted</option><option>Declined</option></select></label><label className="text-xs">Company (optional)<input className={field+" mt-1"} value={o.company} onChange={e=>setOffers(v=>v.map((x,j)=>i===j?{...x,company:e.target.value}:x))}/></label><label className="text-xs">Job title (optional)<input className={field+" mt-1"} value={o.title} onChange={e=>setOffers(v=>v.map((x,j)=>i===j?{...x,title:e.target.value}:x))}/></label></div></div>)}</div></div>
 <button type="submit" disabled={saving||!clientId||!!setupError} className="rounded-xl bg-[#526b4b] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving?"Saving…":"Save client results"}</button></form>
 <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[["Clients with offers",String(offerClients.size)],["Total offers",String(filteredOffers.length)],["Average days to first offer",average===null?"—":String(average)],["Clients tracked",String(new Set(filtered.map(e=>e.client_id)).size)]].map(([label,value])=><div key={label} className={panel}><p className="text-3xl font-bold text-[#3d4d39]">{value}</p><p className="mt-2 text-xs text-[#708075]">{label}</p></div>)}</div>
 <section className={panel}><h2 className="mb-3 text-lg font-bold">Client timeline</h2>{!clientId?<p className="text-sm text-[#708075]">Select a client above to see their saved meetings and offers.</p>:selected.length===0?<p className="text-sm text-[#708075]">No saved activity for this client yet.</p>:<div className="space-y-2">{selected.map(e=><div key={e.id} className="rounded-xl border border-[#e6ebe2] p-3">{editId===e.id?<div className="space-y-3"><input type="date" className={field} value={editDate} onChange={v=>setEditDate(v.target.value)}/>{e.kind==="offer"&&<><input className={field} value={editCompany} placeholder="Company" onChange={v=>setEditCompany(v.target.value)}/><input className={field} value={editTitle} placeholder="Job title" onChange={v=>setEditTitle(v.target.value)}/><select className={field} value={editStatus} onChange={v=>setEditStatus(v.target.value)}><option>Received</option><option>Accepted</option><option>Declined</option></select></>}<div className="flex gap-2"><button disabled={saving} onClick={saveEdit} className="rounded-lg bg-[#526b4b] px-3 py-2 text-xs text-white">Save</button><button onClick={()=>setEditId(null)} className="rounded-lg border px-3 py-2 text-xs">Cancel</button></div></div>:<div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold">{e.kind==="meeting"?"Coaching meeting":`Offer · ${e.company||"Company not entered"}`}</p><p className="text-xs text-[#708075]">{fmt(e.event_date)}{e.offer_status?` · ${e.offer_status}`:""}{e.job_title?` · ${e.job_title}`:""}</p></div><div className="flex gap-2"><button onClick={()=>startEdit(e)} className="rounded-lg border px-3 py-1.5 text-xs">Edit</button><button disabled={saving} onClick={()=>remove(e.id)} className="rounded-lg border px-3 py-1.5 text-xs text-red-700">Delete</button></div></div>}</div>)}</div>}</section>
 <section className={panel}><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold">Offer results</h2><div className="flex gap-2"><select aria-label="Year filter" className={field} value={year} onChange={e=>setYear(e.target.value)}><option value="all">All years</option>{years.map(y=><option key={y}>{y}</option>)}</select><select aria-label="Client filter" className={field} value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All clients</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead><tr className="border-b text-[#708075]"><th className="py-3">Client</th><th>Company</th><th>Offer date</th><th>Status</th><th>Days from first meeting</th><th>Days from last meeting</th></tr></thead><tbody>{filteredOffers.sort((a,b)=>b.event_date.localeCompare(a.event_date)).map(o=><tr key={o.id} className="border-b border-[#edf0ea]"><td className="py-3 font-medium">{clientName(o.client_id)}</td><td>{o.company||"—"}</td><td>{fmt(o.event_date)}</td><td>{o.offer_status||"Received"}</td><td>{daysFromFirst(o)!==null?daysFromFirst(o)+" days":"—"}</td><td>{daysFromLast(o)!==null?daysFromLast(o)+" days":"—"}</td></tr>)}</tbody></table>{filteredOffers.length===0&&<p className="py-5 text-sm text-[#708075]">No offers recorded yet.</p>}</div></section>
 <section className="space-y-5"><div><h2 className="text-2xl font-bold text-[#243128]">JGO Hire impact dashboard</h2><p className="mt-1 text-sm text-[#708075]">Real results from recorded coaching meetings and offers. Uses the year and client filters above.</p></div>
 <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[
 ["Average days · first meeting to offer",avg(firstValues),"Offers with a prior meeting"],
 ["Average days · last meeting to offer",avg(lastValues),"Offers with a prior meeting"],
 ["Median days · first meeting to offer",median(firstValues),"Less affected by outliers"],
 ["Median days · last meeting to offer",median(lastValues),"Less affected by outliers"],
 ["Clients with recorded meetings",clientsWithMeeting.size,"Within selected filters"],
 ["Clients with recorded offers",offerClients.size,"Within selected filters"],
 ["Offers marked accepted",accepted.length,"Not necessarily job starts"],
 ["Offers per offer recipient",offerClients.size?(filteredOffers.length/offerClients.size).toFixed(1):null,"Multiple offers counted"]
 ].map(([label,value,note])=><div key={String(label)} className={panel}><p className="text-3xl font-bold text-[#3d4d39]">{value??"—"}</p><p className="mt-2 text-sm font-semibold text-[#243128]">{label}</p><p className="mt-1 text-xs text-[#708075]">{note}</p></div>)}</div>
 <div className="grid gap-5 lg:grid-cols-2"><div className={panel}><h3 className="mb-4 text-lg font-bold">Offers by month</h3><div className="space-y-2">{offerMonths.map(m=><div key={m.name} className="flex items-center gap-3 text-xs"><span className="w-9 text-[#708075]">{m.name}</span><div className="h-3 flex-1 overflow-hidden rounded-full bg-[#edf1e9]"><div className="h-full rounded-full bg-[#7b9b70]" style={{width:(m.count/maxMonth*100)+"%"}}/></div><span className="w-6 text-right font-semibold">{m.count}</span></div>)}</div></div>
 <div className={panel}><h3 className="mb-3 text-lg font-bold">Outcome breakdown</h3><div className="space-y-3">{["Received","Accepted","Declined"].map(status=><div key={status} className="flex items-center justify-between rounded-xl bg-[#f7f8f3] px-4 py-3 text-sm"><span>{status}</span><strong>{filteredOffers.filter(o=>(o.offer_status||"Received")===status).length}</strong></div>)}</div><p className="mt-4 text-xs text-[#708075]">Status reflects the latest information entered for each offer.</p></div></div>
 <div className={panel}><h3 className="text-lg font-bold">Reporting context</h3><p className="mt-2 text-sm text-[#708075]">{dashboardOffers.length} of {filteredOffers.length} offers have a meeting on or before the offer date and can be included in time-to-offer metrics. {clientIds.size} clients have activity in this filter. These are descriptive results for your recorded clients, not a verified job-placement rate or proof that coaching caused an offer. An offer is not necessarily a job start.</p></div></section></div></main>;
}
