import {createClient} from "@/lib/supabase-server";
import HolidayCards from "./HolidayCards";
export const dynamic="force-dynamic";
export default async function MarketingPage(){
 const db=await createClient();
 const {data,error}=await db.from("clients").select("id,name,email,company,status,client_type,parent_name,parent_email").order("name");
 return <HolidayCards clients={(data??[]).map(c=>({id:Number(c.id),name:c.name??"",email:c.email??"",company:c.company??"",status:c.status??"",clientType:c.client_type??"",parentName:c.parent_name??"",parentEmail:c.parent_email??""}))} loadError={error?.message??null}/>;
}
