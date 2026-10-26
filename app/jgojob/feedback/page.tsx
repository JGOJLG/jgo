import Link from "next/link";
import {createClient} from "@/lib/supabase-server";
import FeedbackAdmin from "./FeedbackAdmin";
export const dynamic="force-dynamic";
export const revalidate=0;
export default async function FeedbackAdminPage(){
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)return null;
 const {data:admin,error:authError}=await db.rpc("is_jgo_os_admin");
 if(authError||!admin)return <section className="flex-1 p-8 text-red-700">Admin access required.</section>;
 const [ideas,votes]=await Promise.all([db.from("jgojob_product_ideas").select("*").order("created_at",{ascending:false}),db.from("jgojob_product_votes").select("idea_id")]);
 const counts=new Map<string,number>();for(const vote of votes.data||[])counts.set(vote.idea_id,(counts.get(vote.idea_id)||0)+1);
 const data=(ideas.data||[]).map(i=>({...i,votes:counts.get(i.id)||0}));
 return <section className="min-w-0 flex-1 bg-[#f7f8f3] p-5 text-[#2d3c30] lg:p-9"><div className="mx-auto max-w-[1450px]"><Link href="/jgojob" className="text-sm font-semibold text-[#587254]">← Back to Dashboard</Link><p className="mt-6 text-[10px] font-bold uppercase tracking-[.2em] text-[#7f9975]">JGO JOB / PRODUCT</p><h1 className="mt-2 text-3xl font-bold">Product Feedback & Feature Requests</h1><p className="mt-2 text-sm text-[#708075]">Prioritize beta feedback by category, votes, impact and delivery status.</p>{ideas.error||votes.error?<p role="alert" className="mt-5 text-red-700">Feedback data could not be loaded.</p>:<FeedbackAdmin initialIdeas={data} supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL||""} supabaseKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||""}/>}</div></section>;
}
