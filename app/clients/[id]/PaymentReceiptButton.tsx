"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  clientId: number;
  serviceId: number;
};

export default function PaymentReceiptButton({ clientId, serviceId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [includeGoogleReview, setIncludeGoogleReview] = useState(true);
  const [includeAnonymousTestimonial, setIncludeAnonymousTestimonial] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function sendReceipt() {
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
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || data?.error || "Unable to send the receipt email.");
      }

      const reviewNote = includeGoogleReview && !data.googleReviewConfigured
        ? " The Google review button was skipped because a direct review URL has not been configured yet."
        : "";
      setSuccess(`Receipt / thank-you email sent and saved to Notes & Emails.${reviewNote}`);
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
        onClick={() => {
          setError("");
          setSuccess("");
          setOpen(true);
        }}
        className="rounded-xl border border-[#cbd8c4] bg-white px-4 py-2 text-xs font-semibold text-[#4d6247] transition hover:bg-[#f5f7f2]"
      >
        Send Receipt / Thank You
      </button>

      {open ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#7f9975]">Payment received</p>
                <h3 className="mt-1 text-xl font-bold text-[#243128]">Send thank-you receipt</h3>
                <p className="mt-2 text-sm leading-6 text-[#708075]">
                  Confirms payment was received without listing the amount, thanks the client, and saves the exact sent email to their profile.
                </p>
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

            <div className="mt-5 space-y-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#dfe6db] bg-[#fbfcf9] p-4">
                <input
                  type="checkbox"
                  checked={includeGoogleReview}
                  onChange={(event) => setIncludeGoogleReview(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#647d5b]"
                />
                <div>
                  <p className="text-sm font-semibold text-[#344239]">Ask for a Google review</p>
                  <p className="mt-1 text-xs leading-5 text-[#708075]">Adds a friendly review request and direct review button when the JGO Google review URL is configured.</p>
                </div>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#dfe6db] bg-[#fbfcf9] p-4">
                <input
                  type="checkbox"
                  checked={includeAnonymousTestimonial}
                  onChange={(event) => setIncludeAnonymousTestimonial(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#647d5b]"
                />
                <div>
                  <p className="text-sm font-semibold text-[#344239]">Offer an anonymous testimonial option</p>
                  <p className="mt-1 text-xs leading-5 text-[#708075]">Lets them reply directly with feedback you may share anonymously with their permission.</p>
                </div>
              </label>
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
                  disabled={sending}
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
