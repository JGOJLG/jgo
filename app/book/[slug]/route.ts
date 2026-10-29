import {NextResponse} from "next/server";
import {bookAttributionUrls} from "@/lib/book-attribution";
import {createClient} from "@/lib/supabase-server";
const AMAZON="https://www.amazon.com/dp/B0HL4GTJ5H";
export async function GET(_request:Request,{params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 if(slug==="jgo-job-footer"){
  try {
   const supabase=await createClient();
   const {error}=await supabase.from("jgo_book_link_clicks").insert({slug:"jgo-job-footer"});
   if(error) console.error("Book footer click tracking:",error.message);
  } catch(error){console.error("Book footer click tracking:",error);}
 }
 const destination=bookAttributionUrls[slug]??AMAZON;
 return NextResponse.redirect(destination,307);
}