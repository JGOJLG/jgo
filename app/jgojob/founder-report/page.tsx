import { createClient } from "@/lib/supabase-server";
export const dynamic = "force-dynamic";
export const revalidate = 0;
type Row = Record<string, unknown>;
function startOfWeek(offsetWeeks:number){const d=new Date();const day=(d.getUTCDay()+6)%7;d.setUTCDate(d.getUTCDate()-day+offsetWeeks*7);d.setUTCHours(0,0,0,0);return d.toISOString()}
export default async function FounderReport(){
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)return <main><h1>Sign in required</h1></main>;
 const {data:isAdmin,error:adminError}=await db.rpc('is_jgo_os_admin');
 if(adminError||!isAdmin)return <main><h1>Admin access required</h1></main>;
 const thisWeek=startOfWeek(-1),previousWeek=startOfWeek(-2),end=startOfWeek(0);
 const metrics=[["New signups","jgojob_profiles","created_at"],["Jobs added","jgojob_jobs","created_at"],["Interviews created","jgojob_interviews","created_at"],["Outreach messages","jgojob_messages","created_at"],["Reported errors","jgojob_system_errors","created_at"],["Analytics events","jgojob_analytics_events","created_at"]] as const;
 const rows=await Promise.all(metrics.map(async ([label,table,date])=>{
  const [current,prior]=await Promise.all([db.from(table).select("*",{head:true,count:"exact"}).gte(date,thisWeek).lt(date,end),db.from(table).select("*",{head:true,count:"exact"}).gte(date,previousWeek).lt(date,thisWeek)]);
  return {label,current:current.count,prior:prior.count,error:current.error?.message||prior.error?.message||null};
 }));
 const {data:sources,error:sourceError}=await db.from("jgojob_profiles").select("utm_source").gte("created_at",thisWeek).lt("created_at",end).limit(5000);
 const bySource=new Map<string,number>();
 for(const r of (sources||[]) as Row[]){const key=String(r.utm_source||"Direct / unattributed").trim()||"Direct / unattributed";bySource.set(key,(bySource.get(key)||0)+1)}
 const sorted=[...bySource.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8);
 return <main style={{maxWidth:900,margin:"2rem auto",padding:"1.5rem",fontFamily:"Arial,sans-serif",color:"#173e32"}}>
 <a href="/jgojob">Back to JGO Job admin</a><h1>Weekly Founder Report</h1>
 <p>Reporting period: {thisWeek.slice(0,10)} through {new Date(new Date(end).getTime()-86400000).toISOString().slice(0,10)} (UTC). Previous-week comparisons use the preceding seven days.</p>
 <h2>Growth and product activity</h2>
 <table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><th align="left">Metric</th><th>Last week</th><th>Previous</th><th>Change</th></tr></thead><tbody>
 {rows.map(r=><tr key={r.label}><td style={{padding:"12px 4px",borderBottom:"1px solid #ddd"}}>{r.label}</td><td align="center">{r.error?"Unavailable":r.current}</td><td align="center">{r.error?"Unavailable":r.prior}</td><td align="center">{r.error?"—":(r.current||0)-(r.prior||0)}</td></tr>)}
 </tbody></table>
 <h2>Signup acquisition channels</h2>{sourceError?<p>Attribution data unavailable: {sourceError.message}</p>:sorted.length?<ol>{sorted.map(([source,count])=><li key={source}>{source}: {count} signups</li>)}</ol>:<p>No attributed signups recorded in this period.</p>}
 <h2>Revenue and premium conversions</h2><p>Not yet connected to verified Stripe revenue data. Do not treat subscription events as recognized revenue.</p>
 <h2>Founder priorities</h2><p>Review the largest negative changes above, investigate product errors, and prioritize the strongest acquisition channel. Confirm three priorities manually based on the results.</p>
 <p style={{fontSize:12,color:"#555"}}>Counts are based on existing Supabase tables and require authorized admin access. This report does not include payment processing totals or external platform analytics.</p>
 </main>
}
