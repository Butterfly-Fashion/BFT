import nodemailer from "nodemailer";
import type Stripe from "stripe";
import { BUSINESS_EMAIL, BUSINESS_NAME, SITE_URL } from "@/lib/seo";
import { SHIPPING_LINE_ITEM_NAME, TAX_LINE_ITEM_NAME, isShippingOrTaxLineItem, sizeFromLineItem } from "@/lib/stripe-line-items";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? BUSINESS_EMAIL;
const FROM = process.env.EMAIL_FROM ?? `${BUSINESS_NAME} <${BUSINESS_EMAIL}>`;
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? SITE_URL;

function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function formatLineItemsHtml(lineItems: Stripe.LineItem[]): string {
  const rows = lineItems.map((item) => {
    const size = sizeFromLineItem(item);
    const name =
      (item.description ?? "Item").replace(/\n/g, " ") + (size ? ` (Size ${size})` : "");
    const qty = item.quantity ?? 1;
    const price = ((item.amount_total ?? 0) / 100).toFixed(2);
    return `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${qty}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">$${price} CAD</td>
      </tr>`;
  });
  return rows.join("");
}

// Admin notification email — sent to jameskimkim1@gmail.com on every paid order
export async function sendAdminOrderEmail(
  session: Stripe.Checkout.Session,
  lineItems: Stripe.LineItem[]
): Promise<void> {
  if (!isSmtpConfigured()) {
    console.warn("[email] SMTP not configured — skipping admin notification email");
    return;
  }

  const meta = session.metadata ?? {};
  const orderId = meta.order_id ?? session.id;
  const total = ((session.amount_total ?? 0) / 100).toFixed(2);
  const adminUrl = `${SITE}/admin`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:Arial,sans-serif;background:#f9f9f9;margin:0;padding:0;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">

    <div style="background:#C41E3A;padding:20px 28px;">
      <p style="color:#fff;font-size:12px;margin:0;letter-spacing:2px;text-transform:uppercase;">Butterfly Fashion Trading</p>
      <h1 style="color:#fff;font-size:22px;margin:6px 0 0;">New Order Received</h1>
    </div>

    <div style="padding:28px;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:6px 0;color:#888;font-size:13px;width:130px;">Order ID</td>
          <td style="padding:6px 0;font-weight:bold;font-size:13px;font-family:monospace;">${orderId}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#888;font-size:13px;">Customer Email</td>
          <td style="padding:6px 0;font-size:13px;">${session.customer_email ?? "—"}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#888;font-size:13px;vertical-align:top;">Ship To</td>
          <td style="padding:6px 0;font-size:13px;line-height:1.6;">
            ${meta.shipping_name ?? "—"}<br>
            ${meta.shipping_address ?? ""}<br>
            ${meta.shipping_city ?? ""}, ${meta.shipping_province ?? ""} ${meta.shipping_postal ?? ""}<br>
            ${meta.shipping_country ?? ""}
          </td>
        </tr>
      </table>

      <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:8px;">Items Ordered</h3>
      <table style="width:100%;border-collapse:collapse;border:1px solid #f0f0f0;border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background:#f9f9f9;">
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#888;font-weight:600;">Product</th>
            <th style="padding:8px 12px;text-align:center;font-size:12px;color:#888;font-weight:600;">Qty</th>
            <th style="padding:8px 12px;text-align:right;font-size:12px;color:#888;font-weight:600;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${formatLineItemsHtml(lineItems)}
        </tbody>
      </table>

      <div style="margin-top:20px;padding:16px;background:#f9f9f9;border-radius:8px;text-align:right;">
        <span style="font-size:18px;font-weight:bold;color:#C41E3A;">Total: $${total} CAD</span>
      </div>

      <div style="margin-top:24px;text-align:center;">
        <a href="${adminUrl}"
          style="display:inline-block;padding:12px 28px;background:#C41E3A;color:#fff;text-decoration:none;border-radius:24px;font-size:13px;font-weight:bold;">
          View Order in Admin →
        </a>
      </div>
    </div>

    <div style="padding:16px 28px;background:#f9f9f9;border-top:1px solid #e5e5e5;text-align:center;">
      <p style="font-size:11px;color:#aaa;margin:0;">Butterfly Fashion Trading · ${SITE}</p>
    </div>
  </div>
</body>
</html>`;

  const transport = createTransport();
  await transport.sendMail({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New Order #${orderId} — $${total} CAD | Butterfly Fashion Trading`,
    html,
  });

  console.log(`[email] Admin notification sent to ${ADMIN_EMAIL} for order ${orderId}`);
}

// Customer confirmation email — sent to the buyer
export async function sendCustomerConfirmationEmail(
  session: Stripe.Checkout.Session,
  lineItems: Stripe.LineItem[]
): Promise<void> {
  if (!isSmtpConfigured()) {
    console.warn("[email] SMTP not configured — skipping customer confirmation email");
    return;
  }

  const customerEmail = session.customer_email;
  if (!customerEmail) {
    console.warn("[email] No customer email in session — skipping customer email");
    return;
  }

  const meta = session.metadata ?? {};
  const orderId = meta.order_id ?? session.id;
  const total = ((session.amount_total ?? 0) / 100).toFixed(2);
  const firstName = (meta.shipping_name ?? "").split(" ")[0] || "there";

  // Filter out Shipping and Tax lines — only show actual products
  const productItems = lineItems.filter((item) => !isShippingOrTaxLineItem(item.description));
  const shippingItem = lineItems.find((item) => item.description === SHIPPING_LINE_ITEM_NAME);
  const taxItem = lineItems.find((item) => item.description === TAX_LINE_ITEM_NAME);

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:Arial,sans-serif;background:#f9f9f9;margin:0;padding:0;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">

    <div style="background:#C41E3A;padding:20px 28px;">
      <p style="color:#fff;font-size:12px;margin:0;letter-spacing:2px;text-transform:uppercase;">Butterfly Fashion Trading</p>
      <h1 style="color:#fff;font-size:22px;margin:6px 0 0;">Order Confirmed!</h1>
    </div>

    <div style="padding:28px;">
      <p style="font-size:15px;color:#333;line-height:1.6;">
        Hi <strong>${firstName}</strong>, thanks for your order!<br>
        We've received your payment and your gear is on its way.
      </p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
        <tr>
          <td style="padding:4px 0;color:#888;font-size:13px;width:110px;">Order ID</td>
          <td style="padding:4px 0;font-weight:bold;font-size:13px;font-family:monospace;">${orderId}</td>
        </tr>
      </table>

      <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#888;margin:20px 0 8px;">Items</h3>
      <table style="width:100%;border-collapse:collapse;border:1px solid #f0f0f0;border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background:#f9f9f9;">
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#888;font-weight:600;">Product</th>
            <th style="padding:8px 12px;text-align:center;font-size:12px;color:#888;font-weight:600;">Qty</th>
            <th style="padding:8px 12px;text-align:right;font-size:12px;color:#888;font-weight:600;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${formatLineItemsHtml(productItems)}
        </tbody>
      </table>

      <div style="margin-top:12px;padding:12px 16px;background:#f9f9f9;border-radius:8px;">
        <div style="display:flex;justify-content:space-between;font-size:13px;color:#666;margin-bottom:4px;">
          <span>Shipping</span>
          <span>${shippingItem ? `$${((shippingItem.amount_total ?? 0) / 100).toFixed(2)} CAD` : "Free"}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px;color:#666;margin-bottom:8px;">
          <span>Tax (HST)</span>
          <span>${taxItem ? `$${((taxItem.amount_total ?? 0) / 100).toFixed(2)} CAD` : "$0.00"}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:bold;color:#111;border-top:1px solid #e5e5e5;padding-top:8px;">
          <span>Total</span>
          <span style="color:#C41E3A;">$${total} CAD</span>
        </div>
      </div>

      <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#888;margin:24px 0 8px;">Shipping To</h3>
      <p style="font-size:13px;color:#333;line-height:1.8;margin:0;">
        ${meta.shipping_name ?? ""}<br>
        ${meta.shipping_address ?? ""}<br>
        ${meta.shipping_city ?? ""}, ${meta.shipping_province ?? ""} ${meta.shipping_postal ?? ""}<br>
        ${meta.shipping_country ?? ""}
      </p>

      <div style="margin-top:28px;padding:16px;background:#fff8f8;border:1px solid #fde8e8;border-radius:8px;">
        <p style="font-size:13px;color:#666;margin:0;">
          Questions about your order? Reply to this email or contact us at
          <a href="mailto:jameskimkim1@gmail.com" style="color:#C41E3A;">jameskimkim1@gmail.com</a>
        </p>
      </div>

      <div style="margin-top:24px;text-align:center;">
        <a href="${SITE}/products"
          style="display:inline-block;padding:12px 28px;background:#C41E3A;color:#fff;text-decoration:none;border-radius:24px;font-size:13px;font-weight:bold;">
          Continue Shopping →
        </a>
      </div>
    </div>

    <div style="padding:16px 28px;background:#f9f9f9;border-top:1px solid #e5e5e5;text-align:center;">
      <p style="font-size:11px;color:#aaa;margin:0;">
        Butterfly Fashion Trading · Ships from North York, Canada<br>
        <a href="${SITE}/returns" style="color:#aaa;">Returns Policy</a> ·
        <a href="${SITE}/shipping" style="color:#aaa;">Shipping Info</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  const transport = createTransport();
  await transport.sendMail({
    from: FROM,
    to: customerEmail,
    subject: `Your Butterfly Fashion Trading order #${orderId} is confirmed!`,
    html,
  });

  console.log(`[email] Customer confirmation sent to ${customerEmail} for order ${orderId}`);
}

// Shipping tracking email — sent when admin marks order as shipped
export async function sendTrackingEmail(params: {
  orderNumber: string;
  customerEmail: string;
  customerName: string | null;
  carrier: string;
  trackingNumber: string;
  trackingUrl: string | null;
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
  total: number;
}): Promise<void> {
  if (!isSmtpConfigured()) {
    console.warn("[email] SMTP not configured — skipping tracking email");
    return;
  }

  const { orderNumber, customerEmail, customerName, carrier, trackingNumber, trackingUrl, items, total } = params;
  const firstName = (customerName ?? "").split(" ")[0] || "there";

  const itemRows = items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${i.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${i.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">$${(i.unitPrice * i.quantity).toFixed(2)} CAD</td>
      </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:Arial,sans-serif;background:#f9f9f9;margin:0;padding:0;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">

    <div style="background:#C41E3A;padding:20px 28px;">
      <p style="color:#fff;font-size:12px;margin:0;letter-spacing:2px;text-transform:uppercase;">Butterfly Fashion Trading</p>
      <h1 style="color:#fff;font-size:22px;margin:6px 0 0;">Your Order Has Shipped!</h1>
    </div>

    <div style="padding:28px;">
      <p style="font-size:15px;color:#333;line-height:1.6;">
        Hi <strong>${firstName}</strong>, great news — your order is on its way!
      </p>

      <div style="background:#f0f7ff;border:1px solid #cce0ff;border-radius:8px;padding:20px;margin:20px 0;">
        <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;font-weight:600;">Tracking Info</p>
        <p style="margin:0 0 4px;font-size:15px;font-weight:bold;color:#111;">${carrier}</p>
        <p style="margin:0 0 ${trackingUrl ? "16px" : "0"};font-size:14px;color:#444;font-family:monospace;">${trackingNumber}</p>
        ${
          trackingUrl
            ? `<a href="${trackingUrl}" style="display:inline-block;padding:10px 24px;background:#1a6fcc;color:#fff;text-decoration:none;border-radius:20px;font-size:13px;font-weight:bold;">Track Your Package →</a>`
            : ""
        }
      </div>

      <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#888;margin:20px 0 8px;">Order #${orderNumber}</h3>
      <table style="width:100%;border-collapse:collapse;border:1px solid #f0f0f0;border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background:#f9f9f9;">
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#888;font-weight:600;">Product</th>
            <th style="padding:8px 12px;text-align:center;font-size:12px;color:#888;font-weight:600;">Qty</th>
            <th style="padding:8px 12px;text-align:right;font-size:12px;color:#888;font-weight:600;">Price</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <div style="margin-top:12px;text-align:right;">
        <span style="font-size:16px;font-weight:bold;color:#C41E3A;">Total: $${total.toFixed(2)} CAD</span>
      </div>

      <div style="margin-top:24px;padding:16px;background:#fff8f8;border:1px solid #fde8e8;border-radius:8px;">
        <p style="font-size:13px;color:#666;margin:0;">
          Questions? Reply to this email or contact
          <a href="mailto:jameskimkim1@gmail.com" style="color:#C41E3A;">jameskimkim1@gmail.com</a>
        </p>
      </div>
    </div>

    <div style="padding:16px 28px;background:#f9f9f9;border-top:1px solid #e5e5e5;text-align:center;">
      <p style="font-size:11px;color:#aaa;margin:0;">Butterfly Fashion Trading · Ships from North York, Canada</p>
    </div>
  </div>
</body>
</html>`;

  const transport = createTransport();
  await transport.sendMail({
    from: FROM,
    to: customerEmail,
    subject: `Your order #${orderNumber} has shipped — ${carrier} ${trackingNumber}`,
    html,
  });

  console.log(`[email] Tracking email sent to ${customerEmail} for order ${orderNumber}`);
}

// Contact message notification — sent to admin when a customer submits a message
export async function sendContactNotificationEmail(params: {
  messageId: string;
  name: string;
  email: string;
  message: string;
}): Promise<void> {
  if (!isSmtpConfigured()) {
    console.warn("[email] SMTP not configured — skipping contact notification email");
    return;
  }

  const { messageId, name, email, message } = params;
  const adminUrl = `${SITE}/admin`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:Arial,sans-serif;background:#f9f9f9;margin:0;padding:0;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">
    <div style="background:#C41E3A;padding:20px 28px;">
      <p style="color:#fff;font-size:12px;margin:0;letter-spacing:2px;text-transform:uppercase;">Butterfly Fashion Trading</p>
      <h1 style="color:#fff;font-size:22px;margin:6px 0 0;">New Customer Message</h1>
    </div>
    <div style="padding:28px;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr>
          <td style="padding:6px 0;color:#888;font-size:13px;width:80px;">From</td>
          <td style="padding:6px 0;font-size:13px;font-weight:bold;">${name}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#888;font-size:13px;">Email</td>
          <td style="padding:6px 0;font-size:13px;"><a href="mailto:${email}" style="color:#C41E3A;">${email}</a></td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#888;font-size:13px;">ID</td>
          <td style="padding:6px 0;font-size:11px;color:#aaa;font-family:monospace;">${messageId}</td>
        </tr>
      </table>
      <div style="background:#f9f9f9;border-radius:8px;padding:16px;border-left:3px solid #C41E3A;">
        <p style="margin:0;font-size:14px;color:#333;line-height:1.7;white-space:pre-wrap;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
      </div>
      <div style="margin-top:24px;text-align:center;">
        <a href="${adminUrl}" style="display:inline-block;padding:12px 28px;background:#C41E3A;color:#fff;text-decoration:none;border-radius:24px;font-size:13px;font-weight:bold;">Reply in Admin →</a>
      </div>
    </div>
    <div style="padding:16px 28px;background:#f9f9f9;border-top:1px solid #e5e5e5;text-align:center;">
      <p style="font-size:11px;color:#aaa;margin:0;">Butterfly Fashion Trading · ${SITE}</p>
    </div>
  </div>
</body>
</html>`;

  const transport = createTransport();
  await transport.sendMail({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New message from ${name} | Butterfly Fashion Trading`,
    html,
  });

  console.log(`[email] Contact notification sent to ${ADMIN_EMAIL} for message ${messageId}`);
}

// Admin reply email — sent to customer when admin replies to their message
export async function sendAdminReplyEmail(params: {
  customerName: string;
  customerEmail: string;
  originalMessage: string;
  adminReply: string;
}): Promise<void> {
  if (!isSmtpConfigured()) {
    console.warn("[email] SMTP not configured — skipping admin reply email");
    return;
  }

  const { customerName, customerEmail, originalMessage, adminReply } = params;
  const firstName = customerName.split(" ")[0] || "there";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:Arial,sans-serif;background:#f9f9f9;margin:0;padding:0;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">
    <div style="background:#C41E3A;padding:20px 28px;">
      <p style="color:#fff;font-size:12px;margin:0;letter-spacing:2px;text-transform:uppercase;">Butterfly Fashion Trading</p>
      <h1 style="color:#fff;font-size:22px;margin:6px 0 0;">We've Replied to Your Message</h1>
    </div>
    <div style="padding:28px;">
      <p style="font-size:15px;color:#333;line-height:1.6;">Hi <strong>${firstName}</strong>,</p>
      <p style="font-size:14px;color:#333;line-height:1.7;">Thank you for reaching out. Here's our reply:</p>
      <div style="background:#f0f7ff;border:1px solid #cce0ff;border-radius:8px;padding:16px;margin:16px 0;border-left:3px solid #1a6fcc;">
        <p style="margin:0;font-size:14px;color:#333;line-height:1.7;white-space:pre-wrap;">${adminReply.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
      </div>
      <p style="font-size:12px;color:#aaa;margin-top:20px;">Your original message:</p>
      <div style="background:#f9f9f9;border-radius:8px;padding:12px;border-left:3px solid #ddd;">
        <p style="margin:0;font-size:13px;color:#888;line-height:1.6;white-space:pre-wrap;">${originalMessage.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
      </div>
      <div style="margin-top:24px;padding:16px;background:#fff8f8;border:1px solid #fde8e8;border-radius:8px;">
        <p style="font-size:13px;color:#666;margin:0;">Have more questions? Reply to this email or contact us at <a href="mailto:${ADMIN_EMAIL}" style="color:#C41E3A;">${ADMIN_EMAIL}</a></p>
      </div>
    </div>
    <div style="padding:16px 28px;background:#f9f9f9;border-top:1px solid #e5e5e5;text-align:center;">
      <p style="font-size:11px;color:#aaa;margin:0;">Butterfly Fashion Trading · ${SITE}</p>
    </div>
  </div>
</body>
</html>`;

  const transport = createTransport();
  await transport.sendMail({
    from: FROM,
    to: customerEmail,
    replyTo: ADMIN_EMAIL,
    subject: `Re: Your message to Butterfly Fashion Trading`,
    html,
  });

  console.log(`[email] Admin reply sent to ${customerEmail}`);
}

// Pickup ready email — sent when admin marks pickup order as ready
export async function sendPickupReadyEmail(params: {
  orderNumber: string;
  customerEmail: string;
  customerName: string | null;
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
  total: number;
}): Promise<void> {
  if (!isSmtpConfigured()) {
    console.warn("[email] SMTP not configured — skipping pickup ready email");
    return;
  }

  const { orderNumber, customerEmail, customerName, items, total } = params;
  const firstName = (customerName ?? "").split(" ")[0] || "there";

  const itemRows = items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${i.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${i.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">$${(i.unitPrice * i.quantity).toFixed(2)} CAD</td>
      </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:Arial,sans-serif;background:#f9f9f9;margin:0;padding:0;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">

    <div style="background:#16a34a;padding:20px 28px;">
      <p style="color:#fff;font-size:12px;margin:0;letter-spacing:2px;text-transform:uppercase;">Butterfly Fashion Trading</p>
      <h1 style="color:#fff;font-size:22px;margin:6px 0 0;">Your Order Is Ready for Pickup!</h1>
    </div>

    <div style="padding:28px;">
      <p style="font-size:15px;color:#333;line-height:1.6;">
        Hi <strong>${firstName}</strong>, your order is ready to be picked up!
      </p>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:20px 0;">
        <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;font-weight:600;">Pickup Location</p>
        <p style="margin:0;font-size:14px;color:#111;">178 Bentworth Ave, North York, ON M6A 1P7</p>
        <p style="margin:4px 0 0;font-size:13px;color:#666;">Mon–Sat: 9 AM – 7 PM &nbsp;|&nbsp; Sun: Closed</p>
      </div>

      <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#888;margin:20px 0 8px;">Order #${orderNumber}</h3>
      <table style="width:100%;border-collapse:collapse;border:1px solid #f0f0f0;border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background:#f9f9f9;">
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#888;font-weight:600;">Product</th>
            <th style="padding:8px 12px;text-align:center;font-size:12px;color:#888;font-weight:600;">Qty</th>
            <th style="padding:8px 12px;text-align:right;font-size:12px;color:#888;font-weight:600;">Price</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <div style="margin-top:12px;text-align:right;">
        <span style="font-size:16px;font-weight:bold;color:#16a34a;">Total: $${total.toFixed(2)} CAD</span>
      </div>

      <div style="margin-top:24px;padding:16px;background:#fff8f8;border:1px solid #fde8e8;border-radius:8px;">
        <p style="font-size:13px;color:#666;margin:0;">
          Questions? Contact us at
          <a href="mailto:jameskimkim1@gmail.com" style="color:#C41E3A;">jameskimkim1@gmail.com</a>
        </p>
      </div>
    </div>

    <div style="padding:16px 28px;background:#f9f9f9;border-top:1px solid #e5e5e5;text-align:center;">
      <p style="font-size:11px;color:#aaa;margin:0;">Butterfly Fashion Trading · 178 Bentworth Ave, North York, Canada</p>
    </div>
  </div>
</body>
</html>`;

  const transport = createTransport();
  await transport.sendMail({
    from: FROM,
    to: customerEmail,
    subject: `Your order #${orderNumber} is ready for pickup!`,
    html,
  });

  console.log(`[email] Pickup ready email sent to ${customerEmail} for order ${orderNumber}`);
}
