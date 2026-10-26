import Link from "next/link";
import {createClient} from "@/lib/supabase-server";
export const dynamic="force-dynamic";
export const revalidate=0;
type Summary={total_signups:number;new_7d:number;active_7d:number;first_job_added:number};
type Subscription={active_premium:number;mrr_cents:number;cancellations:number;total_paid_starts:number};
type History={signups:Record<string,number>;retention:{eligible_7d:number;returned_7d:number;eligible_30d:number;returned_30d:number}};
type Revenue={premium_accounts:number;complimentary_accounts:number;collected_cents:number;verified_paying:number;list_price_cents:number};
type Funnel={views:number;checkout_starts:number;confirmed:number};
const fmt=(n:number)=>new Intl.NumberFormat("en-US").format(n);
const usd=(n:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);
export default async function FounderPage(){
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)return null;
 const {data:admin,error:authError}=await db.rpc("is_jgo_os_admin");
 if(authError||!admin)return <section className="flex-1 p-8 text-red-700">Admin access required.</section>;
 const [s,h,b,f,r]=await Promise.all([db.rpc("jgojob_analytics_summary"),db.rpc("jgojob_growth_history"),db.rpc("jgojob_subscription_analytics"),db.rpc("jgojob_premium_funnel"),db.rpc("jgojob_revenue_truth")]);
 const summary=s.error?null:s.data as Summary|null;
 const history=h.error?null:h.data as History|null;
 const billing=b.error?null:b.data as Subscription|null;
 const funnel=f.error?null:f.data as Funnel|null;
 const revenue=r.error?null:r.data as Revenue|null;
 const signups=history?.signups?.all??summary?.total_signups??null;
 const paid=revenue?.verified_paying??null;
 const mrr=revenue?revenue.verified_paying*revenue.list_price_cents/100:null;
 const signup30=history?.signups?.["30d"]??null;
 const signup7=history?.signups?.["7d"]??null;
 const conversion=paid!==null&&signups?((paid/signups)*100).toFixed(1)+"%":null;
 const cards=[
  ["New signups · 7 days",signup7===null?"Unavailable":fmt(signup7),"Rolling 7-day registrations"],
  ["New signups · 30 days",signup30===null?"Unavailable":fmt(signup30),"Rolling 30-day registrations"],
  ["Active users · 7 days",summary?fmt(summary.active_7d):"Unavailable","Product analytics activity"],
  ["Paying subscribers",paid===null?"Unavailable":fmt(paid),"Verified positive-payment customers (all time)"],
  ["Verified payer list-price equivalent",mrr===null?"Unavailable":usd(mrr),"Illustrative monthly amount, not actual MRR"],
  ["Cancellations",billing?fmt(billing.cancellations):"Unavailable","Existing billing total, all time"],
  ["Paid / registered users",conversion??"Unavailable","Current paid share, not cohort conversion"],
  ["First job added",summary?fmt(summary.first_job_added):"Unavailable","Recorded activation milestone"]
 ];
 const alerts:{title:string;detail:string;href:string}[]=[];
 if(s.error||h.error||b.error||f.error||r.error)alerts.push({title:"Reporting connection needs attention",detail:"One or more reporting sources returned an error. Some numbers are unavailable.",href:"/jgojob/marketing"});
 if(summary&&summary.total_signups>0&&summary.first_job_added/summary.total_signups<.5)alerts.push({title:"Activation opportunity",detail:"Fewer than half of registered users have recorded a first-job milestone.",href:"/jgojob"});
 if(history&&history.retention.eligible_30d===0)alerts.push({title:"30-day retention is still maturing",detail:"No signup cohort has a complete 37-day observation window yet.",href:"/jgojob/marketing"});
 if(funnel&&funnel.views===0)alerts.push({title:"Premium funnel needs real traffic",detail:"No premium page views have been recorded since tracking began.",href:"/jgojob/marketing"});
 const goal=10000;
 return <section className="min-w-0 flex-1 bg-[#f7f8f3] p-5 lg:p-9"><div className="mx-auto max-w-[1450px]">
 <Link href="/jgojob" className="text-sm font-semibold text-[#587254]">← Back to Dashboard</Link>
 <div className="mt-5 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#7f9975]">JGO JOB / EXECUTIVE OVERVIEW</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#2d3c30]">Founder Command Center</h1><p className="mt-2 text-sm text-[#708075]">A single view of acquisition, activation, subscribers, revenue and business priorities.</p></div><Link href="/jgojob/marketing" className="rounded-xl border border-[#cad8c7] bg-white px-4 py-3 text-sm font-semibold text-[#315a3e]">Growth & Marketing →</Link></div>
 <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label,value,detail])=><div key={label} className="rounded-2xl border border-[#dfe6db] bg-white p-5"><p className="text-xs font-semibold text-[#778777]">{label}</p><p className="mt-3 text-3xl font-bold tracking-tight text-[#304534]">{value}</p><p className="mt-2 text-xs text-[#829084]">{detail}</p></div>)}</div>
 <section className="mt-5 rounded-2xl border border-[#dfe6db] bg-white p-6"><h2 className="text-xl font-bold text-[#304534]">Revenue: collected vs. potential</h2><p className="mt-2 text-sm text-[#748075]">Complimentary accounts do not count as money earned. Verified payments are based on recorded successful positive-amount payment events.</p><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["Actually collected",revenue?usd(revenue.collected_cents/100):"Unavailable","Recorded positive payments, all time"],["Potential at full price",revenue?usd(revenue.premium_accounts*revenue.list_price_cents/100):"Unavailable","One month at list price for all active premium accounts"],["Complimentary value waived",revenue?usd(revenue.complimentary_accounts*revenue.list_price_cents/100):"Unavailable","Monthly list-price equivalent, not cash"],["Verified paying customers",revenue?fmt(revenue.verified_paying):"Unavailable","Ever recorded a positive payment"]].map(([name,value,description])=><div key={name} className="rounded-xl bg-[#f7f9f5] p-4"><p className="text-xs text-[#748075]">{name}</p><p className="mt-2 text-2xl font-bold text-[#304534]">{value}</p><p className="mt-2 text-xs text-[#829084]">{description}</p></div>)}</div><p className="mt-4 text-xs text-[#788777]">Actual discount amounts, refunds and net recurring revenue require invoice-level reconciliation. Premium status alone is not proof of payment.</p></section>
 <div className="mt-5 grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-[#dfe6db] bg-white p-6"><p className="text-xs font-bold uppercase tracking-widest text-[#7f9975]">Revenue objective</p><h2 className="mt-2 text-xl font-bold text-[#304534]">$10,000 monthly revenue target</h2><p className="mt-4 text-2xl font-bold text-[#304534]">{mrr===null?"Unavailable":usd(mrr)} <span className="text-sm font-normal text-[#788777]">/ $10,000</span></p><div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#e8eee5]"><div className="h-full bg-[#64835f]" style={{width:mrr===null?"0%":Math.min(100,Math.max(0,mrr/goal*100))+"%"}}/></div><p className="mt-3 text-xs text-[#788777]">{mrr===null?"Billing data unavailable.":usd(Math.max(0,goal-mrr))+" remaining based on illustrative list-price equivalent."}</p></section>
 <section className="rounded-2xl border border-[#dfe6db] bg-white p-6"><p className="text-xs font-bold uppercase tracking-widest text-[#7f9975]">Premium conversion</p><h2 className="mt-2 text-xl font-bold text-[#304534]">Upgrade journey</h2><div className="mt-5 grid grid-cols-3 gap-3">{[["Views",funnel?.views],["Checkout starts",funnel?.checkout_starts],["Confirmed",funnel?.confirmed]].map(([label,n])=><div key={String(label)} className="rounded-lg bg-[#f5f8f2] p-3"><p className="text-xs text-[#788777]">{label}</p><p className="mt-2 text-xl font-bold text-[#304534]">{typeof n==="number"?fmt(n):"—"}</p></div>)}</div><p className="mt-3 text-xs text-[#829084]">Unique users per event, since tracking began. Not a sequential conversion cohort.</p></section></div>
 <section className="mt-5 rounded-2xl border border-[#dfe6db] bg-white p-6"><p className="text-xs font-bold uppercase tracking-widest text-[#7f9975]">Founder attention</p><h2 className="mt-2 text-xl font-bold text-[#304534]">What needs attention</h2>{alerts.length?<div className="mt-4 grid gap-3 md:grid-cols-2">{alerts.map(a=><Link key={a.title} href={a.href} className="block rounded-xl border border-[#e3e9df] bg-[#fafbf8] p-4 hover:border-[#a4baa0]"><p className="font-semibold text-[#334535]">{a.title}</p><p className="mt-2 text-xs leading-relaxed text-[#748075]">{a.detail}</p></Link>)}</div>:<p className="mt-4 text-sm text-[#738275]">No predefined data alerts are currently triggered. This is not a full system-health monitor.</p>}</section>
 <section className="mt-5 rounded-2xl border border-[#dfe6db] bg-white p-6"><h2 className="text-xl font-bold text-[#304534]">Trend comparisons</h2><p className="mt-2 text-sm text-[#748075]">Current 7-day and 30-day signup totals are available above. Prior-week and prior-month comparisons, daily trend charts, and historical revenue changes require dated comparison data and are not yet connected. No changes are inferred from incomplete data.</p></section>
 </div></section>;
}