import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = rawLine.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    process.env[match[1]] ||= match[2].trim().replace(/^['"]|['"]$/g, "");
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted && char === '"' && text[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }
  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  const [headers, ...records] = rows;
  return records.map((record) =>
    Object.fromEntries(headers.map((header, index) => [header.trim(), record[index]?.trim() || ""])),
  );
}

loadEnv(join(root, "web-b2c/.env.local"));
loadEnv(join(root, ".env.local"));

const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!baseUrl || !serviceKey) throw new Error("Supabase environment variables are missing");

const csvPath = join(root, "cold-email/recipients-seed.csv");
const recipients = parseCsv(readFileSync(csvPath, "utf8"));
const previousSentPath = join(root, "scripts/outreach/sent.json");
const previousSent = existsSync(previousSentPath)
  ? new Set(Object.keys(JSON.parse(readFileSync(previousSentPath, "utf8"))).map((email) => email.toLowerCase()))
  : new Set();
const headers = {
  apikey: serviceKey,
  authorization: `Bearer ${serviceKey}`,
  "content-type": "application/json",
};

const existingResponse = await fetch(
  `${baseUrl}/rest/v1/wholesale_leads?source=eq.cold-email&select=email`,
  { headers },
);
if (!existingResponse.ok) throw new Error(`Could not load existing rows: ${existingResponse.status}`);
const existing = new Set((await existingResponse.json()).map((row) => row.email.toLowerCase()));

const indexedRecipients = recipients.map((row, index) => ({
  ...row,
  outreachOrder: `outreach:${String(index + 1).padStart(4, "0")}`,
}));

const pending = indexedRecipients
  .filter((row) => row.email && !row.status && !existing.has(row.email.toLowerCase()))
  .map((row) => ({
    name: row.store_name,
    company: row.store_name,
    email: row.email.toLowerCase(),
    source: "cold-email",
    status: previousSent.has(row.email.toLowerCase()) ? "sent_previous_campaign" : "pending",
    expected_quantity: row.outreachOrder,
    message: JSON.stringify({
      city: row.city,
      province: row.province,
      segment: row.segment || "squishy",
      sourceUrl: row.source,
    }),
  }));

if (pending.length) {
  const insertResponse = await fetch(`${baseUrl}/rest/v1/wholesale_leads`, {
    method: "POST",
    headers: { ...headers, prefer: "return=minimal" },
    body: JSON.stringify(pending),
  });
  if (!insertResponse.ok) {
    throw new Error(`Could not insert recipients: ${insertResponse.status} ${await insertResponse.text()}`);
  }
}

const previousCampaignEmails = indexedRecipients
  .map((row) => row.email.toLowerCase())
  .filter((email) => previousSent.has(email));

for (const email of previousCampaignEmails) {
  const updateResponse = await fetch(
    `${baseUrl}/rest/v1/wholesale_leads?source=eq.cold-email&email=eq.${encodeURIComponent(email)}&status=eq.pending`,
    {
      method: "PATCH",
      headers: { ...headers, prefer: "return=minimal" },
      body: JSON.stringify({ status: "sent_previous_campaign" }),
    },
  );
  if (!updateResponse.ok) throw new Error(`Could not mark previous recipient: ${updateResponse.status}`);
}

for (const row of indexedRecipients) {
  const updateResponse = await fetch(
    `${baseUrl}/rest/v1/wholesale_leads?source=eq.cold-email&email=eq.${encodeURIComponent(row.email.toLowerCase())}`,
    {
      method: "PATCH",
      headers: { ...headers, prefer: "return=minimal" },
      body: JSON.stringify({ expected_quantity: row.outreachOrder }),
    },
  );
  if (!updateResponse.ok) throw new Error(`Could not sync outreach order: ${updateResponse.status}`);
}

console.log(JSON.stringify({
  totalCsv: recipients.length,
  alreadyPresent: existing.size,
  inserted: pending.length,
  previousCampaignExcluded: previousCampaignEmails.length,
}));
