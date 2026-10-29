"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import DeleteAccount from "./DeleteAccount";
type Client={user_id:string;email:string|null;first_name:string|null};
export default function ClientDirectory({clients}:{clients:Client[]}){
 const [search,setSearch]=useState("");
 const [deleted,setDeleted]=useState<string[]>([]);
 const filtered=useMemo(()=>clients.filter(c=>!deleted.includes(c.user_id)&&(c.first_name+" "+c.email).toLowerCase().includes(search.trim().toLowerCase())),[clients,search,deleted]);
 return <><div className="mb-5"><label htmlFor="client-search" className="mb-2 block text-sm font-semibold text-[#294b36]">Search clients by first name or email</label><input id="client-search" autoComplete="off" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or email..." className="w-full max-w-lg rounded-xl border border-[#cbdacb] bg-white px-4 py-3 text-base outline-none focus:border-[#678c71]"/><p className="mt-2 text-xs text-[#748575]">{filtered.length} of {clients.length-deleted.length} clients</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(c=><div key={c.user_id} className="flex flex-col rounded-xl border border-[#dce5d8] bg-white p-5"><Link href={"/jgojob/client-workspace/"+c.user_id} className="block text-sm text-[#294b36] hover:underline"><span className="block text-base font-semibold">{c.first_name||"Client"}</span><span className="mt-1 block break-all text-sm text-[#6b7c70]">{c.email||"No email"}</span><span className="mt-3 block text-sm text-[#748575]">Open customer workspace</span></Link><div className="mt-auto flex justify-end pt-2"><DeleteAccount id={c.user_id} email={c.email||""} onDeleted={()=>setDeleted(old=>[...old,c.user_id])}/></div></div>)}</div>{filtered.length===0&&<p className="rounded-xl border bg-white p-5 text-sm">No clients match that search.</p>}</>;
}