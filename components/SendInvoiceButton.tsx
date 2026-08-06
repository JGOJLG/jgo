"use client";

import { type FormEvent, useState } from "react";

type Props = {
  clientId: number;
  clientName: string;
  clientEmail: string | null;
};

const services = [
  { label: "Resume", price: "250" },
  { label: "Cover Letter", price: "250" },
  { label: "Resume + Cover Letter", price: "400" },
  { label: "Career Coaching", price: "250" },
  { label: "Other", price: "" },
];

export default function SendInvoiceButton({
  clientId,
  clientName,
  clientEmail,
}: Props) {
  const [open, setOpen] = useState(false);
  const [service, setService] = useState("");
  const [customService, setCustomService] = useState("");
  const [price, setPrice] = useState("");
  const [email, setEmail] = useState(clientEmail ?? "");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const finalService =
    service === "Other" ? customService.trim() : service;

  function resetForm() {
    setService("");
    setCustomService("");
    setPrice("");
    setEmail(clientEmail ?? "");
    setMessage("");
    setErrorMessage("");
    setSuccessMessage("");
  }

  function closeModal() {
    if (sending) {
      return;
    }

    setOpen(false);
    resetForm();
  }

  function handleServiceChange(value: string) {
    setService(value);

    const selectedService = services.find(
      (item) => item.label === value
    );

    setPrice(selectedService?.price ?? "");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!email.trim()) {
      setErrorMessage(
        "Please add an email address before sending the invoice."
      );
      return;
    }

    if (!finalService) {
      setErrorMessage("Please select or enter a service.");
      return;
    }

    const numericPrice = Number(price);

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0
    ) {
      setErrorMessage("Please enter a valid price.");
      return;
    }

    setSending(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/invoices/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId,
          clientName,
          clientEmail: email.trim(),
          service: finalService,
          price: numericPrice,
          message: message.trim(),
        }),
      });

      const result = (await response.json()) as {
        error?: string;
        detail?: string;
      };

      if (!response.ok) {
        throw new Error(
          result.detail ||
            result.error ||
            "Unable to send the invoice."
        );
      }

      setSuccessMessage(
        `Invoice sent successfully to ${email.trim()}.`
      );

      window.setTimeout(() => {
        setOpen(false);
        resetForm();
        window.location.reload();
      }, 1400);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to send the invoice."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setEmail(clientEmail ?? "");
        }}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-[#cbd8c4] bg-white px-6 py-3 text-sm font-bold text-[#4d6247] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f5f7f2] hover:shadow-md"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path
            d="M4 5h16v14H4V5Zm0 2 8 6 8-6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Send Invoice
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-[#172019]/45 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="mx-auto my-8 w-full max-w-2xl overflow-hidden rounded-[30px] border border-white/80 bg-[#fbfcf9] shadow-[0_35px_110px_rgba(39,52,39,0.30)]">
            <div className="flex items-start justify-between border-b border-[#e4e9df] bg-[linear-gradient(145deg,#edf4e9,#ffffff)] p-6 lg:p-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7f9975]">
                  JGO Hire
                </p>

                <h2 className="mt-2 text-3xl font-bold text-[#243128]">
                  Send Invoice
                </h2>

                <p className="mt-2 text-sm text-[#708075]">
                  Send a simple payment email to {clientName}.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                aria-label="Close invoice form"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d7e1d0] bg-white text-[#708075] transition hover:text-[#243128]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid gap-5 p-6 md:grid-cols-2 lg:p-8">
                <label className="md:col-span-2">
                  <span className={labelStyle}>
                    Client Email
                  </span>

                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    className={inputStyle}
                    placeholder="client@email.com"
                  />
                </label>

                <label>
                  <span className={labelStyle}>Service</span>

                  <select
                    required
                    value={service}
                    onChange={(event) =>
                      handleServiceChange(event.target.value)
                    }
                    className={inputStyle}
                  >
                    <option value="">Select service</option>

                    {services.map((item) => (
                      <option
                        key={item.label}
                        value={item.label}
                      >
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className={labelStyle}>Price</span>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#708075]">
                      $
                    </span>

                    <input
                      type="number"
                      required
                      min="1"
                      step="0.01"
                      value={price}
                      onChange={(event) =>
                        setPrice(event.target.value)
                      }
                      className={`${inputStyle} pl-8`}
                      placeholder="0.00"
                    />
                  </div>
                </label>

                {service === "Other" ? (
                  <label className="md:col-span-2">
                    <span className={labelStyle}>
                      Custom Service
                    </span>

                    <input
                      required
                      value={customService}
                      onChange={(event) =>
                        setCustomService(event.target.value)
                      }
                      className={inputStyle}
                      placeholder="Enter the service name"
                    />
                  </label>
                ) : null}

                <label className="md:col-span-2">
                  <span className={labelStyle}>
                    Optional Message
                  </span>

                  <textarea
                    rows={4}
                    value={message}
                    onChange={(event) =>
                      setMessage(event.target.value)
                    }
                    className={`${inputStyle} resize-y`}
                    placeholder="Add a short personal message..."
                  />
                </label>

                <div className="md:col-span-2 rounded-2xl border border-[#dfe6db] bg-[#f4f7f1] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7f9975]">
                    Payment Options Included
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[#647066]">
                    Venmo and Zelle will show as fee-free
                    options. The card button will open a unique
                    Stripe checkout for this invoice plus the
                    3% card fee.
                  </p>
                </div>

                {errorMessage ? (
                  <div className="md:col-span-2 rounded-xl border border-[#ead4d0] bg-[#fbefed] p-4 text-sm font-medium text-[#8d4f48]">
                    {errorMessage}
                  </div>
                ) : null}

                {successMessage ? (
                  <div className="md:col-span-2 rounded-xl border border-[#cdddc7] bg-[#edf5e9] p-4 text-sm font-semibold text-[#4d6948]">
                    {successMessage}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-[#e4e9df] p-6 sm:flex-row sm:justify-end lg:px-8">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={sending}
                  className="rounded-xl border border-[#d7e1d0] bg-white px-5 py-3 text-sm font-semibold text-[#4d6247] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={sending}
                  className="rounded-xl bg-[#647d5b] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#526b4b] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending
                    ? "Sending Invoice..."
                    : "Send Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

const labelStyle =
  "text-sm font-semibold text-[#3d4d39]";

const inputStyle =
  "mt-2 w-full rounded-xl border border-[#d7e1d0] bg-white px-4 py-3 text-sm text-[#243128] outline-none placeholder:text-[#9aa59c] focus:border-[#9fb294] focus:ring-2 focus:ring-[#e8eee3]";
