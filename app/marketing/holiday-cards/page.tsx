import Link from "next/link";
import {createClient} from "@/lib/supabase-server";
import HolidayCards from "./HolidayCards";
export const dynamic="force-dynamic";
export default async function HolidayCardsPage(){
 const db=await createClient();
 const {data,error}=await db.from("clients").select("id,name,email,company,status,client_type,parent_name,parent_email").order("name");
 const {data:leads, error:leadError}=await db.from("intake_calls").select("id,name,email,status,converted_to_client,archived_at").order("name");
 return <><div className="bg-[#f7f8f3] px-5 pt-5 sm:px-10"><Link href="/marketing" className="text-sm font-semibold text-[#526b4b]">← All Marketing</Link></div><HolidayCards clients={(data??[]).map(c=>({id:Number(c.id),name:c.name??"",email:c.email??"",company:c.company??"",status:c.status??"",clientType:c.client_type??"",parentName:c.parent_name??"",parentEmail:c.parent_email??""}))} leads={(leads??[]).filter(l=>!l.converted_to_client).map(l=>({id:Number(l.id),name:l.name??"",email:l.email??"",company:"",status:l.status??"",clientType:"Lead",parentName:"",parentEmail:""}))} loadError={error?.message??leadError?.message??null}/></>;
}
