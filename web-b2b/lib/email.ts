import nodemailer from "nodemailer";
import { CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/contact";

type EmailInput = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail(input: EmailInput) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("[email skipped]", input.subject, "→", input.to);
    return { skipped: true };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  return transporter.sendMail({
    from: process.env.EMAIL_FROM || "Butterfly Fashion Trading <orders@butterfly-fashion.ca>",
    ...input,
  });
}

function btn(text: string, href: string) {
  return `<p style="margin:20px 0 0;">
    <a href="${href}" style="display:inline-block;background:#166534;color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:8px;">${text}</a>
  </p>`;
}

export function emailHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#F7F8F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#111827;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr>
          <td style="background:#166534;border-radius:10px 10px 0 0;padding:20px 28px;">
            <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.6);">Butterfly Fashion Trading</p>
            <p style="margin:6px 0 0;font-size:20px;font-weight:900;color:#fff;">${title}</p>
          </td>
        </tr>
        <tr>
          <td style="background:#fff;padding:28px 28px 32px;border-left:1px solid #E5E7EB;border-right:1px solid #E5E7EB;font-size:14px;line-height:1.75;color:#374151;">
            ${body}
          </td>
        </tr>
        <tr>
          <td style="background:#F0FDF4;border:1px solid #BBF7D0;border-top:none;border-radius:0 0 10px 10px;padding:14px 28px;">
            <p style="margin:0;font-size:11px;color:#166534;font-weight:600;">Butterfly Fashion Trading · 178 Bentworth Ave, North York, ON M6A 1P7</p>
            <p style="margin:4px 0 0;font-size:11px;color:#166534;opacity:0.7;">B2B Wholesale · Toronto, Canada</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Pre-built email templates ──────────────────────────────────────────────────

export function registrationEmail(name: string, siteOrigin: string) {
  return emailHtml("Account created", `
    <p>Hi ${name},</p>
    <p>Your Butterfly Fashion B2B account has been created. We're reviewing your application and will notify you once you're approved for wholesale pricing — typically within 24 hours.</p>
    <p style="margin:16px 0 0;"><strong>While you wait:</strong> you can browse our catalog and pre-select products. Pricing and ordering will unlock after approval.</p>
    ${btn("Browse the catalog →", `${siteOrigin}/products`)}
  `);
}

export function orderReceivedEmail(businessName: string, orderId: string, siteOrigin: string) {
  return emailHtml("Order request received", `
    <p>Hi ${businessName},</p>
    <p>We've received your wholesale order request. Our team will review availability, confirm final pricing and delivery details, and send you a <strong>Pay Now</strong> link once approved.</p>
    <table style="width:100%;margin:16px 0;border-collapse:collapse;">
      <tr><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-size:13px;color:#6B7280;">Order ID</td><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-size:13px;font-weight:700;text-align:right;font-family:monospace;">#${orderId.slice(0, 8).toUpperCase()}</td></tr>
    </table>
    <p style="font-size:13px;color:#6B7280;">No payment is collected until the order is reviewed and approved.</p>
    ${btn("View your order →", `${siteOrigin}/account/orders/${orderId}`)}
  `);
}

export function adminNewOrderEmail(businessName: string, orderId: string, siteOrigin: string) {
  return emailHtml("New order request", `
    <p>A new wholesale order request has been submitted.</p>
    <table style="width:100%;margin:16px 0;border-collapse:collapse;">
      <tr><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-size:13px;color:#6B7280;">Customer</td><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-size:13px;font-weight:700;text-align:right;">${businessName}</td></tr>
      <tr><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-size:13px;color:#6B7280;">Order ID</td><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-size:13px;font-weight:700;text-align:right;font-family:monospace;">#${orderId.slice(0, 8).toUpperCase()}</td></tr>
    </table>
    ${btn("Review order →", `${siteOrigin}/admin/orders/${orderId}`)}
  `);
}

export function adminNewLeadEmail(lead: {
  name?: string | null;
  company?: string | null;
  email: string;
  phone?: string | null;
  expectedQuantity?: string | null;
  message?: string | null;
  source?: string | null;
}, siteOrigin: string) {
  const row = (label: string, value?: string | null) =>
    value
      ? `<tr><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-size:13px;color:#6B7280;">${label}</td><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-size:13px;font-weight:700;text-align:right;">${value}</td></tr>`
      : "";
  return emailHtml("New wholesale catalog request", `
    <p>A new wholesale lead just requested the catalog.</p>
    <table style="width:100%;margin:16px 0;border-collapse:collapse;">
      ${row("Company", lead.company)}
      ${row("Name", lead.name)}
      ${row("Email", lead.email)}
      ${row("Phone", lead.phone)}
      ${row("Est. quantity", lead.expectedQuantity)}
      ${row("Source", lead.source)}
    </table>
    ${lead.message ? `<p style="font-size:13px;color:#374151;"><strong>Message:</strong><br/>${lead.message}</p>` : ""}
    ${btn("View leads →", `${siteOrigin}/admin/leads`)}
  `);
}

export function adminNewMessageEmail(businessName: string, profileId: string, siteOrigin: string) {
  return emailHtml("New customer message", `
    <p><strong>${businessName}</strong> just sent a new message in the support chat.</p>
    <p style="font-size:13px;color:#6B7280;">Open the admin panel to read and reply.</p>
    ${btn("View message →", `${siteOrigin}/admin/messages/${profileId}`)}
  `);
}

export function paymentLinkEmail(businessName: string, orderId: string, paymentLink: string, siteOrigin: string) {
  return emailHtml("Your order is approved — pay now", `
    <p>Hi ${businessName},</p>
    <p>Your wholesale order has been reviewed and approved. Click the button below to complete your payment securely.</p>
    <table style="width:100%;margin:16px 0;border-collapse:collapse;">
      <tr><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-size:13px;color:#6B7280;">Order ID</td><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-size:13px;font-weight:700;text-align:right;font-family:monospace;">#${orderId.slice(0, 8).toUpperCase()}</td></tr>
    </table>
    ${btn("Complete payment →", paymentLink)}
    <p style="margin:16px 0 0;font-size:12px;color:#9CA3AF;">Or copy this link: <a href="${paymentLink}" style="color:#166534;">${paymentLink}</a></p>
  `);
}

export function cardByTextPaymentEmail(businessName: string, orderId: string, amountDue: string) {
  return emailHtml("Your order is approved — pay by card", `
    <p>Hi ${businessName},</p>
    <p>Your wholesale order has been reviewed and approved. To pay by card, text your card number, expiry date, CVC, and billing postal code to <strong>${CONTACT_PHONE}</strong> and we'll process it manually.</p>
    <table style="width:100%;margin:16px 0;border-collapse:collapse;">
      <tr><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-size:13px;color:#6B7280;">Order ID</td><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-size:13px;font-weight:700;text-align:right;font-family:monospace;">#${orderId.slice(0, 8).toUpperCase()}</td></tr>
      <tr><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-size:13px;color:#6B7280;">Amount due</td><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-size:13px;font-weight:700;text-align:right;">${amountDue}</td></tr>
    </table>
  `);
}

export function eTransferPaymentEmail(businessName: string, orderId: string, amountDue: string) {
  return emailHtml("Your order is approved — pay by e-Transfer", `
    <p>Hi ${businessName},</p>
    <p>Your wholesale order has been reviewed and approved. Please send an Interac e-Transfer for the amount below to <strong>${CONTACT_EMAIL}</strong> and include your order number in the message.</p>
    <table style="width:100%;margin:16px 0;border-collapse:collapse;">
      <tr><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-size:13px;color:#6B7280;">Order ID</td><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-size:13px;font-weight:700;text-align:right;font-family:monospace;">#${orderId.slice(0, 8).toUpperCase()}</td></tr>
      <tr><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-size:13px;color:#6B7280;">Amount due</td><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-size:13px;font-weight:700;text-align:right;">${amountDue}</td></tr>
    </table>
  `);
}

export function payAtPickupEmail(businessName: string, orderId: string, amountDue: string) {
  return emailHtml("Your order is approved — ready for pickup", `
    <p>Hi ${businessName},</p>
    <p>Your wholesale order has been reviewed and approved, and is ready for pickup. Pay in person by cash or card when you collect it — no payment is needed in advance.</p>
    <table style="width:100%;margin:16px 0;border-collapse:collapse;">
      <tr><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-size:13px;color:#6B7280;">Order ID</td><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-size:13px;font-weight:700;text-align:right;font-family:monospace;">#${orderId.slice(0, 8).toUpperCase()}</td></tr>
      <tr><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-size:13px;color:#6B7280;">Amount due</td><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-size:13px;font-weight:700;text-align:right;">${amountDue}</td></tr>
    </table>
  `);
}

export function manualPaymentEmail(businessName: string, orderId: string, amountDue: string, method: string) {
  return emailHtml("Your order is approved — payment details", `
    <p>Hi ${businessName},</p>
    <p>Your wholesale order has been reviewed and approved. We'll be in touch to arrange payment via <strong>${method}</strong>.</p>
    <table style="width:100%;margin:16px 0;border-collapse:collapse;">
      <tr><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-size:13px;color:#6B7280;">Order ID</td><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-size:13px;font-weight:700;text-align:right;font-family:monospace;">#${orderId.slice(0, 8).toUpperCase()}</td></tr>
      <tr><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-size:13px;color:#6B7280;">Amount due</td><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-size:13px;font-weight:700;text-align:right;">${amountDue}</td></tr>
    </table>
  `);
}

export function paymentReceivedEmail(businessName: string, orderId: string, invoiceNumber: string, siteOrigin: string) {
  return emailHtml("Payment received — thank you!", `
    <p>Hi ${businessName},</p>
    <p>We've received your payment. Your invoice has been created and your order is being processed.</p>
    <table style="width:100%;margin:16px 0;border-collapse:collapse;">
      <tr><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-size:13px;color:#6B7280;">Invoice</td><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-size:13px;font-weight:700;text-align:right;font-family:monospace;">${invoiceNumber}</td></tr>
      <tr><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-size:13px;color:#6B7280;">Order ID</td><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-size:13px;font-weight:700;text-align:right;font-family:monospace;">#${orderId.slice(0, 8).toUpperCase()}</td></tr>
    </table>
    ${btn("View invoice →", `${siteOrigin}/account/orders/${orderId}/invoice`)}
  `);
}

export function adminOrderPaidEmail(businessName: string, orderId: string, invoiceNumber: string, siteOrigin: string) {
  return emailHtml("Order paid", `
    <p>Order <strong>${invoiceNumber}</strong> has been paid.</p>
    <table style="width:100%;margin:16px 0;border-collapse:collapse;">
      <tr><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-size:13px;color:#6B7280;">Customer</td><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-size:13px;font-weight:700;text-align:right;">${businessName}</td></tr>
      <tr><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-size:13px;color:#6B7280;">Invoice</td><td style="padding:8px 0;border-top:1px solid #E5E7EB;font-size:13px;font-weight:700;text-align:right;font-family:monospace;">${invoiceNumber}</td></tr>
    </table>
    ${btn("View order →", `${siteOrigin}/admin/orders/${orderId}`)}
  `);
}

export function b2bApprovedEmail(name: string, siteOrigin: string) {
  return emailHtml("B2B account approved", `
    <p>Hi ${name},</p>
    <p>Great news — your B2B account has been <strong>approved</strong>. You now have access to wholesale pricing and can place orders directly through our portal.</p>
    ${btn("Start ordering →", `${siteOrigin}/products`)}
    <p style="margin:16px 0 0;font-size:13px;color:#6B7280;">Questions? Reply to this email or contact us directly.</p>
  `);
}

export function b2bRejectedEmail(name: string) {
  return emailHtml("B2B account update", `
    <p>Hi ${name},</p>
    <p>Thank you for applying for a Butterfly Fashion B2B account. After review, we're unable to approve your application at this time.</p>
    <p>If you believe this is an error or would like to discuss your application, please reply to this email.</p>
  `);
}
