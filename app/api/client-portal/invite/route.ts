import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

function escapeHtml(value:string){return value.replace(/[&<>"']/g,(ch)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]||ch));}

export async function POST(req:Request){
 try{
  const {clientId}=await req.json();
  const id=Number(clientId);
  if(!Number.isInteger(id)) return NextResponse.json({error:"Invalid client."},{status:400});

  const supabase=await createClient();
  const {data:client,error}=await supabase.from("clients").select("id,name,email,portal_user_id").eq("id",id).single();
  if(error||!client) return NextResponse.json({error:"Client not found."},{status:404});
  if(client.portal_user_id) return NextResponse.json({message:"This client already has portal access."});
  if(!client.email) return NextResponse.json({error:"Add an email address to the client before inviting them."},{status:400});

  const loginUrl=`https://www.jgohire.com/login?next=${encodeURIComponent("/client-portal")}&email=${encodeURIComponent(client.email)}`;
  const resendKey=process.env.RESEND_API_KEY;
  if(!resendKey) return NextResponse.json({error:"Email delivery is not configured."},{status:500});

  const firstName=String(client.name||"").trim().split(/\s+/)[0]||"there";
  const response=await fetch("https://api.resend.com/emails",{
   method:"POST",
   headers:{Authorization:`Bearer ${resendKey}`,"Content-Type":"application/json"},
   body:JSON.stringify({
    from:"JGO Hire <jen@jgohire.com>",
    to:[client.email],
    reply_to:"jen@jgohire.com",
    subject:"Your JGO Hire Client Portal is ready",
    html:`<div style="font-family:Arial,sans-serif;color:#223028;max-width:620px;margin:auto;padding:32px"><p style="font-size:12px;font-weight:700;letter-spacing:1.5px;color:#637a5b">JGO HIRE</p><h1 style="font-family:Georgia,serif;font-weight:500">Your client portal is ready.</h1><p>Hi ${escapeHtml(firstName)},</p><p>Your private JGO Hire portal is where you can access documents I share with you, career resources, and your personal job tracker.</p><p style="margin:28px 0"><a href="${loginUrl}" style="background:#4d6247;color:white;padding:14px 22px;border-radius:10px;text-decoration:none;font-weight:700">Open My Client Portal</a></p><p>Use <strong>${escapeHtml(client.email)}</strong>, the same JGO Hire member login used for your guides and resources.</p><hr style="border:0;border-top:1px solid #e4dfd6;margin:30px 0"><p style="line-height:1.6"><strong>Jennifer Gordon</strong><br>Career Coach + Recruiter<br>JGO Hire</p><p><a href="https://www.jgohire.com" style="color:#4d6247">JGO Hire</a> &nbsp; | &nbsp; <a href="https://www.linkedin.com/in/jennifergordon23" style="color:#4d6247">LinkedIn</a> &nbsp; | &nbsp; <a href="https://www.instagram.com/jgohired" style="color:#4d6247">Instagram</a></p></div>`
   })
  });
  if(!response.ok){const detail=await response.text();console.error("Portal invite email failed",detail);return NextResponse.json({error:"The invite email could not be sent."},{status:502});}
  return NextResponse.json({message:"Portal invite sent."});
 }catch(e){console.error(e);return NextResponse.json({error:"Unable to send portal invite."},{status:500});}
}
