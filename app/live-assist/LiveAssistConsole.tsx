"use client";
import {useEffect,useState} from "react";
import {createBrowserClient} from "@supabase/ssr";
type Session={session_id:string;owner_id:string;permission:"view"|"edit";status:string;expires_at:string};
type Job={id:string;company:string;title:string;location:string;status:string;notes:string};
export default function LiveAssistConsole(){
 const [db]=useState(()=>createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!));
 const [sessions,setSessions]=useState<Session[]>([]),[selected,setSelected]=useState<Session|null>(null),[jobs,setJobs]=useState<Job[]>([]),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 const refresh=async()=>{const {data,error}=await db.rpc("jgojob_live_assist_admin_sessions");if(error)setError(error.message);else{setSessions(data||[]);if(selected&&!data?.some((s:Session)=>s.session_id===selected.session_id&&s.status==="active")){setSelected(null);setJobs([])}}};
 const load=async(s:Session)=>{const {data,error}=await db.rpc("jgojob_live_assist_read_jobs",{p_session:s.session_id});if(error)setError(error.message);else{setSelected(s);setJobs(data||[])}};
 useEffect(()=>{void refresh();const timer=setInterval(()=>{void refresh();if(selected)void load(selected)},5000);return()=>clearInterval(timer)},[db,selected?.session_id]);
 const start=async(s:Session)=>{setBusy(true);const {data,error}=await db.rpc("jgojob_live_assist_start",{p_session:s.session_id});if(error||!data)setError(error?.message||"Unable to start session");else await load({...s,status:"active"});await refresh();setBusy(false)};
 const save=async(j:Job,field:"company"|"title"|"location"|"status"|"notes",value:string)=>{if(!selected||selected.permission!=="edit")return;const {data,error}=await db.rpc("jgojob_live_assist_write_job",{p_session:selected.session_id,p_job:j.id,p_field:field,p_value:value});if(error||!data)setError(error?.message||"Change not saved");else await load(selected)};
 return <main style={{maxWidth:1200,margin:"40px auto",padding:24,fontFamily:"Arial,sans-serif"}}>
 <h1>JGO Job Live Assist</h1><p>Customers must request access. Sessions expire automatically. View-only sessions cannot be edited.</p>
 {error&&<p role="alert" style={{color:"#a22"}}>{error}</p>}
 <button onClick={()=>void refresh()}>Refresh requests</button>
 <div style={{display:"grid",gridTemplateColumns:"minmax(240px,1fr) minmax(0,3fr)",gap:24,marginTop:20}}>
 <section><h2>Assistance requests</h2>{sessions.length===0&&<p>No active requests.</p>}
 {sessions.map(s=><article key={s.session_id} style={{padding:12,border:"1px solid #ddd",borderRadius:8,marginBottom:10}}>
 <strong>{s.permission==="edit"?"View & edit":"View only"}</strong><p style={{fontSize:12}}>User: {s.owner_id.slice(0,8)} · {s.status}</p>
 <button disabled={busy} onClick={()=>void(s.status==="requested"?start(s):load(s))}>{s.status==="requested"?"Accept request":"Open tracker"}</button></article>)}</section>
 <section><h2>{selected?"Customer tracker":"Select a session"}</h2>
 {selected&&<><p>{selected.permission==="edit"?"Editing permitted":"View only"} · Expires {new Date(selected.expires_at).toLocaleString()}</p>
 <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Company","Title","Location","Status","Notes"].map(x=><th key={x} style={{textAlign:"left",padding:8}}>{x}</th>)}</tr></thead><tbody>
 {jobs.map(j=><tr key={j.id}>{(["company","title","location","status","notes"] as const).map(field=><td key={field} style={{borderTop:"1px solid #ddd",padding:6}}>{selected.permission==="edit"?<input aria-label={field} defaultValue={j[field]||""} key={j.id+field+j[field]} onBlur={e=>{if(e.target.value!==j[field])void save(j,field,e.target.value)}} style={{width:"100%",minWidth:100,padding:7}}/>:j[field]}</td>)}</tr>)}</tbody></table></div></>}
 </section></div></main>;
}