import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import TemplateManager from "./TemplateManager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Template = { id:number; name:string; subject:string; body:string };

export default async function EmailTemplatesPage(){
  const supabase = await createClient();
  const { data, error } = await supabase.from("email_templates").select("id,name,subject,body").order("created_at",{ascending:true});
  return <section className="min-h-screen bg-[#f7f8f3] text-[#243128]">
    <header className="border-b border-[#dfe6db] bg-[#fbfaf6] px-6 py-7 lg:px-10">
      <Link href="/email" className="text-sm font-semibold text-[#647d5b]">← Back to Email Hub</Link>
      <div className="mt-4">
        <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#8aa080]">JGO OS</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Edit Email Templates</h1>
        <p className="mt-2 text-sm text-[#708075]">Edit saved template names, subjects, content, buttons, and formatting.</p>
      </div>
    </header>
    <div className="mx-auto max-w-7xl p-6 lg:p-10">
      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error.message}</div> : <TemplateManager initialTemplates={(data??[]) as Template[]}/>} 
    </div>
  </section>
}
