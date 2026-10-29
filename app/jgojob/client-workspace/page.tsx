import Link from "next/link";
import {createClient} from "@/lib/supabase-server";
export const dynamic="force-dynamic";
export default async function Page(){
 const sb=await createClient();
 const {data:{user}}=await sb.auth.getUser();
 if(!user)return <main className="p-6">Please sign in to JGO OS.</main>;
 const {data:admin}=await sb.rpc("is_jgo_os_admin");
 if(!admin)return <main className="p-6">Admin access required.</main>;
 const {data,error}=await sb.rpc("jgojob_admin_overview");
 if(error)return <main className="p-6">Unable to load clients: {error.message}</main>;
 return <main className="min-w-0 flex-1 bg-[#f7f8f3] p-4 lg:p-9"><Link href="/jgojob" className="text-sm underline">Back to JGO Job</Link><h1 className="my-4 text-2xl font-bold text-[#294b36]">Client Workspace</h1><p className="mb-5 text-sm text-[#728174]">Your JGO Job customers. Their trackers remain private until they grant Live Assist access.</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{(data||[]).map((c:{user_id:string;email:string})=><Link key={c.user_id} href={"/jgojob/client-workspace/"+c.user_id} className="rounded-xl border border-[#dce5d8] bg-white p-5 text-sm text-[#294b36]"><span className="block break-all font-semibold">{c.email}</span><span className="mt-2 block text-xs text-[#748575]">Open customer workspace</span></Link>)}</div></main>;
}