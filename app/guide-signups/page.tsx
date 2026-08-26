import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type Lead = {
  id: string;
  first_name: string;
  email: string;
  quiz_result_type: string | null;
  quiz_result_title: string | null;
  created_at: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  }).format(new Date(value));
}

export default async function GuideSignupsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_search_guide_leads")
    .select("id,first_name,email,quiz_result_type,quiz_result_title,created_at")
    .order("created_at", { ascending: false });

  const leads = (data || []) as Lead[];

  return (
    <main className="min-h-screen bg-[#f8f7f3] p-4 text-[#2f3d32] md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7b8b78]">Lead Funnel</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#354532]">Survival Guide Signups</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#728075]">
              Everyone who signs up for the Job Seeker Survival Guide appears here automatically.
            </p>
          </div>
          <div className="rounded-2xl border border-[#dce5d7] bg-white px-5 py-3 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#899588]">Total Signups</p>
            <p className="mt-1 text-2xl font-bold text-[#4d6247]">{leads.length}</p>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-[#ead7d2] bg-white p-5 text-sm text-[#8a5146]">
            Unable to load Survival Guide signups right now.
          </div>
        ) : leads.length === 0 ? (
          <div className="rounded-2xl border border-[#dfe5dc] bg-white p-8 text-center shadow-sm">
            <p className="font-semibold">No signups yet.</p>
            <p className="mt-1 text-sm text-[#78837a]">New Survival Guide leads will appear here automatically.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#dfe5dc] bg-white shadow-sm">
            <div className="hidden grid-cols-[1.05fr_1.45fr_1.25fr_1fr_auto] gap-4 border-b border-[#e8ece6] bg-[#f3f6f0] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.13em] text-[#7b887d] md:grid">
              <span>Name</span><span>Email</span><span>Signed Up For</span><span>Date</span><span>Action</span>
            </div>
            <div className="divide-y divide-[#edf0eb]">
              {leads.map((lead) => (
                <div key={lead.id} className="grid gap-3 px-5 py-5 transition hover:bg-[#fafbf8] md:grid-cols-[1.05fr_1.45fr_1.25fr_1fr_auto] md:items-center md:gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#9aa39a] md:hidden">Name</p>
                    <p className="font-semibold text-[#354532]">{lead.first_name}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#9aa39a] md:hidden">Email</p>
                    <p className="truncate text-sm text-[#68756a]">{lead.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#9aa39a] md:hidden">Signed Up For</p>
                    <span className="inline-flex rounded-full bg-[#edf3e9] px-3 py-1 text-xs font-bold text-[#52684b]">Job Seeker Survival Guide</span>
                    {lead.quiz_result_title && lead.quiz_result_title !== "Direct Guide Signup" ? (
                      <p className="mt-1.5 text-[11px] text-[#879187]">{lead.quiz_result_title}</p>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#9aa39a] md:hidden">Date</p>
                    <p className="text-xs leading-5 text-[#78837a]">{formatDate(lead.created_at)}</p>
                  </div>
                  <a href={`mailto:${lead.email}?subject=${encodeURIComponent("Checking in from JGO Hire")}`} className="inline-flex w-fit items-center justify-center rounded-full border border-[#cad8c4] bg-white px-4 py-2 text-xs font-bold text-[#4d6247] transition hover:bg-[#f2f6ef]">
                    Email
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
