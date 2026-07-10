// Jersey clearance follow-up — soccer/sports segment leads only.
// Attaches the $10 CAD jersey clearance catalogue PDF. All targets were
// contacted in the June cold campaign (CASL footer + unsubscribe included).
//   Preview:      node scripts/outreach/send-jersey-clearance.mjs --dry-run
//   Send test:    node scripts/outreach/send-jersey-clearance.mjs --test you@example.com
//   Send batch:   node scripts/outreach/send-jersey-clearance.mjs
// Idempotent: leads with meta.jerseyClearanceSentAt are skipped.
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const require = createRequire(pathToFileURL(join(root, "web-b2c/package.json")));
const nodemailer = require("nodemailer");

const dryRun = process.argv.includes("--dry-run");
const testIdx = process.argv.indexOf("--test");
const testEmail = testIdx >= 0 ? process.argv[testIdx + 1] : null;

const REPLY_TO = "jameskimkim1@gmail.com";
const BUSINESS = "Butterfly Fashion Trading";
const PHONE = "416-785-5999";
const SITE = "mask12.com";
const ADDRESS = "178 Bentworth Ave, North York, ON";
const PDF_PATH = join(root, "web-b2b/Wholesale_Jersey_Clearance_Catalogue_10_CAD.pdf");
const PDF_NAME = "Wholesale_Jersey_Clearance_Catalogue_10_CAD.pdf";

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = rawLine.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    process.env[match[1]] ||= match[2].trim().replace(/^['"]|['"]$/g, "");
  }
}
loadEnv(join(root, "web-b2c/.env.local"));
loadEnv(join(root, ".env.local"));

const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!baseUrl || !serviceKey) throw new Error("Supabase env vars missing");
if (!existsSync(PDF_PATH)) throw new Error(`PDF not found: ${PDF_PATH}`);

const headers = {
  apikey: serviceKey,
  authorization: `Bearer ${serviceKey}`,
  "content-type": "application/json",
};

async function rest(path, init) {
  const res = await fetch(`${baseUrl}/rest/v1/${path}`, { ...init, headers: { ...headers, ...init?.headers } });
  if (!res.ok) throw new Error(`${init?.method || "GET"} ${path} -> ${res.status} ${await res.text()}`);
  return res;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseMeta(message) {
  if (!message) return {};
  try { return JSON.parse(message); } catch { return {}; }
}

function buildEmail(store, city) {
  const subject = "Soccer jersey clearance — $10 CAD each (Toronto wholesale)";
  const paragraphs = [
    `Hi ${store} team,`,
    `James here from ${BUSINESS} in Toronto — I reached out a few weeks back about World Cup fan gear. Quick follow-up with something concrete: we're clearing our national-team soccer jerseys at a flat $10 CAD per jersey.`,
    "Styles include France, Portugal, England, Argentina, Colombia, Ecuador, and Canada (red and black). The full catalogue with photos and item codes is attached — every item on it is $10.",
    `With World Cup excitement at its peak in ${city}, these are an easy margin play right now — and national-team colourways keep selling long after the final, so nothing goes stale on the shelf.`,
    `No minimum order, while clearance stock lasts. To grab some, just reply with the item codes and quantities (e.g. "JER-01 x 20"), or call ${PHONE}. Pickup in North York or we ship across Canada & the US.`,
  ];

  const text = [
    ...paragraphs,
    "",
    "Thanks,",
    "James",
    `${BUSINESS} · ${PHONE} · ${SITE}`,
    "",
    `${BUSINESS}, ${ADDRESS}`,
    'Not interested? Reply "unsubscribe" and I’ll remove you.',
  ].join("\n\n");

  const htmlParagraphs = paragraphs
    .map((p) => `<p style="margin:0 0 16px">${escapeHtml(p)}</p>`)
    .join("");
  const unsubscribe = `mailto:${REPLY_TO}?subject=Unsubscribe`;
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

  return { subject, text, html };
}

function createTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) throw new Error("SMTP env vars missing");
  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

const attachments = [{ filename: PDF_NAME, path: PDF_PATH }];

async function main() {
  // Test mode: one email to yourself, no DB writes.
  if (testEmail) {
    const transport = createTransport();
    const email = buildEmail("Your Store", "Toronto");
    const info = await transport.sendMail({
      from: `James — ${BUSINESS} <${process.env.SMTP_USER}>`,
      replyTo: REPLY_TO,
      to: testEmail,
      subject: `[TEST] ${email.subject}`,
      text: email.text,
      html: email.html,
      attachments,
    });
    transport.close();
    console.log(`Test sent to ${testEmail} (${info.messageId})`);
    return;
  }

  const rows = await (await rest(
    `wholesale_leads?source=eq.cold-email&select=id,company,email,status,message&limit=2000`,
  )).json();

  const targets = rows.filter((r) => {
    const meta = parseMeta(r.message);
    const seg = String(meta.segment || "").toLowerCase();
    const isSports = seg.startsWith("soccer") || seg.startsWith("world") || seg.includes("sport");
    const alreadySent = Boolean(meta.jerseyClearanceSentAt);
    const unsubscribed = String(r.status || "").includes("unsub");
    return isSports && !alreadySent && !unsubscribed;
  });

  if (!targets.length) {
    console.log("No sports-segment leads left to send.");
    return;
  }

  if (dryRun) {
    console.log(`DRY RUN — jersey clearance targets (${targets.length}):`);
    for (const t of targets) {
      console.log(`  ${t.email.padEnd(40)} ${(t.company || "").slice(0, 32)}`);
    }
    return;
  }

  const transport = createTransport();
  let sent = 0;
  let failed = 0;

  for (const t of targets) {
    const meta = parseMeta(t.message);
    const email = buildEmail(t.company?.trim() || "there", meta.city?.trim() || "your area");
    try {
      const info = await transport.sendMail({
        from: `James — ${BUSINESS} <${process.env.SMTP_USER}>`,
        replyTo: REPLY_TO,
        to: t.email,
        subject: email.subject,
        text: email.text,
        html: email.html,
        attachments,
      });
      await rest(`wholesale_leads?id=eq.${t.id}`, {
        method: "PATCH",
        headers: { prefer: "return=minimal" },
        body: JSON.stringify({
          message: JSON.stringify({ ...meta, jerseyClearanceSentAt: new Date().toISOString(), jerseyClearanceMessageId: info.messageId }),
        }),
      });
      sent += 1;
      console.log(`sent  ${t.email}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error";
      failed += 1;
      console.log(`ERROR ${t.email} — ${msg}`);
    }
  }

  transport.close();
  console.log(JSON.stringify({ campaign: "jersey-clearance", sent, failed }));
}

await main();
