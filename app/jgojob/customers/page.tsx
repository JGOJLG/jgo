import Link from "next/link";
import {createClient} from "@/lib/supabase-server";
import CustomerCRM,{type Customer} from "./CustomerCRM";
export const dynamic="force-dynamic";
export const revalidate=0;
export default async function CustomersPage(){
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)return null;
 const {data:admin,error:authError}=await db.rpc("is_jgo_os_admin");
 if(authError||!admin)return <section className="flex-1 p-8 text-red-700">Admin access required.</section>;
 const {data,error}=await db.rpc("jgojob_customer_crm");
 if(error)return <section className="flex-1 p-8 text-red-700">Customer CRM unavailable: {error.message}</section>;
 return <div className="min-w-0 flex-1"><div className="px-5 pt-6 lg:px-9"><Link href="/jgojob" className="text-sm font-semibold text-[#587254]">← Back to Dashboard</Link></div><CustomerCRM initialCustomers={(Array.isArray(data)?data:[]) as Customer[]}/></div>;
}