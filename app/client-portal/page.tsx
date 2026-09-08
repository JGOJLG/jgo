import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { claimClientPortal } from "./actions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: client } = await supabase
    .from("clients")
    .select("id,name,portal_user_id")
    .eq("portal_user_id", user.id)
    .maybeSingle();

  if (!client) {
    return (
      <main className="mx-auto max-w-xl px-5 py-16">
        <div className="rounded-3xl border bg-white p-8">
          <h1 className="font-serif text-3xl">Connect your client portal</h1>
          <p className="mt-3 text-sm leading-6 text-[#708075]">We found your JGO Hire login. Connect it to your client record to open your private documents, resources, and job tracker.</p>
          <form action={claimClientPortal}>
            <button className="mt-6 rounded-xl bg-[#647d5b] px-5 py-3 text-sm font-bold text-white">Connect My Portal</button>
          </form>
        </div>
      </main>
    );
  }

  const { data: acceptedOffer } = await supabase
    .from("client_job_applications")
    .select("id,company,job_title,updated_at")
    .eq("user_id", user.id)
    .eq("status", "Offer Accepted")
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const first = String(client.name || "there").split(" ")[0];
  const cards = [
    ["My Documents", "Your resume, cover letters, reports, and files shared by JGO Hire.", "/client-portal/documents"],
    ["Job Tracker", "A simple place to keep every application, next step, and interview organized.", "/client-portal/jobs"],
    ["Resources", "Your JGO Hire guides, templates, and career resources.", "/client-portal/resources"],
  ];

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-[#7f9975]">Client Portal</p>
      <h1 className="mt-2 font-serif text-4xl">Hi, {first}.</h1>
      <p className="mt-2 text-[#708075]">Everything for your job search, in one place.</p>

      {acceptedOffer ? (
        <section className="mt-8 rounded-3xl border border-[#bfd0b7] bg-[#eef5e9] p-7 shadow-sm md:p-9">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#647d5b]">Congratulations</p>
          <h2 className="mt-2 font-serif text-4xl text-[#33432f]">You did it!</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#52684d]">
            Finding a job is not easy. You put in the work, made it through the applications and interviews, and landed the offer. That is something to celebrate. Congratulations on your new role!
          </p>
          <p className="mt-5 font-bold text-[#33432f]">{acceptedOffer.job_title} at {acceptedOffer.company}</p>
        </section>
      ) : null}

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {cards.map(([t, d, h]) => (
          <Link key={t} href={h} className="rounded-2xl border border-[#dfe6db] bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md">
            <h2 className="text-xl font-bold">{t}</h2>
            <p className="mt-2 text-sm leading-6 text-[#708075]">{d}</p>
            <p className="mt-6 text-sm font-bold text-[#647d5b]">Open →</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
