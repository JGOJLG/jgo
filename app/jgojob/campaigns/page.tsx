import {createClient} from "@/lib/supabase-server";
import CampaignManager from "./CampaignManager";
export const dynamic="force-dynamic";
export default async function Page(){
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)return <main className="p-10">Sign in required.</main>;
 const {data:admin,error:authError}=await db.rpc("is_jgo_os_admin");
 if(authError||!admin)return <main className="p-10">Admin access required.</main>;
 const [{data:campaigns,error:campaignError},{data:profiles,error:profileError},{data:subscriptions,error:subscriptionError}]=await Promise.all([
 db.from("jgojob_marketing_campaigns").select("*").order("scheduled_for",{ascending:false,nullsFirst:false}).limit(500),
 db.from("jgojob_profiles").select("user_id,created_at,utm_campaign,utm_source,premium_status,stripe_subscription_id").limit(10000),
 db.from("jgojob_subscription_events").select("user_id,event_type,occurred_at,amount_paid").limit(10000)
 ]);
 return <CampaignManager initialCampaigns={campaigns||[]} profiles={profiles||[]} subscriptions={subscriptions||[]} loadError={campaignError?.message||profileError?.message||subscriptionError?.message||""}/>;
}
