"use client";

import { useEffect, useMemo, useState } from "react";

type Habit = { id: string; label: string; schedule: string; days?: number[]; biweekly?: boolean };
const sections: { title: string; tasks: Habit[] }[] = [
  { title: "LINKEDIN", tasks: [
    { id: "linkedin-requests", label: "Send connection requests", schedule: "Monday", days: [1] },
    { id: "linkedin-intros", label: "Send intro messages", schedule: "Tuesday", days: [2] },
    { id: "linkedin-post", label: "Publish a LinkedIn post", schedule: "Tuesday", days: [2] },
  ]},
  { title: "CONTENT", tasks: [
    { id: "social-video", label: "Post a social media video", schedule: "Wednesday", days: [3] },
    { id: "substack", label: "Publish a Substack article", schedule: "Every other Friday", days: [5], biweekly: true },
  ]},
  { title: "COMMUNITY", tasks: [
    { id: "social-check", label: "Check comments and messages", schedule: "Thursday", days: [4] },
    { id: "survival-guide-followup", label: "Send Survival Guide follow-ups", schedule: "Thursday", days: [4] },
  ]},
  { title: "CLIENTS & INQUIRIES", tasks: [
    { id: "client-interview-good-luck", label: "Send interview good luck messages", schedule: "As needed" },
    { id: "respond-inquiries", label: "Respond to inquiries", schedule: "Friday", days: [5] },
  ]},
];
const tasks = sections.flatMap(section => section.tasks);
function localNow() {
  const parts = new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const get = (key:string) => Number(parts.find(part => part.type === key)?.value || 0);
  return new Date(Date.UTC(get("year"),get("month")-1,get("day")));
}
function dateKey(date:Date) { return date.toISOString().slice(0,10); }
function weekStart(date:Date) { const d=new Date(date);d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return d; }
function dayName(date:Date) {return new Intl.DateTimeFormat("en-US",{weekday:"short",timeZone:"UTC"}).format(date);}
export default function JGODailyFour() {
  const [today,setToday]=useState(()=>localNow());
  const [weekly,setWeekly]=useState<string[]>([]);

  const [ready,setReady]=useState(false);
  const [error,setError]=useState("");
  const week=weekStart(today);
  const weekKey=dateKey(week);
  // Biweekly publishing starts Friday, October 9, 2026, then every second Friday.
  const substackWeek = Math.round((week.getTime() - Date.UTC(2026,9,5)) / (7*86400000));
  const substackDue = substackWeek >= 0 && substackWeek % 2 === 0;
  const day=today.getUTCDay();
  const currentWeekDays=Array.from({length:7},(_,i)=>{const d=new Date(week);d.setUTCDate(d.getUTCDate()+i);return d;});
  const currentTasks=tasks.filter(task=>!task.biweekly || substackDue);
  const total=currentTasks.length;
  const completedCount=currentTasks.filter(task=>weekly.includes(task.id)).length;
  const progress=Math.round(completedCount/total*100);
  useEffect(()=>{
    const timer=window.setInterval(()=>setToday(localNow()),60000);
    return()=>window.clearInterval(timer);
  },[]);
  useEffect(()=>{
    let active=true;
    setReady(false);
    Promise.all([weekKey].map(async key=>{
      const response=await fetch(`/api/dashboard/daily-four?day=${encodeURIComponent(key)}`,{cache:"no-store"});
      if(!response.ok)throw new Error("Unable to load checklist");
      const data=await response.json() as {completed?:string[]};
      return Array.isArray(data.completed)?data.completed:[];
    })).then(([w])=>{if(active){setWeekly(w);setError("");setReady(true);}}).catch(()=>{if(active){setError("Could not load your checklist. Refresh to try again.");setReady(true);}});
    return()=>{active=false};
  },[weekKey]);
  async function toggle(task:Habit) {
    const previous=weekly;
    const next=previous.includes(task.id)?previous.filter(id=>id!==task.id):[...previous,task.id];
    setWeekly(next);
    setError("");
    try{
      const response=await fetch("/api/dashboard/daily-four",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({day:weekKey,completed:next})});
      if(!response.ok)throw new Error("Save failed");
    }catch{
      setWeekly(previous);
      setError("Your change could not be saved. Please try again.");
    }
  }
  const dueToday=currentTasks.filter(task=>task.days?.includes(day) && !(weekly.includes(task.id)));
  const dueLater=currentTasks.filter(task=>task.days?.some(d=>currentWeekDays.some(date=>date.getUTCDay()===d && date>today)) && !weekly.includes(task.id));
  const summary=useMemo(()=>dueToday.length?`${dueToday.length} scheduled for today`:dueLater.length?`${dueLater.length} coming up this week`:"You're on track this week", [dueToday.length,dueLater.length]);
  if(!ready)return <section className="h-28 animate-pulse rounded-3xl border border-white/75 bg-white/50"/>;
  return <section className="min-w-0 rounded-[24px] border border-white/80 bg-white/75 p-4 shadow-[0_20px_55px_rgba(71,91,66,0.11)] backdrop-blur-2xl sm:p-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef3ea] text-sm font-bold text-[#4d6247]">JGO</div>
        <div className="min-w-0"><h2 className="text-base font-bold text-[#243128]">JGO Weekly Woo Do</h2><p className="text-xs text-[#708075]">{dayName(week)} {week.getUTCDate()} – {dayName(currentWeekDays[6])} {currentWeekDays[6].getUTCDate()} · {summary}</p></div>
      </div>
      <div className="flex items-center gap-3 sm:w-48"><div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e7ece3]"><div className="h-full rounded-full bg-[#647d5b] transition-all" style={{width:`${progress}%`}}/></div><span className="shrink-0 text-xs font-semibold text-[#647d5b]">{completedCount}/{total} done</span></div>
    </div>
    {error&&<p role="alert" className="mt-3 text-xs text-red-700">{error}</p>}
    <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {sections.map(section=><div key={section.title} className="min-w-0 rounded-2xl border border-[#e6ece2] bg-white/80 p-3">
        <h3 className="mb-2 text-[11px] font-bold tracking-wider text-[#647d5b]">{section.title}</h3>
        <div className="space-y-1">{section.tasks.filter(task=>!task.biweekly || substackDue).map(task=>{
          const checked=weekly.includes(task.id);
          const due=task.days?.includes(day);
          return <button key={task.id} type="button" onClick={()=>toggle(task)} aria-pressed={checked} className={`flex min-h-12 w-full items-start gap-2 rounded-xl px-2 py-2 text-left hover:bg-[#f4f7f1] ${due&&!checked?"bg-[#f1f5ed]":""}`}>
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs ${checked?"border-[#647d5b] bg-[#647d5b] text-white":"border-[#cdd8c8] bg-white text-transparent"}`}>✓</span>
            <span className="min-w-0 flex-1"><span className={`block break-words text-[13px] leading-5 ${checked?"text-[#789070] line-through":"font-medium text-[#3d4d39]"}`}>{task.label}</span><span className="block text-[11px] text-[#7b897b]">{task.schedule}{due&&!checked?" · Today":""}</span></span>
          </button>;
        })}</div>
      </div>)}
    </div>
    <p className="mt-3 text-xs text-[#708075]">Weekly checkmarks reset every Monday. Substack is scheduled every other Friday, starting October 9. Tasks without a set day can be checked off anytime.</p>
  </section>;
}
