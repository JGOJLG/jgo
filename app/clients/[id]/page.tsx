import Link from "next/link";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ClientPage({ params }: Props) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-[#f7f7fb] p-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/clients"
          className="mb-6 inline-block text-sm font-medium text-purple-600 hover:text-purple-700"
        >
          ← Back to Clients
        </Link>

        <div className="rounded-2xl bg-white p-8 shadow">
          <h1 className="text-3xl font-bold text-slate-900">
            Client #{id}
          </h1>

          <p className="mt-2 text-slate-500">
            This page will soon pull the client's information directly from
            Supabase.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border p-5">
              <h2 className="font-semibold">Project Status</h2>
              <p className="mt-2 text-slate-600">
                Connected to database coming next.
              </p>
            </div>

            <div className="rounded-xl border p-5">
              <h2 className="font-semibold">Payment</h2>
              <p className="mt-2 text-slate-600">
                Payment details will appear here.
              </p>
            </div>

            <div className="rounded-xl border p-5">
              <h2 className="font-semibold">Notes</h2>
              <p className="mt-2 text-slate-600">
                Internal recruiter notes and coaching notes.
              </p>
            </div>

            <div className="rounded-xl border p-5">
              <h2 className="font-semibold">Documents</h2>
              <p className="mt-2 text-slate-600">
                Resume, cover letter, LinkedIn guide, and other deliverables.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}