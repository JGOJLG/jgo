"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  clientId: number;
  serviceId: number;
};

type DraftResponse = {
  subject?: string;
  message?: string;
  clientName?: string;
  clientEmail?: string;
  serviceName?: string;
  googleReviewUrl?: string;
  error?: string;
  detail?: string;
};

export default function PaymentReceiptButton({ clientId, serviceId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [includeGoogleReview, setIncludeGoogleReview] = useState(true);
  const [includeAnonymousTestimonial, setIncludeAnonymousTestimonial] = useState(true);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [recipient, setRecipient] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadPreview(review = includeGoogleReview, anonymous = includeAnonymousTestimonial) {
    setLoadingPreview(true);
    setError("");
    setSuccess("");

    try {
      const params = new URLSearchParams({
        clientId: String(clientId),
        serviceId: String(serviceId),
        includeGoogleReview: String(review),
        includeAnonymousTestimonial: String(anonymous),
      });
      const response = await fetch(`/api/payments/receipt?${params.toString()}`, { cache: "no-store" });
      const data = (await response.json()) as DraftResponse;
      if (!response.ok) throw new Error(data.detail || data.error || "Unable to load the email preview.");

      setSubject(String(data.subject || ""));
      setMessage(String(data.message || ""));
      setRecipient([data.clientName, data.clientEmail].filter(Boolean).join(" · "));
      setServiceName(String(data.serviceName || ""));
      setGoogleReviewUrl(String(data.googleReviewUrl || ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load the email preview.");
    } finally {
      setLoadingPreview(false);
    }
  }

  async function openPreview() {
    setOpen(true);
    await loadPreview(true, true);
  }

  async function changeGoogleReview(checked: boolean) {
    setIncludeGoogleReview(checked);
    await loadPreview(checked, includeAnonymousTestimonial);
  }

  async function changeAnonymousTestimonial(checked: boolean) {
    setIncludeAnonymousTestimonial(checked);
    await loadPreview(includeGoogleReview, checked);
  }

  async function sendReceipt() {
    if (!subject.trim() || !message.trim()) {
      setError("Add a subject and message before sending.");
      return;
    }

    setSending(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/payments/receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          serviceId,
          includeGoogleReview,
          includeAnonymousTestimonial,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || data?.error || "Unable to send the receipt email.");
      }

      setSuccess("Thank-you email sent and the exact sent version was saved to Notes & Emails.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send the receipt email.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openPreview}
        className="rounded-xl border border-[#cbd8c4] bg-white px-4 py-2 text-xs font-semibold text-[#4d6247] transition hover:bg-[#f5f7f2]"
      >
        Send Receipt / Thank You
      </button>

      {open ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 p-4">
          <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#7f9975]">Payment received</p>
                <h3 className="mt-1 text-xl font-bold text-[#243128]">Preview & edit thank-you email</h3>
                <p className="mt-2 text-sm leading-6 text-[#708075]">
                  Review exactly what you want to say, make any edits, then send it to the client.
                </p>
                {recipient ? <p className="mt-2 text-xs font-semibold text-[#53684c]">To: {recipient}{serviceName ? ` · ${serviceName}` : ""}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-[#dfe6db] px-3 py-1.5 text-lg text-[#708075]"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#dfe6db] bg-[#fbfcf9] p-4">
                <input
                  type="checkbox"
                  checked={includeGoogleReview}
                  onChange={(event) => changeGoogleReview(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#647d5b]"
                />
                <div>
                  <p className="text-sm font-semibold text-[#344239]">Ask for a Google review</p>
                  <p className="mt-1 text-xs leading-5 text-[#708075]">Adds a clean review button to the email.</p>
                </div>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#dfe6db] bg-[#fbfcf9] p-4">
                <input
                  type="checkbox"
                  checked={includeAnonymousTestimonial}
                  onChange={(event) => changeAnonymousTestimonial(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#647d5b]"
                />
                <div>
                  <p className="text-sm font-semibold text-[#344239]">Offer anonymous testimonial</p>
                  <p className="mt-1 text-xs leading-5 text-[#708075]">Changing either option refreshes the draft below.</p>
                </div>
              </label>
            </div>

            <div className="mt-5 rounded-2xl border border-[#dfe6db] bg-[#f8faf6] p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.14em] text-[#7f9975]">Email Preview</p>
                  <p className="mt-1 text-xs text-[#708075]">Everything below is editable. Your JGO Hire signature is added automatically.</p>
                </div>
                <button
                  type="button"
                  onClick={() => loadPreview()}
                  disabled={loadingPreview}
                  className="rounded-lg border border-[#d7e1d0] bg-white px-3 py-2 text-xs font-semibold text-[#4d6247] disabled:opacity-50"
                >
                  Reset Draft
                </button>
              </div>

              {loadingPreview ? (
                <div className="rounded-xl border border-dashed border-[#d7e1d0] bg-white p-8 text-center text-sm font-semibold text-[#708075]">
                  Loading personalized preview...
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wide text-[#708075]">Subject</span>
                    <input
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-[#d7e1d0] bg-white px-4 py-3 text-sm font-semibold text-[#243128] outline-none focus:border-[#8fa383]"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wide text-[#708075]">Message</span>
                    <textarea
                      rows={15}
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      className="mt-1.5 w-full resize-y rounded-xl border border-[#d7e1d0] bg-white px-4 py-3 text-sm leading-6 text-[#243128] outline-none focus:border-[#8fa383]"
                    />
                  </label>

                  {includeGoogleReview && googleReviewUrl ? (
                    <div className="rounded-2xl border border-[#d7e1d0] bg-white p-4">
                      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#708075]">Review Button Preview</p>
                      <a
                        href={googleReviewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded-full bg-[#647d5b] px-6 py-3 text-sm font-bold text-white no-underline"
                      >
                        Leave a Google Review
                      </a>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {error ? (
              <div className="mt-4 rounded-xl border border-[#ead4d0] bg-[#fbefed] px-4 py-3 text-sm font-semibold text-[#9a554d]">{error}</div>
            ) : null}
            {success ? (
              <div className="mt-4 rounded-xl border border-[#d5e3d0] bg-[#eef6eb] px-4 py-3 text-sm font-semibold leading-6 text-[#4f6b49]">{success}</div>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-[#d7e1d0] bg-white px-5 py-2.5 text-sm font-semibold text-[#4d6247]"
              >
                {success ? "Done" : "Cancel"}
              </button>
              {!success ? (
                <button
                  type="button"
                  onClick={sendReceipt}
                  disabled={sending || loadingPreview || !subject.trim() || !message.trim()}
                  className="rounded-xl bg-[#647d5b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#56683f] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? "Sending..." : "Send Thank You"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
