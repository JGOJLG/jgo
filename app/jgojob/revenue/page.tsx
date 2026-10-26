import Link from "next/link";
import {createClient} from "@/lib/supabase-server";
export const dynamic="force-dynamic";
export const revalidate=0;
type StripeRow=Record<string,any>;
const usd=(c:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(c/100);
const count=(n:number)=>new Intl.NumberFormat("en-US").format(n);
async function stripeList(resource:string,secret:string,query:string,maxPages=5):Promise<{rows:StripeRow[];truncated:boolean}>{
 let rows:StripeRow[]=[],after="",more=false;
 for(let p=0;p<maxPages;p++){
  const url="https://api.stripe.com/v1/"+resource+"?limit=100"+query+(after?"&starting_after="+encodeURIComponent(after):"");
  const res=await fetch(url,{headers:{Authorization:"Bearer "+secret},cache:"no-store"});
  if(!res.ok)throw new Error("Stripe "+resource+" request failed ("+res.status+")");
  const json=await res.json();
  rows.push(...(json.data||[]));more=!!json.has_more;
  if(!more)break;
  after=rows[rows.length-1]?.id;
  if(!after)break;
 }
 return {rows,truncated:more};
}
export default async function RevenuePage(){
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)return null;
 const {data:admin,error:authError}=await db.rpc("is_jgo_os_admin");
 if(authError||!admin)return <section className="flex-1 p-8 text-red-700">Admin access required.</section>;
 const {data:scope,error:scopeError}=await db.rpc("jgojob_stripe_identifiers");
 const customerIds=new Set<string>(Array.isArray(scope?.customers)?scope.customers:[]);
 const subscriptionIds=new Set<string>(Array.isArray(scope?.subscriptions)?scope.subscriptions:[]);
 const belongs=(x:StripeRow)=>{const c=typeof x.customer==="string"?x.customer:x.customer?.id;return !!(c&&customerIds.has(c))};
 const secret=process.env.STRIPE_SECRET_KEY;
 const now=Math.floor(Date.now()/1000),since=now-30*86400;
 let error="",invoices:StripeRow[]=[],subscriptions:StripeRow[]=[],refunds:StripeRow[]=[],failures:StripeRow[]=[],truncated=false;
 if(scopeError||!scope)error="JGO Job customer reconciliation scope unavailable.";
 else if(!secret)error="STRIPE_SECRET_KEY is not configured.";
 else try{
  const results=await Promise.all([
   stripeList("invoices",secret,"&created[gte]="+since),
   stripeList("subscriptions",secret,"&status=all&expand[]=data.items.data.price"),
   stripeList("refunds",secret,"&created[gte]="+since),
   stripeList("events",secret,"&type=invoice.payment_failed&created[gte]="+since)
  ]);
  invoices=results[0].rows.filter(belongs);
  subscriptions=results[1].rows.filter(s=>subscriptionIds.has(s.id)||belongs(s));
  refunds=results[2].rows.filter(r=>{const c=typeof r.customer==="string"?r.customer:r.customer?.id;return !!(c&&customerIds.has(c))});
  failures=results[3].rows.filter(e=>{const obj=e.data?.object||{};return belongs(obj)});
  truncated=results.some(x=>x.truncated);
 }catch(e){error=e instanceof Error?e.message:"Stripe unavailable";}
 const paidInvoices=invoices.filter(i=>i.status==="paid"&&i.amount_paid>0);
 const collected=paidInvoices.reduce((sum,i)=>sum+(i.amount_paid||0),0);
 const waived=invoices.reduce((sum,i)=>sum+(i.total_discount_amounts||[]).reduce((a:number,d:any)=>a+(d.amount||0),0),0);
 const refunded=refunds.filter(r=>r.status==="succeeded").reduce((sum,r)=>sum+(r.amount||0),0);
 const payers=new Set(paidInvoices.map(i=>typeof i.customer==="string"?i.customer:i.customer?.id).filter(Boolean));
 const active=subscriptions.filter(s=>s.status==="active");
 const canceled=subscriptions.filter(s=>s.canceled_at&&s.canceled_at>=since&&s.canceled_at<=now);
 const monthly=(s:StripeRow)=>s.items?.data?.reduce((sum:number,item:any)=>{
  const price=item.price||{},rec=price.recurring||{};
  const cents=(price.unit_amount||0)*(item.quantity||1);
  if(rec.interval==="month")return sum+cents/(rec.interval_count||1);
  if(rec.interval==="year")return sum+cents/(12*(rec.interval_count||1));
  if(rec.interval==="week")return sum+cents*52/(12*(rec.interval_count||1));
  if(rec.interval==="day")return sum+cents*365/(12*(rec.interval_count||1));
  return sum;
 },0)||0;
 const listMrr=active.reduce((sum,s)=>sum+monthly(s),0);
 const discounted=active.filter(s=>(s.discounts?.length||0)>0||s.discount||s.trial_end&&s.trial_end>now);
 const churnBase=active.length+canceled.length;
 const churn=churnBase?100*canceled.length/churnBase:null;
 const lifetime= payers.size?collected/payers.size:null;
 const cards=[
  ["Collected payments · 30 days",usd(collected),"Paid Stripe invoices only; excludes free invoices"],
  ["Refunds · 30 days",usd(refunded),"Succeeded Stripe refunds"],
  ["Net collections · 30 days",usd(collected-refunded),"Paid invoices less refunds in this window; timing may differ"],
  ["List-price MRR",usd(listMrr),"Active subscriptions before discounts; not actual recurring revenue"],
  ["List-price ARR",usd(listMrr*12),"Annualized list-price MRR, not booked cash"],
  ["Recorded discounts · 30 days",usd(waived),"Stripe invoice discount amounts on JGO Job invoices"],
  ["Payment failures · 30 days",count(failures.length),"Stripe invoice.payment_failed events"],
  ["Cancellation rate · 30 days",churn===null?"Unavailable":churn.toFixed(1)+"%","Proxy: cancellations / (current active + cancellations), not cohort churn"],
  ["Observed payer value · 30 days",lifetime===null?"Unavailable":usd(lifetime),"30-day collections / distinct customers who paid; not lifetime value"],
  ["Customer acquisition cost","Unavailable","Marketing spend and attributed new customers are not reconciled"],
  ["Lifetime value","Unavailable","Requires historical customer-level net revenue and retention"],
  ["Discounted active subscriptions",count(discounted.length),"May include discounts not yet reflected in invoices"]
 ];
 return <section className="min-w-0 flex-1 bg-[#f7f8f3] p-5 lg:p-9"><div className="mx-auto max-w-[1450px]">
 <Link href="/jgojob" className="text-sm font-semibold text-[#587254]">← Back to Dashboard</Link>
 <p className="mt-6 text-[10px] font-bold uppercase tracking-[.2em] text-[#7f9975]">JGO JOB / FINANCE</p>
 <h1 className="mt-2 text-3xl font-bold text-[#2d3c30]">Revenue Intelligence</h1>
 <p className="mt-2 max-w-3xl text-sm text-[#708075]">Server-side Stripe reconciliation scoped to JGO Job customer and subscription IDs. Collected revenue is based on successful invoice payments, not premium badges or frontend analytics.</p>
 {error?<div role="alert" className="mt-6 rounded-xl border border-red-200 bg-white p-5 text-red-700">{error}</div>:null}
 {truncated?<div role="alert" className="mt-5 rounded-xl border border-amber-200 bg-white p-4 text-sm text-amber-900">Stripe returned more than 500 records for at least one data source. These totals are incomplete until pagination is extended.</div>:null}
 {!error?<><div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label,value,detail])=><div key={label} className="rounded-2xl border border-[#dfe6db] bg-white p-5"><p className="text-xs font-semibold text-[#778777]">{label}</p><p className="mt-3 text-2xl font-bold tracking-tight text-[#304534]">{value}</p><p className="mt-2 text-xs leading-relaxed text-[#829084]">{detail}</p></div>)}</div>
 <section className="mt-6 rounded-2xl border border-[#dfe6db] bg-white p-6"><h2 className="text-lg font-bold text-[#304534]">Reconciliation details</h2><p className="mt-3 text-sm text-[#708075]">Last 30 days: {count(invoices.length)} invoices, {count(paidInvoices.length)} paid invoices with a positive amount, {count(payers.size)} distinct paying customers, {count(refunds.length)} refund records, and {count(subscriptions.length)} subscriptions examined.</p><p className="mt-3 text-sm text-[#708075]">List-price MRR and ARR are theoretical values before coupons. For exact discounted MRR, customer acquisition cost, historical churn, and lifetime value, we need to reconcile subscription discounts, marketing spend, and historical payments over complete customer lifetimes.</p></section></>:null}
 </div></section>;
}
