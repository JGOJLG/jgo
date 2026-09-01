import { createClient } from "@/lib/supabase-server";
import JgoClientsTracker, { type JgoClientRow } from "./JgoClientsTracker";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function JgoClientsPage() {
  const supabase = await createClient();

  const [{ data: services, error: serviceError }, { data: clients, error: clientError }] = await Promise.all([
    supabase
      .from("client_services")
      .select("id,client_id,service,service_date,date_added,price,amount_received,payment_date,payment_method,payment_status,notes,moved,deleted_at")
      .is("deleted_at", null)
      .order("service_date", { ascending: false, nullsFirst: false })
      .order("date_added", { ascending: false, nullsFirst: false })
      .order("id", { ascending: false }),
    supabase
      .from("clients")
      .select("id,name,status")
      .neq("status", "Archived")
      .order("id", { ascending: false }),
  ]);

  if (serviceError || clientError) {
    return (
      <section className="min-w-0 flex-1 bg-[#f7f8f3] p-6 lg:p-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <h1 className="text-xl font-bold">JGO Clients could not be loaded</h1>
          <p className="mt-2 text-sm">{serviceError?.message || clientError?.message}</p>
        </div>
      </section>
    );
  }

  const clientNameById = new Map((clients ?? []).map((client) => [Number(client.id), client.name || "Client"]));

  const rows: JgoClientRow[] = (services ?? [])
    .filter((service) => service.client_id && clientNameById.has(Number(service.client_id)))
    .map((service) => ({
      service_id: Number(service.id),
      client_id: Number(service.client_id),
      client_name: clientNameById.get(Number(service.client_id)) || "Client",
      service_date: service.service_date || service.date_added || null,
      service: service.service || "Other",
      amount_owed: Number(service.price || 0),
      amount_received: Number(service.amount_received || 0),
      payment_date: service.payment_date || null,
      payment_method: service.payment_method || null,
      payment_status: service.payment_status || null,
      notes: service.notes || null,
      moved: Boolean(service.moved),
    }));

  return <JgoClientsTracker initialRows={rows} />;
}
