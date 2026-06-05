/**
 * B2B Cold Outreach Email Sender
 *
 * Setup:
 *   1. Copy .env.example → .env and fill in SMTP credentials
 *   2. node scripts/outreach/send.mjs --dry-run   (preview without sending)
 *   3. node scripts/outreach/send.mjs             (send for real)
 *
 * The script skips already-sent emails (logged in sent.json).
 * Rate: 1 email every 4 seconds to avoid spam filters.
 */

import { createRequire } from "module";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const require = createRequire(import.meta.url);
const nodemailer = require(join(process.cwd(), "web-b2b/node_modules/nodemailer/lib/nodemailer.js"));

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually
const envPath = join(__dirname, "../../web-b2b/.env.local");
if (existsSync(envPath)) {
  readFileSync(envPath, "utf8").split("\n").forEach((line) => {
    const [k, ...v] = line.split("=");
    if (k && v.length) process.env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
  });
}

const DRY_RUN = process.argv.includes("--dry-run");
const DELAY_MS = 4000;
const SENT_LOG = join(__dirname, "sent.json");

// ── Load prospects ────────────────────────────────────────────────────────────

const prospects = JSON.parse(
  readFileSync(join(__dirname, "prospects.json"), "utf8")
);

const sent = existsSync(SENT_LOG)
  ? JSON.parse(readFileSync(SENT_LOG, "utf8"))
  : {};

// ── SMTP transporter ──────────────────────────────────────────────────────────

const transporter = DRY_RUN
  ? null
  : nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

// ── Email templates ───────────────────────────────────────────────────────────

const SENDER_NAME = "Christian Lee";

function getSubject(prospect) {
  if (prospect.type === "card_shop") {
    return "Panini FIFA World Cup 2026 Stickers — Wholesale Available from Toronto";
  }
  if (prospect.type === "soccer_store") {
    return "FIFA World Cup 2026 Jerseys, Caps & Fan Gear — Wholesale from Toronto";
  }
  if (prospect.type === "sports_bar") {
    return "World Cup 2026 Fan Merchandise for Your Venue — Toronto Supplier";
  }
  if (prospect.type === "soccer_academy") {
    return "FIFA World Cup 2026 Gear for Your Academy — Wholesale from Toronto";
  }
  if (prospect.type === "korean_store") {
    return "FIFA World Cup 2026 Korean Team Fan Gear — Wholesale from Toronto";
  }
  if (prospect.type === "gift_shop") {
    return "FIFA World Cup 2026 Souvenirs & Gifts — Wholesale from Toronto";
  }
  if (prospect.type === "soccer_league") {
    return "FIFA World Cup 2026 Fan Gear for Your League — Toronto Supplier";
  }
  if (prospect.type === "soccer_camp") {
    return "FIFA World Cup 2026 Gear for Your Camp & Players — Toronto Supplier";
  }
  return "Wholesale FIFA World Cup 2026 Merchandise — Toronto Supplier";
}

function getBody(prospect) {
  const footer = `
<p style="margin:24px 0 0;font-size:12px;color:#9CA3AF;border-top:1px solid #E5E7EB;padding-top:16px;">
  ${SENDER_NAME} · Butterfly Fashion Trading<br>
  178 Bentworth Ave, North York, ON M6A 1P7 · 416-785-5999<br>
  <a href="https://fifa2026.ca" style="color:#166534;">fifa2026.ca</a><br>
  <span style="color:#6B7280;">Reply STOP to unsubscribe from wholesale emails.</span>
</p>`;

  if (prospect.type === "card_shop") {
    return `
<p>Hi ${prospect.name} team,</p>

<p>My name is ${SENDER_NAME} — I'm with Butterfly Fashion Trading, a Toronto-based (North York) wholesale supplier of FIFA World Cup 2026 merchandise.</p>

<p>I noticed you carry trading cards and collectibles, and I wanted to reach out because we have <strong>Panini FIFA 2026 product in stock</strong> ready for wholesale:</p>

<ul style="line-height:2;">
  <li><strong>Official Sticker Album</strong> — the must-have starting point</li>
  <li><strong>Sticker Box (50 packs)</strong> — strong margin, repeat customer product</li>
  <li><strong>Sticker Packs</strong> — individual, 5-pack, 10-pack, 20-pack formats</li>
  <li><strong>Starter Kit</strong> — Album + 10 packs bundled</li>
  <li><strong>National team jerseys</strong> — Canada, Brazil, Mexico, Korea, Portugal &amp; more</li>
</ul>

<p>Panini FIFA stickers work exactly the same way as Pokémon and hockey card packs — same customer, same impulse, same counter placement. With the World Cup running through July, it's still peak season.</p>

<p>We ship same/next day from North York. If you'd like product photos, a price sheet, or jersey samples, just reply and I'll get everything over to you.</p>

<p>Best,<br>${SENDER_NAME}<br><span style="font-size:12px;color:#6B7280;">Butterfly Fashion Trading</span></p>
${footer}`;
  }

  if (prospect.type === "soccer_store") {
    return `
<p>Hi ${prospect.name} team,</p>

<p>My name is ${SENDER_NAME} from Butterfly Fashion Trading, a Toronto-based (North York) wholesale supplier of FIFA World Cup 2026 fan merchandise.</p>

<p>With the tournament running through mid-July, we have the following <strong>in stock and available for wholesale</strong>:</p>

<ul style="line-height:2;">
  <li><strong>National team jerseys</strong> — Canada, Brazil, Mexico, Korea, Portugal, Argentina &amp; more</li>
  <li><strong>Embroidered caps</strong> — 30+ countries</li>
  <li><strong>Reversible bucket hats</strong> — great for outdoor match days</li>
  <li><strong>Car flags</strong> — 30+ country styles</li>
  <li><strong>Mini souvenir boxing gloves</strong></li>
  <li><strong>Panini FIFA 2026 Sticker Packs &amp; Albums</strong></li>
</ul>

<p>Everything ships same/next day from North York, Toronto. Happy to drop off samples if you're in the GTA.</p>

<p>If you'd like product photos, a full price list, or jersey size breakdowns, just reply and I'll send everything over.</p>

<p>Best,<br>${SENDER_NAME}<br><span style="font-size:12px;color:#6B7280;">Butterfly Fashion Trading</span></p>
${footer}`;
  }

  if (prospect.type === "sports_bar") {
    return `
<p>Hi ${prospect.name} team,</p>

<p>My name is ${SENDER_NAME} from Butterfly Fashion Trading, a Toronto-based (North York) wholesale supplier of FIFA World Cup 2026 fan merchandise.</p>

<p>With the tournament running through mid-July, a lot of bars and venues have been picking up fan gear to sell or use as prizes for match-day events. We currently have in stock:</p>

<ul style="line-height:2;">
  <li><strong>Panini FIFA 2026 Sticker Packs</strong> — great counter/bar merchandise, impulse buy</li>
  <li><strong>National team caps &amp; bucket hats</strong> — Canada, Brazil, Mexico, Korea &amp; more</li>
  <li><strong>Car flags</strong> — 30+ countries</li>
  <li><strong>Mini souvenir boxing gloves</strong> — popular as giveaways and prizes</li>
  <li><strong>National team jerseys</strong></li>
</ul>

<p>Ships same/next day from North York. If you'd like product photos or pricing, just reply and I'll send everything over.</p>

<p>Best,<br>${SENDER_NAME}<br><span style="font-size:12px;color:#6B7280;">Butterfly Fashion Trading</span></p>
${footer}`;
  }

  if (prospect.type === "soccer_academy") {
    return `
<p>Hi ${prospect.name} team,</p>

<p>My name is ${SENDER_NAME} from Butterfly Fashion Trading, a Toronto-based (North York) wholesale supplier of FIFA World Cup 2026 merchandise.</p>

<p>With the World Cup running through mid-July, I wanted to reach out as many academies have been picking up fan gear for players, coaches, and end-of-season events. We have the following in stock:</p>

<ul style="line-height:2;">
  <li><strong>National team jerseys</strong> — Canada, Brazil, Mexico, Korea, Portugal &amp; more</li>
  <li><strong>Embroidered caps &amp; bucket hats</strong> — 30+ countries</li>
  <li><strong>Panini FIFA 2026 Sticker Packs &amp; Albums</strong> — great for kids</li>
  <li><strong>Mini souvenir boxing gloves</strong> — popular as awards and prizes</li>
  <li><strong>Car flags</strong> — 30+ country styles</li>
</ul>

<p>Everything ships same/next day from North York. We're also happy to arrange a local pickup or drop-off if you're in the GTA.</p>

<p>If you'd like product photos, a price list, or jersey options, just reply and I'll get everything over to you right away.</p>

<p>Best,<br>${SENDER_NAME}<br><span style="font-size:12px;color:#6B7280;">Butterfly Fashion Trading</span></p>
${footer}`;
  }

  if (prospect.type === "korean_store") {
    return `
<p>Hi ${prospect.name} team,</p>

<p>My name is ${SENDER_NAME} from Butterfly Fashion Trading, a Toronto-based (North York) wholesale supplier of FIFA World Cup 2026 fan merchandise.</p>

<p>With the World Cup running through mid-July and South Korea in the tournament, we're seeing strong demand for Korean team fan gear. We have the following <strong>in stock and available now</strong>:</p>

<ul style="line-height:2;">
  <li><strong>Korea national team jerseys &amp; caps</strong></li>
  <li><strong>Panini FIFA 2026 Sticker Packs &amp; Albums</strong> — great counter merchandise</li>
  <li><strong>Mini souvenir boxing gloves</strong> — Korea flag style available</li>
  <li><strong>Car flags</strong> — Korea &amp; 30+ other countries</li>
  <li><strong>Keychains, soccer balls, country flags, hood covers &amp; mirror covers</strong></li>
  <li><strong>World Cup-themed board games and fan accessories</strong></li>
</ul>

<p>You can see our full product range at <a href="https://fifa2026.ca" style="color:#166534;">fifa2026.ca</a>. If you have any questions or would like photos, pricing, or product details, please feel free to email me anytime.</p>

<p>Ships same/next day from North York, Toronto.</p>

<p>Best,<br>${SENDER_NAME}<br><span style="font-size:12px;color:#6B7280;">Butterfly Fashion Trading</span></p>
${footer}`;
  }

  if (prospect.type === "gift_shop") {
    return `
<p>Hi ${prospect.name} team,</p>

<p>My name is ${SENDER_NAME} from Butterfly Fashion Trading, a Toronto-based (North York) wholesale supplier of FIFA World Cup 2026 merchandise.</p>

<p>With the World Cup running through mid-July, we have a range of <strong>souvenir and gift products</strong> in stock that work well for gift shop retail:</p>

<ul style="line-height:2;">
  <li><strong>Mini souvenir boxing gloves</strong> — 20+ country styles, great shelf display</li>
  <li><strong>Keychains &amp; fan accessories</strong></li>
  <li><strong>Panini FIFA 2026 Sticker Packs &amp; Albums</strong></li>
  <li><strong>National team caps</strong> — Canada, Brazil, Korea, Portugal &amp; more</li>
  <li><strong>Soccer balls, country flags, hood covers &amp; mirror covers</strong></li>
  <li><strong>World Cup-themed board games and novelty items</strong></li>
</ul>

<p>You can browse our full product range at <a href="https://fifa2026.ca" style="color:#166534;">fifa2026.ca</a>. If you have any questions or would like product photos, pricing, or wholesale details, please feel free to email me anytime.</p>

<p>Ships same/next day from North York.</p>

<p>Best,<br>${SENDER_NAME}<br><span style="font-size:12px;color:#6B7280;">Butterfly Fashion Trading</span></p>
${footer}`;
  }

  if (prospect.type === "convenience_assoc") {
    return `
<p>Hi OCSA team,</p>

<p>My name is ${SENDER_NAME} from Butterfly Fashion Trading, a Toronto-based (North York) wholesale supplier of FIFA World Cup 2026 merchandise.</p>

<p>With the World Cup running through mid-July, we're seeing strong demand at convenience stores for impulse-buy fan products at the counter. We supply:</p>

<ul style="line-height:2;">
  <li><strong>Panini FIFA 2026 Sticker Packs</strong> — $3.99 retail, ideal counter placement</li>
  <li><strong>Mini souvenir boxing gloves</strong> — compact, giftable, 20+ country styles</li>
  <li><strong>Keychains &amp; small fan accessories</strong></li>
  <li><strong>National team caps, car flags &amp; country flags</strong></li>
  <li><strong>Hood covers, mirror covers, soccer balls &amp; small World Cup novelty items</strong></li>
</ul>

<p>If OCSA has a member newsletter, bulletin, or supplier directory, we'd love to be included so member stores can reach us directly. We ship same/next day from North York.</p>

<p>Browse at <a href="https://fifa2026.ca" style="color:#166534;">fifa2026.ca</a>. If you have any questions about supplier listing, newsletter placement, product photos, or pricing, please feel free to email me anytime.</p>

<p>Best,<br>${SENDER_NAME}<br><span style="font-size:12px;color:#6B7280;">Butterfly Fashion Trading</span></p>
${footer}`;
  }

  if (prospect.type === "soccer_league") {
    return `
<p>Hi ${prospect.name} team,</p>

<p>My name is ${SENDER_NAME} from Butterfly Fashion Trading, a Toronto-based (North York) wholesale supplier of FIFA World Cup 2026 fan merchandise.</p>

<p>With the World Cup running through mid-July, we thought your league members and teams might be interested in some fan gear. We supply:</p>

<ul style="line-height:2;">
  <li><strong>National team jerseys</strong> — Canada, Brazil, Mexico, Korea, Portugal &amp; more</li>
  <li><strong>Embroidered caps &amp; bucket hats</strong> — 30+ countries</li>
  <li><strong>Soccer balls, keychains, country flags &amp; fan accessories</strong></li>
  <li><strong>Panini FIFA 2026 Sticker Packs</strong> — popular with players of all ages</li>
  <li><strong>Car flags, hood covers, mirror covers &amp; mini souvenir boxing gloves</strong></li>
  <li><strong>World Cup-themed board games and novelty items</strong></li>
</ul>

<p>Browse our full range at <a href="https://fifa2026.ca" style="color:#166534;">fifa2026.ca</a>. No minimum order — happy to discuss whatever works for your league. Reply and I'll send photos and pricing.</p>

<p>Ships same/next day from North York, Toronto.</p>

<p>Best,<br>${SENDER_NAME}<br><span style="font-size:12px;color:#6B7280;">Butterfly Fashion Trading</span></p>
${footer}`;
  }

  if (prospect.type === "soccer_camp") {
    return `
<p>Hi ${prospect.name} team,</p>

<p>My name is ${SENDER_NAME} from Butterfly Fashion Trading, a Toronto-based (North York) wholesale supplier of FIFA World Cup 2026 fan merchandise.</p>

<p>With the World Cup running during your summer camp season, we thought your players and families might enjoy some fan gear. We carry:</p>

<ul style="line-height:2;">
  <li><strong>National team jerseys &amp; caps</strong> — Canada, Brazil, Korea, Mexico &amp; more</li>
  <li><strong>Panini FIFA 2026 Sticker Packs &amp; Albums</strong> — kids love them</li>
  <li><strong>Soccer balls, keychains, country flags &amp; fun accessories</strong></li>
  <li><strong>Bucket hats, hood covers, mirror covers &amp; World Cup-themed board games</strong></li>
  <li><strong>Mini souvenir boxing gloves</strong> — popular as end-of-camp prizes</li>
</ul>

<p>Browse our range at <a href="https://fifa2026.ca" style="color:#166534;">fifa2026.ca</a>. No set minimum — happy to work with whatever quantity makes sense. Reply and I'll send product photos and pricing right away.</p>

<p>Ships same/next day from North York, Toronto.</p>

<p>Best,<br>${SENDER_NAME}<br><span style="font-size:12px;color:#6B7280;">Butterfly Fashion Trading</span></p>
${footer}`;
  }

  return `
<p>Hi ${prospect.name} team,</p>

<p>My name is ${SENDER_NAME} from Butterfly Fashion Trading, a Toronto-based (North York) wholesale supplier of FIFA World Cup 2026 merchandise.</p>

<ul style="line-height:2;">
  <li>National team jerseys (Canada, Brazil, Mexico, Korea, Portugal &amp; more)</li>
  <li>Embroidered caps &amp; bucket hats — 30+ countries</li>
  <li>Car flags — 30+ countries</li>
  <li>Mini souvenir boxing gloves &amp; keychains</li>
  <li>Panini FIFA 2026 Sticker Packs &amp; Albums</li>
</ul>

<p>Browse our full range at <a href="https://fifa2026.ca" style="color:#166534;">fifa2026.ca</a>. No minimum order. Reply and I'll send product photos and pricing.</p>

<p>Ships same/next day from North York, Toronto.</p>

<p>Best,<br>${SENDER_NAME}<br><span style="font-size:12px;color:#6B7280;">Butterfly Fashion Trading</span></p>
${footer}`;
}

function buildHtml(prospect) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#F7F8F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#111827;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr>
          <td style="background:#15803d;border-radius:10px 10px 0 0;padding:18px 28px;">
            <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.6);">Butterfly Fashion Trading</p>
            <p style="margin:6px 0 0;font-size:17px;font-weight:900;color:#fff;">FIFA World Cup 2026 Wholesale</p>
          </td>
        </tr>
        <tr>
          <td style="background:#fff;padding:28px 28px 32px;border-left:1px solid #E5E7EB;border-right:1px solid #E5E7EB;font-size:14px;line-height:1.75;color:#374151;">
            ${getBody(prospect)}
          </td>
        </tr>
        <tr>
          <td style="background:#F0FDF4;border:1px solid #BBF7D0;border-top:none;border-radius:0 0 10px 10px;padding:12px 28px;">
            <p style="margin:0;font-size:11px;color:#166534;font-weight:600;">Butterfly Fashion Trading · 178 Bentworth Ave, North York, ON M6A 1P7</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Send loop ─────────────────────────────────────────────────────────────────

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log(`\n📬 B2B Outreach — ${DRY_RUN ? "DRY RUN" : "LIVE SEND"}`);
  console.log(`   ${prospects.length} prospects loaded\n`);

  let sentCount = 0;
  let skippedCount = 0;

  for (const prospect of prospects) {
    if (sent[prospect.email]) {
      console.log(`⏭  SKIP  ${prospect.email} (already sent ${sent[prospect.email]})`);
      skippedCount++;
      continue;
    }

    const subject = getSubject(prospect);
    const html = buildHtml(prospect);

    if (DRY_RUN) {
      console.log(`📝 DRY   ${prospect.name} <${prospect.email}>`);
      console.log(`         Subject: ${subject}\n`);
      continue;
    }

    try {
      await transporter.sendMail({
        from: `Christian Lee — Butterfly Fashion Trading <${process.env.SMTP_USER}>`,
        to: prospect.email,
        subject,
        html,
      });

      sent[prospect.email] = new Date().toISOString();
      writeFileSync(SENT_LOG, JSON.stringify(sent, null, 2));
      sentCount++;
      console.log(`✅ SENT  ${prospect.name} <${prospect.email}>`);
    } catch (err) {
      console.error(`❌ FAIL  ${prospect.name} <${prospect.email}> — ${err.message}`);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n✅ Done — ${sentCount} sent, ${skippedCount} skipped`);
}

main().catch(console.error);
