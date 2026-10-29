import Workspace from "./Workspace";
import Link from "next/link";
import {createClient} from "@/lib/supabase-server";
export const dynamic="force-dynamic";
export default async function Page({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const sb=await createClient();
 const {data:{user}}=await sb.auth.getUser();
 if(!user)return <main className="p-6">Please sign in to JGO OS.</main>;
 const {data:admin}=await sb.rpc("is_jgo_os_admin");
 if(!admin)return <main className="p-6">Admin access required.</main>;
 const {data:access,error}=await sb.rpc("jgojob_collab_access");
 if(error)return <main className="p-6">Unable to verify sharing permissions.</main>;
 const approved=(access||[]).find((a:{owner_id:string;permission:string})=>a.owner_id===id);
 return <main className="min-w-0 flex-1 bg-[#f7f8f3] p-4 lg:p-9"><Link href="/jgojob/client-workspace" className="text-sm underline">Back to clients</Link><h1 className="my-4 text-2xl font-bold text-[#294b36]">Client Workspace</h1>{!approved?<div className="rounded-xl border bg-white p-6"><h2 className="font-semibold">Customer approval required</h2><p className="mt-2 text-sm text-[#738273]">This customer must enable Live Assist in JGO Job before their tracker can be opened.</p></div>:<Workspace owner={id}/>}</main>;
}