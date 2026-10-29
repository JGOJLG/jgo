import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase-server";
import {createClient as adminClient} from "@supabase/supabase-js";
export async function POST(req:Request){
 const sb=await createClient();
 const {data:{user}}=await sb.auth.getUser();
 if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const {data:admin}=await sb.rpc("is_jgo_os_admin");
 if(!admin)return NextResponse.json({error:"Forbidden"},{status:403});
 const body=await req.json().catch(()=>null);
 if(!body||typeof body.userId!=="string"||typeof body.email!=="string")return NextResponse.json({error:"Invalid request"},{status:400});
 const {data:check,error}=await sb.rpc("jgojob_admin_delete_preflight",{p_user:body.userId});
 if(error||!check?.allowed)return NextResponse.json({error:check?.reason||error?.message||"Not allowed"},{status:409});
 if(check.email.toLowerCase()!==body.email.trim().toLowerCase())return NextResponse.json({error:"Email mismatch"},{status:400});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Not configured"},{status:503});
 const service=adminClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:found,error:lookupError}=await service.auth.admin.getUserById(body.userId);
 if(lookupError||found.user?.email?.toLowerCase()!==check.email.toLowerCase())return NextResponse.json({error:"Account verification failed"},{status:409});
 const {error:failure}=await service.auth.admin.deleteUser(body.userId,false);
 if(failure)return NextResponse.json({error:failure.message},{status:409});
 return NextResponse.json({ok:true});
}