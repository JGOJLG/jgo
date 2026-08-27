import EwcTracker, { type EwcEntry } from "./EwcTracker";
import EwcSafetyShell from "./EwcSafetyShell";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EwcPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ewc_entries")
    .select("*")
    .order("section", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <section className="min-w-0 flex-1 bg-[#f7f8f3] p-6 text-[#243128] lg:p-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-xl font-bold text-red-700">
            EWC tracker could not be loaded
          </h1>
          <p className="mt-2 text-sm text-red-600">{error.message}</p>
          <p className="mt-3 text-sm text-red-600">
            Make sure the EWC Supabase table has been created.
          </p>
        </div>
      </section>
    );
  }

  return (
    <EwcSafetyShell>
      <EwcTracker initialEntries={(data ?? []) as EwcEntry[]} />
    </EwcSafetyShell>
  );
}
