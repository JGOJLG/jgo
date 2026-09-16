"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AppSidebar from "@/components/AppSidebar";

type AppShellProps={children:React.ReactNode};
const pagesWithoutSidebar=["/login"];
const mobileLinks=[{href:"/",label:"Home"},{href:"/tasks",label:"Tasks"},{href:"/clients",label:"Clients"},{href:"/calendar",label:"Calendar"}];

function fixDashboardMobileLayout(){
  if(window.innerWidth>=640)return;
  const headings=Array.from(document.querySelectorAll("h3"));
  const fixSection=(title:string)=>{
    const heading=headings.find(el=>el.textContent?.trim()===title);
    if(!heading)return;
    const section=heading.closest("div.rounded-\\[28px\\]") as HTMLElement|null;
    if(!section)return;
    section.style.width="100%";
    section.style.maxWidth="100%";
    section.style.minWidth="0";
    section.style.overflow="visible";
    section.style.padding="16px";
    section.querySelectorAll<HTMLElement>(".truncate").forEach(el=>{
      el.style.whiteSpace="normal";
      el.style.overflow="visible";
      el.style.textOverflow="clip";
      el.style.overflowWrap="anywhere";
    });
    section.querySelectorAll<HTMLElement>("a.flex").forEach(row=>{
      row.style.minWidth="0";
      row.style.width="100%";
      row.style.flexWrap="wrap";
      row.style.alignItems="flex-start";
    });
  };
  fixSection("Tasks");
  fixSection("Today's Schedule");
  const schedule=headings.find(el=>el.textContent?.trim()==="Today's Schedule")?.closest("div.rounded-\\[28px\\]") as HTMLElement|null;
  schedule?.querySelectorAll<HTMLElement>("a.flex").forEach(row=>{
    row.style.flexDirection="column";
    row.style.gap="8px";
    row.querySelectorAll<HTMLElement>("span.shrink-0").forEach(el=>el.style.alignSelf="flex-start");
  });
}

export default function AppShell({children}:AppShellProps){
  const pathname=usePathname();
  const[mobileMenuOpen,setMobileMenuOpen]=useState(false);
  const shouldHideSidebar=pagesWithoutSidebar.some(path=>pathname===path||pathname.startsWith(`${path}/`));
  useEffect(()=>setMobileMenuOpen(false),[pathname]);
  useEffect(()=>{document.body.style.overflow=mobileMenuOpen?"hidden":"";return()=>{document.body.style.overflow=""}},[mobileMenuOpen]);
  useEffect(()=>{
    if(pathname!=="/")return;
    const run=()=>requestAnimationFrame(fixDashboardMobileLayout);
    run();
    const timer=window.setTimeout(run,600);
    window.addEventListener("resize",run);
    return()=>{window.clearTimeout(timer);window.removeEventListener("resize",run)};
  },[pathname]);
  if(shouldHideSidebar)return <>{children}</>;
  return <>
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-black/5 bg-white/95 px-4 backdrop-blur md:hidden"><Link href="/" className="min-w-0 rounded-lg py-1 pr-3"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">JGO Hire</p><p className="text-sm font-semibold text-slate-900">JGO OS</p></Link><button type="button" onClick={()=>setMobileMenuOpen(true)} aria-label="Open navigation" aria-expanded={mobileMenuOpen} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm active:scale-95"><span className="flex w-5 flex-col gap-[4px]"><span className="block h-[2px] w-full rounded-full bg-current"/><span className="block h-[2px] w-full rounded-full bg-current"/><span className="block h-[2px] w-full rounded-full bg-current"/></span></button></header>
    {mobileMenuOpen&&<button type="button" aria-label="Close navigation" onClick={()=>setMobileMenuOpen(false)} className="fixed inset-0 z-40 bg-black/30 md:hidden"/>}
    <aside className={`fixed inset-y-0 left-0 z-50 w-[88%] max-w-[320px] bg-white shadow-2xl transition-transform duration-300 md:hidden ${mobileMenuOpen?"translate-x-0":"-translate-x-full"}`}><div className="flex h-14 items-center justify-between border-b border-slate-100 px-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">JGO Hire</p><p className="text-sm font-semibold text-slate-900">JGO OS</p></div><button type="button" onClick={()=>setMobileMenuOpen(false)} aria-label="Close navigation" className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl text-slate-600">×</button></div><div className="h-[calc(100dvh-3.5rem)] overflow-y-auto pb-24"><AppSidebar/></div></aside>
    <main className="min-h-screen overflow-x-hidden bg-slate-50 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0"><div className="flex min-h-screen min-w-0"><div className="hidden md:block"><AppSidebar/></div><div className="min-w-0 max-w-full flex-1 overflow-x-hidden">{children}</div></div></main>
    <nav aria-label="Quick navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-slate-200/90 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">{mobileLinks.map(item=>{const active=item.href==="/"?pathname===item.href:pathname===item.href||pathname.startsWith(`${item.href}/`);return <Link key={item.href} href={item.href} className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-semibold transition active:scale-95 ${active?"text-[#4d6247]":"text-slate-500"}`}><span className={`h-1.5 w-1.5 rounded-full ${active?"bg-[#647d5b]":"bg-transparent"}`}/><span>{item.label}</span></Link>})}</nav>
  </>;
}
