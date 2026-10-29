import {createClient} from "@/lib/supabase-server";
import LiveAssistConsole from "./LiveAssistConsole";
export const dynamic="force-dynamic";
export default async function LiveAssistPage(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return <main style={{padding:32}}>Please sign in to JGO OS to access Live Assist.</main>;
 const {data:admin,error}=await supabase.rpc("jgojob_live_assist_is_admin");
 if(error||!admin)return <main style={{padding:32}}>Live Assist administrator access has not been enabled for this account.</main>;
 return <LiveAssistConsole/>;
}