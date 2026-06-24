import nodemailer from "nodemailer";

export const COLD_EMAIL_SOURCE = "cold-email";
export const DAILY_COLD_EMAIL_LIMIT = 20;

export type ColdEmailMeta = {
  city?: string;
  province?: string;
  segment?: string;
  sourceUrl?: string;
  sentAt?: string;
  error?: string;
};

export type ColdEmailRecipient = {
  id: string;
  company: string | null;
  email: string;
  message: string | null;
};

const REPLY_TO = "jameskimkim1@gmail.com";
const BUSINESS = "Butterfly Fashion Trading";
const PHONE = "416-785-5999";
const SITE = "mask12.com";
const ADDRESS = "178 Bentworth Ave, North York, ON";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function parseColdEmailMeta(message: string | null): ColdEmailMeta {
  if (!message) return {};
  try {
    return JSON.parse(message) as ColdEmailMeta;
  } catch {
    return {};
  }
}

function template(segment: string, store: string, city: string) {
  const normalized = segment.toLowerCase();

  if (normalized.startsWith("soccer") || normalized.startsWith("world")) {
    return {
      subject: "World Cup 2026 fan gear — wholesale from Toronto",
      paragraphs: [
        `Hi ${store} team,`,
        `I'm James with ${BUSINESS}, a wholesale supplier in Toronto. With the 2026 World Cup coming to Canada, we're supplying fan gear — Canada jerseys & shorts sets, 3D-embroidered country caps, and car flags — to shops like yours in ${city}.`,
        "Ships from Toronto, no minimum order, with case pricing for better margins. Great impulse and seasonal sell-through as the tournament builds.",
        `You can see our full wholesale range anytime at ${SITE}. Want wholesale pricing? Reply “yes” and it's on its way.`,
      ],
    };
  }

  if (normalized.startsWith("winter")) {
    return {
      subject: "Winter gloves & hats — wholesale from Toronto",
      paragraphs: [
        `Hi ${store} team,`,
        `I'm James with ${BUSINESS} in Toronto. We wholesale winter basics — gloves, beanies, neck warmers, and ski masks — the everyday items that move fast once the cold hits in ${city}.`,
        "We ship Canada-wide from Toronto, with no minimum order, case pricing for better margins, and easy reorders through the season.",
        `You can see our full wholesale range anytime at ${SITE}. Want wholesale pricing? Reply “yes” and it's on its way.`,
      ],
    };
  }

  return {
    subject: `Squishy toys for ${store}? (Toronto wholesale)`,
    paragraphs: [
      `Hi ${store} team,`,
      `I'm James with ${BUSINESS}, a wholesale supplier in Toronto. We stock squishy and fidget toys plus other novelty impulse items that sell well at the counter in shops like yours in ${city}.`,
      "Everything ships from Toronto — no overseas wait, no minimum order, and better per-unit pricing by the case, with quick restocks.",
      `You can see our full wholesale range anytime at ${SITE}. Want wholesale pricing? Just reply “yes” and I'll send it over.`,
    ],
  };
}

export function buildColdEmail(recipient: ColdEmailRecipient) {
  const meta = parseColdEmailMeta(recipient.message);
  const store = recipient.company?.trim() || "there";
  const city = meta.city?.trim() || "your area";
  const content = template(meta.segment || "squishy", store, city);
  const unsubscribe = `mailto:${REPLY_TO}?subject=Unsubscribe`;

  const text = [
    ...content.paragraphs,
    "",
    "Thanks,",
    "James",
    `${BUSINESS} · ${PHONE} · ${SITE}`,
    "",
    `${BUSINESS}, ${ADDRESS}`,
    'Not interested? Reply "unsubscribe" and I’ll remove you.',
  ].join("\n\n");

  const htmlParagraphs = content.paragraphs
    .map((paragraph) => `<p style="margin:0 0 16px">${escapeHtml(paragraph)}</p>`)
    .join("");

  const html = `<!doctype html>
<html lang="en"><body style="margin:0;background:#f7f7f7;font-family:Arial,sans-serif;color:#222">
  <div style="max-width:600px;margin:0 auto;padding:28px 20px">
    <div style="background:#fff;border:1px solid #e5e5e5;border-radius:8px;padding:28px;font-size:15px;line-height:1.65">
      ${htmlParagraphs}
      <p style="margin:24px 0 0">Thanks,<br>James<br><strong>${BUSINESS}</strong> · ${PHONE} · <a href="https://${SITE}">${SITE}</a></p>
      <p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #eee;color:#777;font-size:12px">
        ${BUSINESS}, ${ADDRESS}. Not interested? <a href="${unsubscribe}">Unsubscribe</a> or reply “unsubscribe”.
      </p>
    </div>
  </div>
</body></html>`;

  return { subject: content.subject, text, html };
}

function createTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) throw new Error("SMTP environment variables are missing");

  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendColdEmail(recipient: ColdEmailRecipient) {
  const user = process.env.SMTP_USER;
  if (!user) throw new Error("SMTP_USER is missing");

  const content = buildColdEmail(recipient);
  const info = await createTransport().sendMail({
    from: `James — ${BUSINESS} <${user}>`,
    replyTo: REPLY_TO,
    to: recipient.email,
    subject: content.subject,
    text: content.text,
    html: content.html,
  });

  return info.messageId;
}
