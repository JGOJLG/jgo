import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import SurvivalFollowupClient from "./SurvivalFollowupClient";

export const dynamic = "force-dynamic";

function storedHtml(value: string) {
  return value.startsWith("__JGO_HTML__") ? value.slice("__JGO_HTML__".length) : "";
}

function stripStoredTemplate(value: string) {
  const raw = value.startsWith("__JGO_HTML__") ? value.slice("__JGO_HTML__".length) : value;
  return raw
    .replace(/<div[^>]*>\s*<a[^>]*>Grab the Guide Again<\/a>\s*<\/div>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
}

export default async function SurvivalFollowupPage({ searchParams }: { searchParams: Promise<{ signupId?: string }> }) {
  const { signupId } = await searchParams;
  if (!signupId) notFound();

  const supabase = await createClient();
  const [{ data: signup }, { data: template }] = await Promise.all([
    supabase.from("job_search_guide_leads").select("id,first_name,email,converted_client_id").eq("id", signupId).maybeSingle(),
    supabase.from("email_templates").select("id,name,subject,body").eq("name", "Survival Guide Follow-Up").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (!signup) notFound();

  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#243128]">
      <header className="border-b border-[#dfe6db] bg-[#fbfaf6] px-5 py-6 md:px-8 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8aa080]">JGO OS · Email Hub</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">Survival Guide Follow-Up</h1>
              <p className="mt-2 text-sm text-[#708075]">Recipient and your saved Survival Guide template are ready. Review, edit, and send.</p>
            </div>
            <div className="flex gap-2">
              <Link href="/guide-signups" className="rounded-xl border border-[#d7e1d0] bg-white px-4 py-2.5 text-sm font-semibold text-[#4d6247]">Back to Signups</Link>
              <Link href="/email" className="rounded-xl bg-[#647d5b] px-4 py-2.5 text-sm font-semibold text-white">Email Hub</Link>
            </div>
          </div>
        </div>
      </header>

      <SurvivalFollowupClient
        signupId={signup.id}
        recipientName={signup.first_name || ""}
        recipientEmail={signup.email}
        clientId={signup.converted_client_id}
        templateId={template?.id ?? null}
        templateName={template?.name ?? "Survival Guide Follow-Up"}
        initialSubject={template?.subject ?? "How’s the Survival Guide going?"}
        initialBody={template?.body ? stripStoredTemplate(template.body) : `Hi {{first_name}},\n\nI saw you downloaded my Job Seeker Survival Guide and wanted to check in!\n\nHave you had a chance to look through it yet?\n\nHope it helps make the job search feel a little less overwhelming.\n\nBest,`}
        initialBodyHtml={template?.body ? storedHtml(template.body) : ""}
      />
    </main>
  );
}
