import Link from "next/link";
import {createClient} from "@/lib/supabase-server";
import {createClient as createAdminClient} from "@supabase/supabase-js";
export const dynamic="force-dynamic";
export default async function RealityCheckPage(){
const db=await createClient();
const {data:{user}}=await db.auth.getUser();
if(!user)return null;
const {data:allowed}=await db.rpc("is_jgo_os_admin");
if(!allowed)return <main className="p-8">Admin access required.</main>;
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key)return <main className="p-8">Reporting configuration unavailable.</main>;
const admin=createAdminClient(url,key);
const {data,error}=await admin.from("jgojob_reality_check_responses").select("created_at,email,search_duration,application_count,follow_up_habit,search_stage,organization_level").order("created_at",{ascending:false}).limit(1000);
if(error)return <main className="p-8">Unable to load responses.</main>;
const labels=[["search_duration","Search duration"],["application_count","Applications"],["follow_up_habit","Follow-up"],["search_stage","Stage"],["organization_level","Organization"]] as const;
return <main className="min-w-0 flex-1 bg-[#f7f8f3] p-6 lg:p-10"><Link href="/jgojob" className="text-sm font-semibold text-[#315a3e]">← JGO Job</Link><h1 className="mt-6 text-3xl font-bold text-[#2f4234]">Job Search Reality Check</h1><p className="mt-2 text-sm text-[#748078]">{data?.length||0} completed responses</p><div className="mt-6 grid gap-4 lg:grid-cols-2">{labels.map(([field,label])=>{const counts=new Map<string,number>();(data||[]).forEach(r=>{const value=String(r[field]||"");counts.set(value,(counts.get(value)||0)+1)});return <section key={field} className="rounded-2xl border border-[#dfe6db] bg-white p-5"><h2 className="font-bold">{label}</h2>{Array.from(counts.entries()).sort((a,b)=>b[1]-a[1]).map(([value,n])=><div key={value} className="mt-3 text-sm"><div className="flex justify-between gap-3"><span>{value}</span><strong>{n}</strong></div><div className="mt-1 h-2 rounded-full bg-[#edf2e9]"><div className="h-2 rounded-full bg-[#729474]" style={{width:((n/(data?.length||1))*100)+"%"}}/></div></div>)}</section>})}</div><section className="mt-6 overflow-x-auto rounded-2xl border border-[#dfe6db] bg-white p-5"><h2 className="font-bold">Individual responses</h2><table className="mt-4 w-full min-w-[900px] text-left text-sm"><thead><tr><th className="p-2">Date</th><th className="p-2">Email</th>{labels.map(([field,label])=><th key={field} className="p-2">{label}</th>)}</tr></thead><tbody>{(data||[]).map((r,i)=><tr key={i} className="border-t"><td className="p-2">{new Date(r.created_at).toLocaleDateString()}</td><td className="p-2">{r.email||"Not captured"}</td>{labels.map(([field])=><td key={field} className="p-2">{r[field]}</td>)}</tr>)}</tbody></table></section></main>;
}