import { createClient } from "@/lib/supabase-server";
import StatisticsTracker from "./StatisticsTracker";
export const dynamic = "force-dynamic";
export default async function StatisticsPage() {
 const db = await createClient();
 const { data: clients, error } = await db.from("clients").select("id,name,status").order("name");
 if(error) return <main className="p-8 text-red-700">Unable to load JGO Hire contacts: {error.message}</main>;
 const {data: events,error:eventsError}=await db.from("jgo_client_statistics").select("id,client_id,kind,event_date,company,job_title,offer_status,notes").order("event_date",{ascending:true});
 return <StatisticsTracker clients={(clients??[]).map(c=>({id:Number(c.id),name:c.name??"Unnamed client",status:c.status??""}))} initialEvents={events??[]} setupError={eventsError?.message??null}/>;
}
