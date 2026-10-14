import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase-server";
import {Resend} from "resend";
export async function POST(request:Request){
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:"Please sign in."},{status:401});
 const body=await request.json().catch(()=>null);
 const {year,campaign,audience,recipients,subject,message,image_url}=body??{};
 if(!Number.isInteger(year)||year<2026||year>2036||!["thanksgiving","holidays","newyear"].includes(campaign)||!["clients","leads"].includes(audience)||!Array.isArray(recipients)||!recipients.length||recipients.length>50||typeof subject!=="string"||!subject.trim()||subject.length>200||typeof message!=="string"||!message.trim()||message.length>10000)return NextResponse.json({error:"Invalid email request (maximum 50 recipients per send)."},{status:400});
 if(!process.env.RESEND_API_KEY)return NextResponse.json({error:"Email service is not configured."},{status:503});
 const table=audience==="clients"?"clients":"intake_calls";
 const ids=recipients.map((r:{id:unknown})=>Number(r.id));
 if(ids.some((id:number)=>!Number.isSafeInteger(id)))return NextResponse.json({error:"Invalid recipients."},{status:400});
 const {data:contacts,error:lookupError}=await db.from(table).select(audience==="clients"?"id,email,parent_email":"id,email").in("id",ids);
 if(lookupError)return NextResponse.json({error:"Could not verify recipients."},{status:500});
 const valid=new Map((contacts??[]).map((c:any)=>[Number(c.id),[c.email,c.parent_email].filter(Boolean).map((x:string)=>x.trim().toLowerCase())]));
 const clean=recipients.map((r:{id:number;email:string})=>({id:Number(r.id),email:String(r.email??"").trim().toLowerCase()}));
 if(clean.some(r=>!valid.get(r.id)?.includes(r.email)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)))return NextResponse.json({error:"Some recipients are no longer valid. Refresh your list."},{status:400});
 const unique=[...new Map(clean.map(r=>[r.email,r])).values()];
 const {data:prior,error:historyError}=await db.from("jgo_holiday_card_log").select("contact_id,email").eq("year",year).eq("campaign",campaign).eq("audience",audience).in("contact_id",unique.map(r=>r.id));
 if(historyError)return NextResponse.json({error:"Unable to check send history. Nothing sent."},{status:500});
 const already=new Set((prior??[]).map(r=>r.contact_id+":"+r.email));
 const pending=unique.filter(r=>!already.has(r.id+":"+r.email));
 if(!pending.length)return NextResponse.json({sent:0,skipped:unique.length,errors:[]});
 const image=typeof image_url==="string"?image_url:"";
 const expected=process.env.NEXT_PUBLIC_SUPABASE_URL+"/storage/v1/object/public/jgo-holiday-images/";
 if(image&&(!image.startsWith(expected)||image.includes('"')||image.includes("<")||image.length>1500))return NextResponse.json({error:"Invalid card image URL."},{status:400});
 const escape=(x:string)=>x.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
 const html='<div style="max-width:600px;margin:auto;font-family:Arial,sans-serif;color:#344138">'+(image?'<img src="'+escape(image)+'" alt="Holiday card" style="width:100%;height:auto;display:block;border-radius:12px;margin-bottom:24px"/>':'')+'<div style="white-space:pre-wrap;font-size:16px;line-height:1.7">'+escape(message)+'</div></div>';
 const resend=new Resend(process.env.RESEND_API_KEY);
 const errors:string[]=[];let sent=0;
 for(const r of pending){
  const result=await resend.emails.send({from:process.env.RESEND_FROM_EMAIL||"JGO Hire <jen@jgohire.com>",to:[r.email],subject:subject.trim(),text:message,html});
  if(result.error){errors.push(r.email+": "+result.error.message);continue}
  const {error}=await db.from("jgo_holiday_card_log").upsert({year,campaign,audience,contact_id:r.id,email:r.email,sent_at:new Date().toISOString()},{onConflict:"year,campaign,audience,contact_id,email"});
  if(error)errors.push(r.email+": sent but tracking failed");else sent++;
 }
 return NextResponse.json({sent,skipped:unique.length-pending.length,errors});
}