import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import JgoDocsUploader from "./JgoDocsUploader";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ClientOption = {
  id: number;
  name: string | null;
};

type LeadOption = {
  id: number;
  name: string | null;
  converted_to_client: boolean | null;
};

export default async function DocsUploadPage() {
  const supabase = await createClient();

  const [clientsResult, leadsResult] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name")
      .order("name", { ascending: true }),
    supabase
      .from("intake_calls")
      .select("id, name, converted_to_client")
      .order("name", { ascending: true }),
  ]);

  const clients = ((clientsResult.data ?? []) as ClientOption[]).map(
    (client) => ({
      id: client.id,
      name: client.name || "Unnamed Client",
    })
  );

  const leads = ((leadsResult.data ?? []) as LeadOption[])
    .filter((lead) => !lead.converted_to_client)
    .map((lead) => ({
      id: lead.id,
      name: lead.name || "Unnamed Lead",
    }));

  return (
    <section className="min-w-0 flex-1 bg-[#f6f5ef]">
      <header className="border-b border-[#dfe6db] bg-[#fbfaf6] px-6 py-7 lg:px-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/docs"
              className="text-sm font-semibold text-[#7f9975] transition hover:text-[#4d6247]"
            >
              ← Back to JGO Docs
            </Link>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#243128]">
              Upload Files
            </h1>

            <p className="mt-2 text-sm text-[#708075]">
              Add business documents or connect files to a client or lead.
            </p>
          </div>

          <Link
            href="/docs"
            className="w-fit rounded-xl border border-[#cbd8c4] bg-white px-5 py-3 text-sm font-semibold text-[#4d6247] shadow-sm transition hover:bg-[#f5f7f2]"
          >
            View JGO Docs
          </Link>
        </div>
      </header>

      <div className="p-6 lg:p-10">
        {clientsResult.error || leadsResult.error ? (
          <section className="mb-6 rounded-2xl border border-red-300 bg-red-50 p-5">
            <h2 className="font-bold text-red-700">
              Could not load upload options
            </h2>

            <pre className="mt-3 whitespace-pre-wrap text-sm text-red-700">
              {JSON.stringify(
                {
                  clients: clientsResult.error,
                  leads: leadsResult.error,
                },
                null,
                2
              )}
            </pre>
          </section>
        ) : null}

        <div className="mx-auto max-w-5xl">
          <JgoDocsUploader clients={clients} leads={leads} />
        </div>
      </div>
    </section>
  );
}
