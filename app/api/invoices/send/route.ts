import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";

import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const resendApiKey = process.env.RESEND_API_KEY;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey)
  : null;

const resend = resendApiKey
  ? new Resend(resendApiKey)
  : null;

const VENMO_URL = "https://venmo.com/u/jengordon";
const VENMO_HANDLE = "@jengordon";
const ZELLE_NUMBER = "908-477-5032";
const CARD_FEE_RATE = 0.03;

type InvoiceRequest = {
  clientId?: number;
  clientName?: string;
  clientEmail?: string;
  service?: string;
  price?: number;
  message?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Unknown error";
}

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json(
      {
        error: "Stripe is not configured.",
        detail: "Missing STRIPE_SECRET_KEY.",
      },
      { status: 500 }
    );
  }

  if (!resend) {
    return NextResponse.json(
      {
        error: "Email is not configured.",
        detail: "Missing RESEND_API_KEY.",
      },
      { status: 500 }
    );
  }

  let body: InvoiceRequest;

  try {
    body = (await request.json()) as InvoiceRequest;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const clientId = Number(body.clientId);
  const clientName = String(body.clientName || "").trim();
  const clientEmail = String(body.clientEmail || "")
    .trim()
    .toLowerCase();
  const service = String(body.service || "").trim();
  const price = Number(body.price);
  const personalMessage = String(body.message || "").trim();

  if (!Number.isInteger(clientId) || clientId <= 0) {
    return NextResponse.json(
      { error: "Invalid client ID." },
      { status: 400 }
    );
  }

  if (!clientName || !clientEmail || !service) {
    return NextResponse.json(
      {
        error:
          "Client name, client email, and service are required.",
      },
      { status: 400 }
    );
  }

  if (
    !Number.isFinite(price) ||
    price <= 0 ||
    price > 100000
  ) {
    return NextResponse.json(
      { error: "Enter a valid invoice price." },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: client, error: clientError } =
    await supabase
      .from("clients")
      .select("id, name, email, status")
      .eq("id", clientId)
      .maybeSingle();

  if (clientError || !client) {
    return NextResponse.json(
      {
        error: "Client could not be found.",
        detail: clientError?.message,
      },
      { status: 404 }
    );
  }

  const baseAmountCents = Math.round(price * 100);
  const cardTotalCents = Math.round(
    baseAmountCents * (1 + CARD_FEE_RATE)
  );
  const cardFeeAmount =
    (cardTotalCents - baseAmountCents) / 100;
  const cardTotal = cardTotalCents / 100;

  try {
    /*
      Stripe supports creating a one-time Checkout Session
      with inline price_data and an amount in cents.
    */
    const checkoutSession =
      await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: clientEmail,
        client_reference_id: String(clientId),
        success_url:
          "https://www.jgohire.com/?payment=success",
        cancel_url:
          "https://www.jgohire.com/?payment=cancelled",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: cardTotalCents,
              product_data: {
                name: `JGO Hire: ${service}`,
                description: `${formatCurrency(
                  price
                )} service + ${formatCurrency(
                  cardFeeAmount
                )} card processing fee`,
              },
            },
          },
        ],
        metadata: {
          source: "jgo_os_invoice",
          client_id: String(clientId),
          client_name: clientName,
          client_email: clientEmail,
          service,
          base_price: price.toFixed(2),
          card_fee: cardFeeAmount.toFixed(2),
        },
        payment_intent_data: {
          metadata: {
            source: "jgo_os_invoice",
            client_id: String(clientId),
            service,
            base_price: price.toFixed(2),
          },
        },
      });

    if (!checkoutSession.url) {
      throw new Error(
        "Stripe did not return a checkout URL."
      );
    }

    const { data: existingServices, error: serviceLookupError } =
      await supabase
        .from("client_services")
        .select("id, payment_status")
        .eq("client_id", clientId)
        .eq("service", service)
        .order("date_added", { ascending: false })
        .limit(10);

    if (serviceLookupError) {
      throw new Error(serviceLookupError.message);
    }

    const reusableService = (existingServices ?? []).find(
      (item) =>
        String(item.payment_status || "")
          .trim()
          .toLowerCase() !== "paid"
    );

    let serviceId: number;

    if (reusableService) {
      const { error: updateError } = await supabase
        .from("client_services")
        .update({
          price,
          payment_status: "Invoice Sent",
          status: "Selected",
          date_added: new Date()
            .toISOString()
            .slice(0, 10),
          notes: personalMessage || null,
        })
        .eq("id", reusableService.id)
        .eq("client_id", clientId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      serviceId = reusableService.id;
    } else {
      const { data: insertedService, error: insertError } =
        await supabase
          .from("client_services")
          .insert({
            client_id: clientId,
            service,
            price,
            status: "Selected",
            payment_status: "Invoice Sent",
            date_added: new Date()
              .toISOString()
              .slice(0, 10),
            scheduled_date: null,
            notes: personalMessage || null,
          })
          .select("id")
          .single();

      if (insertError || !insertedService) {
        throw new Error(
          insertError?.message ||
            "Unable to save the invoice service."
        );
      }

      serviceId = insertedService.id;
    }

    const leadStatuses = [
      "lead",
      "free 15 scheduled",
      "free 15 completed",
    ];

    if (
      leadStatuses.includes(
        String(client.status || "lead")
          .trim()
          .toLowerCase()
      )
    ) {
      await supabase
        .from("clients")
        .update({ status: "Active" })
        .eq("id", clientId);
    }

    const firstName = getFirstName(clientName);
    const safeName = escapeHtml(clientName);
    const safeEmail = escapeHtml(clientEmail);
    const safeService = escapeHtml(service);
    const safeMessage = escapeHtml(personalMessage);
    const safeCheckoutUrl = escapeHtml(
      checkoutSession.url
    );
    const safeVenmoUrl = escapeHtml(VENMO_URL);

    const emailResult = await resend.emails.send({
      from: "JGO Hire <jen@jgohire.com>",
      to: [clientEmail],
      replyTo: "jen@jgohire.com",
      subject: `JGO Hire invoice for ${service}`,
      text: [
        `Hi ${firstName},`,
        "",
        personalMessage ||
          "Thank you for choosing JGO Hire. Your invoice details and payment options are below.",
        "",
        `Client: ${clientName}`,
        `Email: ${clientEmail}`,
        `Service: ${service}`,
        `Amount due: ${formatCurrency(price)}`,
        "",
        "PAYMENT OPTIONS",
        "",
        `Venmo, no fee: ${VENMO_HANDLE}`,
        VENMO_URL,
        "",
        `Zelle, preferred and no fee: ${ZELLE_NUMBER}`,
        "Please include your name in the payment memo.",
        "",
        `Card through Stripe: ${formatCurrency(
          cardTotal
        )} total, including ${formatCurrency(
          cardFeeAmount
        )} card fee`,
        checkoutSession.url,
        "",
        "Please include your name with Venmo or Zelle so your payment can be matched correctly.",
        "",
        "Best,",
        "Jen",
        "JGO Hire",
      ].join("\n"),
      html: `
        <div style="margin:0;background:#f4f8f2;padding:34px 16px;font-family:Arial,Helvetica,sans-serif;color:#243128;">
          <div style="max-width:680px;margin:0 auto;">
            <div style="background:#dfe9d9;border-radius:28px;padding:34px 28px;text-align:center;border:1px solid rgba(83,104,76,.10);">
              <div style="width:48px;height:48px;margin:0 auto 14px;border-radius:999px;background:#ffffff;display:flex;align-items:center;justify-content:center;color:#53684c;font-size:20px;font-weight:800;">
                J
              </div>

              <p style="margin:0 0 12px;color:#53684c;font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;">
                JGO Hire
              </p>

              <h1 style="margin:0;font-size:34px;line-height:1.05;color:#151512;">
                Invoice
              </h1>

              <p style="margin:12px 0 0;color:#455244;font-size:16px;">
                Hi ${escapeHtml(firstName)}, here are your service and payment details.
              </p>
            </div>

            <div style="margin-top:18px;background:#ffffff;border:1px solid rgba(83,104,76,.14);border-radius:24px;padding:28px;">
              ${
                personalMessage
                  ? `<p style="margin:0 0 22px;color:#556157;font-size:15px;line-height:1.6;">${safeMessage}</p>`
                  : ""
              }

              <table role="presentation" style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:10px 0;color:#66705f;font-size:13px;">Client</td>
                  <td style="padding:10px 0;text-align:right;color:#243128;font-size:14px;font-weight:700;">${safeName}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;color:#66705f;font-size:13px;border-top:1px solid #edf0ea;">Email</td>
                  <td style="padding:10px 0;text-align:right;color:#243128;font-size:14px;border-top:1px solid #edf0ea;">${safeEmail}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;color:#66705f;font-size:13px;border-top:1px solid #edf0ea;">Service</td>
                  <td style="padding:10px 0;text-align:right;color:#243128;font-size:14px;font-weight:700;border-top:1px solid #edf0ea;">${safeService}</td>
                </tr>
                <tr>
                  <td style="padding:16px 0 0;color:#53684c;font-size:14px;font-weight:700;border-top:1px solid #edf0ea;">Amount Due</td>
                  <td style="padding:16px 0 0;text-align:right;color:#151512;font-size:26px;font-weight:800;border-top:1px solid #edf0ea;">${escapeHtml(
                    formatCurrency(price)
                  )}</td>
                </tr>
              </table>
            </div>

            <p style="margin:24px 0 12px;text-align:center;color:#66705f;font-size:14px;line-height:1.55;">
              Choose the payment option that works best for you.
            </p>

            <div style="background:#ffffff;border:1px solid rgba(83,104,76,.14);border-radius:22px;padding:22px;margin-top:12px;">
              <div style="display:inline-block;background:#e7eee3;color:#53684c;border-radius:999px;padding:7px 11px;font-size:11px;font-weight:700;">
                No processing fee
              </div>

              <h2 style="margin:14px 0 8px;font-size:23px;color:#151512;">
                Venmo
              </h2>

              <p style="margin:0 0 18px;color:#66705f;font-size:14px;line-height:1.5;">
                Pay via Venmo at <strong>${escapeHtml(
                  VENMO_HANDLE
                )}</strong>. Please include your name in the memo.
              </p>

              <a href="${safeVenmoUrl}" style="display:block;background:#8fa985;color:#ffffff;text-decoration:none;text-align:center;border-radius:15px;padding:14px 18px;font-size:14px;font-weight:700;">
                Pay with Venmo
              </a>
            </div>

            <div style="background:#ffffff;border:1px solid rgba(83,104,76,.14);border-radius:22px;padding:22px;margin-top:12px;">
              <div style="display:inline-block;background:#e7eee3;color:#53684c;border-radius:999px;padding:7px 11px;font-size:11px;font-weight:700;">
                Preferred • No fee
              </div>

              <h2 style="margin:14px 0 8px;font-size:23px;color:#151512;">
                Zelle
              </h2>

              <p style="margin:0;color:#66705f;font-size:14px;line-height:1.5;">
                Open your banking app and send payment to:
              </p>

              <p style="margin:10px 0 0;background:#e7eee3;border-radius:16px;padding:16px;color:#151512;font-size:24px;font-weight:800;text-align:center;">
                ${escapeHtml(ZELLE_NUMBER)}
              </p>

              <p style="margin:12px 0 0;color:#66705f;font-size:12px;text-align:center;">
                Please include your name in the payment memo.
              </p>
            </div>

            <div style="background:#ffffff;border:1px solid rgba(83,104,76,.14);border-radius:22px;padding:22px;margin-top:12px;">
              <div style="display:inline-block;background:#e7eee3;color:#53684c;border-radius:999px;padding:7px 11px;font-size:11px;font-weight:700;">
                3% card fee included
              </div>

              <h2 style="margin:14px 0 8px;font-size:23px;color:#151512;">
                Pay by Card
              </h2>

              <p style="margin:0 0 8px;color:#66705f;font-size:14px;line-height:1.5;">
                Secure card checkout through Stripe.
              </p>

              <p style="margin:0 0 18px;color:#243128;font-size:14px;font-weight:700;">
                Card total: ${escapeHtml(
                  formatCurrency(cardTotal)
                )}
              </p>

              <a href="${safeCheckoutUrl}" style="display:block;background:#53684c;color:#ffffff;text-decoration:none;text-align:center;border-radius:15px;padding:14px 18px;font-size:14px;font-weight:700;">
                Pay Securely by Card
              </a>
            </div>

            <div style="margin-top:18px;background:#ffffff;border:1px solid rgba(83,104,76,.14);border-radius:18px;padding:18px;text-align:center;color:#66705f;font-size:13px;line-height:1.55;">
              <strong style="color:#53684c;">Payment reminder:</strong>
              Please include your name with Venmo or Zelle so your payment can be matched correctly.
            </div>

            <p style="margin:24px 0 0;text-align:center;color:#66705f;font-size:13px;line-height:1.6;">
              Best,<br />
              <strong style="color:#53684c;">Jen</strong><br />
              JGO Hire
            </p>
          </div>
        </div>
      `,
    });

    if (emailResult.error) {
      await supabase
        .from("client_services")
        .update({ payment_status: "Open" })
        .eq("id", serviceId)
        .eq("client_id", clientId);

      throw new Error(
        `Resend error: ${JSON.stringify(
          emailResult.error
        )}`
      );
    }

    return NextResponse.json({
      sent: true,
      serviceId,
      checkoutUrl: checkoutSession.url,
      emailId: emailResult.data?.id ?? null,
    });
  } catch (error) {
    const detail = getErrorMessage(error);

    console.error("Unable to send JGO Hire invoice:", error);

    return NextResponse.json(
      {
        error: "Unable to send the invoice.",
        detail,
      },
      { status: 500 }
    );
  }
}
