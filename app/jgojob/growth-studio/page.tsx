import {createClient} from "@/lib/supabase-server";
import GrowthStudio from "./GrowthStudio";
export const dynamic="force-dynamic";
export default async function Page(){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if(!user)return <main className="p-10">Sign in required.</main>;
 const {data:admin,error:authError}=await db.rpc("is_jgo_os_admin");
 if(authError||!admin)return <main className="p-10">Admin access required.</main>;
 const [{data:items,error},{data:campaigns}]=await Promise.all([db.from("jgojob_growth_content").select("*").order("created_at",{ascending:false}).limit(1000),db.from("jgojob_marketing_campaigns").select("id,name").order("created_at",{ascending:false}).limit(500)]);
 return <GrowthStudio initialItems={items||[]} campaigns={campaigns||[]} loadError={error?.message||""}/>;
}
