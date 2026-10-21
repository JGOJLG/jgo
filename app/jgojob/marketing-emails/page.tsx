import {createClient} from "@/lib/supabase-server";
import {createClient as createAdminClient} from "@supabase/supabase-js";
import MarketingEmailList from "./MarketingEmailList";

export const dynamic="force-dynamic";
export const revalidate=0;

type Subscriber={email:string;name:string;consentedAt:string;optedIn:boolean;signupAt:string};
export default async function MarketingEmailsPage(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return null;
 const {data:isAdmin}=await supabase.rpc("is_jgo_os_admin");
 if(!isAdmin)return <main className="p-8">Admin access required.</main>;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.NEXT_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return <main className="p-8">Marketing list unavailable. Server connection not configured.</main>;
 const admin=createAdminClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const subscribers:Subscriber[]=[];
 let page=1;
 while(page<=20){
  const {data,error}=await admin.auth.admin.listUsers({page,perPage:1000});
  if(error)return <main className="p-8">Unable to load subscribers. {error.message}</main>;
  for(const entry of data.users){
   const m=entry.user_metadata||{};
   if(m.app_source!=="jgo_job"||!entry.email)continue;
   subscribers.push({email:entry.email,name:[m.first_name,m.last_name].filter(Boolean).join(" "),consentedAt:m.marketing_email_opt_in_at||"",optedIn:m.marketing_email_opt_in===true,signupAt:entry.created_at});
  }
  if(data.users.length<1000)break;
  page++;
 }
 subscribers.sort((a,b)=>b.signupAt.localeCompare(a.signupAt));
 return <MarketingEmailList subscribers={subscribers}/>;
}
