"use client";
import {useEffect,useState} from "react";
import {createClient} from "@/lib/supabase-browser";
export function useBookLiveClicks(range:string){
 const [clicks,setClicks]=useState<Record<string,number>>({});
 const [error,setError]=useState("");
 const [lastUpdated,setLastUpdated]=useState<Date|null>(null);
 useEffect(()=>{
  let active=true;
  const load=async()=>{
   const supabase=createClient();
   let query=supabase.from("jgo_book_link_clicks").select("slug,created_at");
   if(range!=="all")query=query.gte("created_at",new Date(Date.now()-Number(range)*86400000).toISOString());
   const counts:Record<string,number>={};
   let from=0;
   let failed=false;
   while(active){
    const {data,error:fetchError}=await query.range(from,from+999);
    if(fetchError){failed=true;break;}
    for(const item of data??[])counts[item.slug]=(counts[item.slug]??0)+1;
    if(!data||data.length<1000)break;
    from+=1000;
   }
   if(!active)return;
   if(failed)setError("Live click data unavailable. Check owner access.");
   else{setClicks(counts);setError("");setLastUpdated(new Date());}
  };
  void load();
  const timer=setInterval(()=>{void load()},60000);
  return()=>{active=false;clearInterval(timer)};
 },[range]);
 return {clicks,error,lastUpdated};
}
