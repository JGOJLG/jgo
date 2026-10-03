import { createClient } from "@/lib/supabase-server";
import JgoJobAdmin from "./JgoJobAdmin";

export const dynamic="force-dynamic";
export const revalidate=0;

export default async function JgoJobPage(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return null;
 const {data:admin}=await supabase.rpc("is_jgo_os_admin");
 if(!admin)return <section className="min-w-0 flex-1 bg-[#f7f8f3] p-6 lg:p-10"><div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700"><h1 className="text-xl font-bold">Admin access required</h1><p className="mt-2 text-sm">This area is limited to JGO OS administrators.</p></div></section>;
 const [{data,error},{data:analytics,error:analyticsError},{data:attribution,error:attributionError},{data:deep,error:deepError},{data:sourceQuality,error:sourceQualityError}]=await Promise.all([supabase.rpc("jgojob_admin_overview"),supabase.rpc("jgojob_analytics_summary"),supabase.rpc("jgojob_analytics_attribution"),supabase.rpc("jgojob_deep_analytics"),supabase.rpc("jgojob_source_quality")]);
 if(error)return <section className="min-w-0 flex-1 bg-[#f7f8f3] p-6 lg:p-10"><div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700"><h1 className="text-xl font-bold">JGOJob could not be loaded</h1><p className="mt-2 text-sm">{error.message}</p></div></section>;
 return <JgoJobAdmin initialUsers={data||[]} initialAnalytics={analyticsError?null:analytics} initialAttribution={attributionError?[]:attribution||[]} initialDeep={deepError?null:deep} initialSourceQuality={sourceQualityError?[]:sourceQuality||[]}/>;
}
