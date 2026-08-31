import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import RevenueAccessReset from "@/components/RevenueAccessReset";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Client = {
  id: number;
  name: string | null;
  email: string | null;
  status: string | null;
};

type ClientService = {
  id: number;
  client_id: number | null;
  service: string | null;
  date_added: string | null;
  scheduled_date: string | null;
  price: number | null;
  payment_status: string | null;
  payment_method?: string | null;
  amount_received?: number | null;
  payment_date?: string | null;
  notes?: string | null;
};

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function isCompleted(status: string | null | undefined) {
  return ["complete", "completed", "closed", "cancelled", "canceled"].includes(normalize(status));
}

function actualReceived(service: ClientService) {
  if (service.amount_received !== null && service.amount_received !== undefined) return Number(service.amount_received || 0);
  return normalize(service.payment_status) === "paid" ? Number(service.price || 0) : 0;
}

function amountOutstanding(service: ClientService) {
  return Math.max(Number(service.price || 0) - actualReceived(service), 0);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "No date added";
  const date = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function getTodayDateString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getMonthStartDateString() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  return `${year}-${month}-01`;
}

function getPaymentStyle(status: string | null | undefined) {
  const normalized = normalize(status);
  if (normalized === "paid") return "bg-[#e7f1e6] text-[#55704f]";
  if (normalized === "partial") return "bg-[#e8edf5] text-[#55708b]";
  if (normalized === "overdue" || normalized === "past due") return "bg-[#f7e7e4] text-[#9a554d]";
  return "bg-[#f6ecd9] text-[#8f6d37]";
}

export default async function RevenuePage() {
  const cookieStore = await cookies();
  const unlocked = cookieStore.get("jgo-revenue-access")?.value === "unlocked";
  if (!unlocked) redirect("/revenue/unlock");

  const supabase = await createClient();
  const [clientsResult, servicesResult] = await Promise.all([
    supabase.from("clients").select("*").order("id", { ascending: false }),
    supabase.from("client_services").select("*").is("deleted_at", null).order("date_added", { ascending: false }).order("id", { ascending: false }),
  ]);

  const clients = (clientsResult.data ?? []) as Client[];
  const services = (servicesResult.data ?? []) as ClientService[];
  const databaseErrors = { clients: clientsResult.error, clientServices: servicesResult.error };
  const today = getTodayDateString();
  const monthStart = getMonthStartDateString();
  const receivedServices = services.filter((service) => actualReceived(service) > 0);

  const totalRevenue = receivedServices.reduce((total, service) => total + actualReceived(service), 0);
  const revenueThisMonth = receivedServices
    .filter((service) => {
      const paidDate = service.payment_date || service.date_added;
      return Boolean(paidDate && paidDate >= monthStart && paidDate <= today);
    })
    .reduce((total, service) => total + actualReceived(service), 0);

  const outstandingServices = services.filter((service) => {
    if (amountOutstanding(service) <= 0) return false;
    const paymentStatus = normalize(service.payment_status);
    return paymentStatus === "invoice sent" || paymentStatus === "pending" || paymentStatus === "partial" || paymentStatus === "open" || Boolean(service.scheduled_date);
  });
  const outstandingRevenue = outstandingServices.reduce((total, service) => total + amountOutstanding(service), 0);
  const activeClients = clients.filter((client) => !isCompleted(client.status));
  const completedClients = clients.filter((client) => isCompleted(client.status));
  const clientNameById = new Map(clients.map((client) => [client.id, client.name || "Unnamed Client"]));
  const revenueByClient = new Map<number, number>();

  receivedServices.forEach((service) => {
    if (!service.client_id) return;
    revenueByClient.set(service.client_id, (revenueByClient.get(service.client_id) ?? 0) + actualReceived(service));
  });

  const topClients = [...revenueByClient.entries()]
    .map(([clientId, amount]) => ({ clientId, name: clientNameById.get(clientId) || "Client", amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return (
    <section className="min-w-0 flex-1 bg-[#f6f5ef]">
      <RevenueAccessReset />
      <header className="border-b border-[#dfe6db] bg-[#fbfaf6] px-6 py-7 lg:px-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#7f9975]">Business finances</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#243128]">Revenue</h1>
            <p className="mt-2 text-sm text-[#708075]">Track actual payments received, partial payments, outstanding balances, and client revenue.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/jgo-clients" className="rounded-xl border border-[#cbd8c4] bg-white px-5 py-3 text-sm font-semibold text-[#4d6247] shadow-sm transition hover:bg-[#f5f7f2]">JGO Clients</Link>
            <Link href="/clients" className="rounded-xl bg-[#647d5b] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4d6247]">View Clients</Link>
          </div>
        </div>
      </header>

      <div className="space-y-7 p-6 lg:p-10">
        {Object.values(databaseErrors).some(Boolean) ? (
          <section className="rounded-2xl border border-red-300 bg-red-50 p-6">
            <h2 className="text-lg font-bold text-red-700">Revenue Page Error</h2>
            <pre className="mt-4 whitespace-pre-wrap text-sm text-red-700">{JSON.stringify(databaseErrors, null, 2)}</pre>
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm"><p className="text-sm font-medium text-[#708075]">Total Revenue</p><p className="mt-3 text-3xl font-bold text-[#243128]">{formatCurrency(totalRevenue)}</p><p className="mt-3 text-xs font-semibold text-[#7f9975]">Actual payments received</p></div>
          <div className="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm"><p className="text-sm font-medium text-[#708075]">This Month Revenue</p><p className="mt-3 text-3xl font-bold text-[#243128]">{formatCurrency(revenueThisMonth)}</p><p className="mt-3 text-xs font-semibold text-[#7f9975]">Actual payments received this month</p></div>
          <div className="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm"><p className="text-sm font-medium text-[#708075]">Outstanding</p><p className="mt-3 text-3xl font-bold text-[#243128]">{formatCurrency(outstandingRevenue)}</p><p className="mt-3 text-xs font-semibold text-[#8f6d37]">Remaining balances</p></div>
          <div className="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm"><p className="text-sm font-medium text-[#708075]">Active Clients</p><p className="mt-3 text-3xl font-bold text-[#243128]">{activeClients.length}</p><p className="mt-3 text-xs font-semibold text-[#7f9975]">Current clients</p></div>
          <div className="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm"><p className="text-sm font-medium text-[#708075]">Past Clients</p><p className="mt-3 text-3xl font-bold text-[#243128]">{completedClients.length}</p><p className="mt-3 text-xs font-semibold text-[#7f9975]">Completed clients</p></div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="overflow-hidden rounded-3xl border border-[#dfe6db] bg-white shadow-sm">
            <div className="border-b border-[#e4e9df] p-6"><h2 className="text-xl font-bold text-[#243128]">Payments Received</h2><p className="mt-1 text-sm text-[#708075]">Invoice amount and actual amount received are kept separately.</p></div>
            {receivedServices.length === 0 ? <div className="p-10 text-center"><p className="text-sm font-semibold text-[#3d4d39]">No payments received yet</p></div> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] text-left">
                  <thead className="bg-[#f8faf6] text-xs uppercase tracking-wide text-[#708075]"><tr><th className="px-6 py-4">Client</th><th className="px-6 py-4">Service</th><th className="px-6 py-4">Date Paid</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Invoice</th><th className="px-6 py-4 text-right">Received</th></tr></thead>
                  <tbody className="divide-y divide-[#edf0ea]">
                    {receivedServices.map((service) => {
                      const received = actualReceived(service);
                      const invoice = Number(service.price ?? 0);
                      const extra = Math.max(0, received - invoice);
                      return (
                        <tr key={service.id} className="transition hover:bg-[#fbfcf9]">
                          <td className="px-6 py-4">{service.client_id ? <Link href={`/clients/${service.client_id}`} className="text-sm font-semibold text-[#243128] hover:text-[#647d5b]">{clientNameById.get(service.client_id) || "Client"}</Link> : <span className="text-sm font-semibold text-[#243128]">Client</span>}</td>
                          <td className="px-6 py-4 text-sm text-[#647066]">{service.service || "Client service"}</td>
                          <td className="px-6 py-4 text-sm text-[#647066]">{formatDate(service.payment_date || service.date_added)}</td>
                          <td className="px-6 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentStyle(service.payment_status)}`}>{service.payment_status || "Received"}</span></td>
                          <td className="px-6 py-4 text-right text-sm text-[#647066]">{formatCurrency(invoice)}</td>
                          <td className="px-6 py-4 text-right"><span className="text-sm font-bold text-[#243128]">{formatCurrency(received)}</span>{extra > 0 ? <span className="ml-2 rounded-full bg-[#f6ecd9] px-2 py-1 text-[10px] font-bold text-[#8f6d37]">+{formatCurrency(extra)} extra</span> : null}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-[#dfe6db] bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold text-[#243128]">Outstanding Payments</h2><p className="mt-1 text-sm text-[#708075]">What is still owed after any payments already received.</p></div><span className="rounded-full bg-[#f6ecd9] px-3 py-1 text-xs font-semibold text-[#8f6d37]">{outstandingServices.length}</span></div>
              {outstandingServices.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-[#cfd9c9] bg-[#fbfcf9] p-6 text-center"><p className="text-sm font-semibold text-[#3d4d39]">Everyone is currently paid</p></div> : (
                <div className="mt-6 divide-y divide-[#edf0ea]">{outstandingServices.slice(0, 8).map((service) => <div key={service.id} className="flex items-center justify-between gap-4 py-4"><div className="min-w-0">{service.client_id ? <Link href={`/clients/${service.client_id}`} className="truncate text-sm font-semibold text-[#243128] hover:text-[#647d5b]">{clientNameById.get(service.client_id) || "Client"}</Link> : <p className="truncate text-sm font-semibold text-[#243128]">Client</p>}<p className="mt-1 truncate text-xs text-[#708075]">{service.service || "Client service"}{actualReceived(service) > 0 ? ` · ${formatCurrency(actualReceived(service))} received` : ""}</p></div><p className="shrink-0 text-sm font-bold text-[#8f6d37]">{formatCurrency(amountOutstanding(service))}</p></div>)}</div>
              )}
            </section>

            <section className="rounded-3xl border border-[#dfe6db] bg-[#eef2e9] p-6 shadow-sm">
              <h2 className="text-xl font-bold text-[#243128]">Top Clients by Revenue</h2><p className="mt-1 text-sm text-[#708075]">Ranked by actual payments received.</p>
              {topClients.length === 0 ? <p className="mt-6 text-sm text-[#708075]">No paid client totals yet.</p> : <div className="mt-6 space-y-3">{topClients.map((client, index) => <Link key={client.clientId} href={`/clients/${client.clientId}`} className="flex items-center justify-between gap-4 rounded-2xl border border-[#d8e1d3] bg-white px-4 py-4 transition hover:border-[#bdcdb7]"><div className="flex min-w-0 items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef2e9] text-xs font-bold text-[#5c7454]">{index + 1}</span><p className="truncate text-sm font-semibold text-[#243128]">{client.name}</p></div><p className="shrink-0 text-sm font-bold text-[#55704f]">{formatCurrency(client.amount)}</p></Link>)}</div>}
            </section>
          </div>
        </section>
      </div>
    </section>
  );
}
