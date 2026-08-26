"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  signupId: string;
  recipientName: string;
  recipientEmail: string;
  clientId: number | null;
  templateId: number | null;
  templateName: string;
  initialSubject: string;
  initialBody: string;
};

export default function SurvivalFollowupClient({ signupId, recipientName, recipientEmail, clientId, templateId, templateName, initialSubject, initialBody }: Props) {
  const router = useRouter();
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  async function sendEmail() {
    if (!subject.trim() || !body.trim()) {
      setMessage("Add a subject and message before sending.");
      return;
    }

    setSending(true);
    setMessage("");
    try {
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: [{ clientId, name: recipientName, email: recipientEmail }],
          subject,
          body,
          templateId,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || result.error || "Unable to send email.");

      await fetch("/api/guide-signups/contacted", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signupId }),
      });

      setMessage("Email sent. This signup is now marked Contacted.");
      setTimeout(() => {
        router.push("/guide-signups");
        router.refresh();
      }, 900);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send email.");
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8 lg:p-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="overflow-hidden rounded-3xl border border-[#dfe6db] bg-white shadow-sm">
          <div className="border-b border-[#edf0ea] px-5 py-5 md:px-6">
            <h2 className="text-xl font-bold">Compose Email</h2>
            <p className="mt-1 text-sm text-[#7b887d]">Review the saved follow-up before sending.</p>
          </div>
          <div className="space-y-5 p-5 md:p-6">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#708075]">To</span>
              <div className="mt-2 rounded-xl border border-[#d7e1d0] bg-[#f7f9f5] px-4 py-3">
                <p className="font-semibold text-[#354532]">{recipientName || recipientEmail}</p>
                <p className="mt-0.5 text-sm text-[#718075]">{recipientEmail}</p>
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#708075]">Subject</span>
              <input value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-2 w-full rounded-xl border border-[#d7e1d0] bg-white px-4 py-3 text-sm outline-none focus:border-[#9fb294] focus:ring-2 focus:ring-[#e8eee3]" />
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#708075]">Message</span>
              <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={16} className="mt-2 min-h-[360px] w-full resize-y rounded-xl border border-[#d7e1d0] bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-[#9fb294] focus:ring-2 focus:ring-[#e8eee3]" />
            </label>

            {message ? <div className="rounded-xl border border-[#d7e1d0] bg-[#edf3e9] px-4 py-3 text-sm font-semibold text-[#4d6247]">{message}</div> : null}

            <div className="flex justify-end">
              <button type="button" onClick={sendEmail} disabled={sending} className="rounded-xl bg-[#647d5b] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#536b4c] disabled:opacity-60">
                {sending ? "Sending..." : "Send Email"}
              </button>
            </div>
          </div>
        </section>

        <aside className="h-fit rounded-3xl border border-[#dfe6db] bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#899588]">Template Loaded</p>
          <p className="mt-2 text-lg font-bold text-[#354532]">{templateName}</p>
          <p className="mt-2 text-sm leading-6 text-[#78837a]">This is your saved Job Seeker Survival Guide follow-up template from the Email Hub. You can edit anything before sending.</p>
          {!templateId ? <p className="mt-4 rounded-xl bg-[#fff6e6] p-3 text-xs font-semibold text-[#806938]">The saved template could not be found, so a fallback subject was loaded.</p> : null}
        </aside>
      </div>
    </div>
  );
}
