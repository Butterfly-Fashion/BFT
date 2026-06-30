// Clean the bulk "sent" contact export (Name,Email,Time,Event) into a usable
// warm re-engagement list. The export is messy: HTML-entity-encoded names,
// unquoted commas inside names, duplicates, bounces, and many non-customer /
// role addresses. This dedupes, drops bounces, decodes names, and flags
// addresses that probably should not be emailed.
//
// Usage:
//   node scripts/outreach/clean-contacts.mjs <input.csv>
//   (defaults to scripts/outreach/contacts_sent.csv)
//
// Outputs (next to the input):
//   clean-contacts.csv     — deduped, sendable, customer-looking
//   review-contacts.csv    — role/non-customer addresses to eyeball before use
//   bounced-contacts.csv   — anything that was not a clean SEND
// Nothing is sent. This only produces files + a summary.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const input = process.argv[2] || join("scripts", "outreach", "contacts_sent.csv");
const outDir = dirname(input);

// Domains / patterns that are almost certainly NOT retail customers: banks,
// couriers, the company's own address, known competitors/distributors, travel.
const EXCLUDE_DOMAINS = [
  "rbc.com", "ftn.fedex.com", "fedex.com", "expediamail.com", "expedia.com",
  "email.aircanada.com", "aircanada.com", "mvrwholesale.com", "dollarama.com",
  "bargainsgroup.com", "xmr3.com",
];
const SELF = ["butterflyfashiontrading@gmail.com", "jameskimkim1@gmail.com"];
// Role inboxes are lower-quality but can still be real shops, so only flag.
const ROLE_LOCALPARTS = ["info", "sales", "orders", "admin", "office", "contact", "purchasing", "hardware", "marketing", "ap", "a/p", "accounts"];

// Store-name keyword -> product segment. First match wins; no match -> "announce"
// (a generic "we launched our new wholesale site" message). The export has no
// city/segment columns, so we infer interest from the store name only.
// Matched against the store name AND the email local-part (digits/punctuation
// turned to spaces) so "dollarstore513@" or glued "DollarDime" still tag.
// Distinctive tokens use substring; short ambiguous ones keep \b to avoid
// false positives (e.g. \bmart\b so "Martin" doesn't become a convenience store).
const SEGMENT_RULES = [
  ["soccer", /soccer|world ?cup|fifa|jersey|fan ?gear|sporting|\bsports?\b/i],
  ["squishy", /toy|squish|fidget|hobby|arcade|playful|\bgames?\b|\bkids?\b|\bplay\b/i],
  ["counter", /convenience|grocery|supermarket|market|\bmart\b|mini.?mart|food|pharmac(y|ie)|\bdrug|variety/i],
  ["novelty", /dollar|\bbuck|loonie|toonie|discount|bargain|\bdepot\b|surplus|liquidation|\bdeals?\b|99 ?cents?|\bcents?\b/i],
  ["gift", /gift|boutique|fashion|accessor|jewel|beaut|salon|\bspa\b|craft|decor|clothing|apparel|\bwear\b|florist|flower/i],
];

function tagSegment(name, email) {
  const local = (email.split("@")[0] || "").replace(/[^a-z]+/gi, " ");
  const hay = `${name} ${local}`.trim();
  if (!hay) return "announce";
  for (const [seg, re] of SEGMENT_RULES) if (re.test(hay)) return seg;
  return "announce";
}

function decodeEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

// Mojibake check: if a decoded name is mostly replacement/control chars it is
// unusable as a greeting, so blank it (we'll greet "there").
function nameLooksBroken(name) {
  if (!name) return true;
  const bad = (name.match(/[\uFFFD\u0000-\u001F]/g) || []).length;
  return bad > 0 || /Ã|Â|â\x80|ì|ë|í¤/.test(name) && !/[A-Za-z]{3}/.test(name);
}

const raw = readFileSync(input, "utf8").split(/\r?\n/).filter((l) => l.trim());
const header = raw.shift(); // discard "Name,Email,Time,Event"

const byEmail = new Map();
let totalRows = 0, bounced = 0, dupes = 0;

for (const line of raw) {
  totalRows++;
  // Parse from the RIGHT — names contain unquoted commas, but the last three
  // columns (Email,Time,Event) are well-formed.
  const cols = line.split(",");
  const event = (cols.pop() || "").trim();
  const time = (cols.pop() || "").trim();
  const email = (cols.pop() || "").trim().toLowerCase();
  const rawName = cols.join(",").trim();

  if (!email || !email.includes("@")) continue;

  if (event !== "SEND") { bounced++; record(byEmail, "_bounced", { email, name: rawName, event, time }); continue; }

  if (byEmail.has(email)) { dupes++; continue; }

  const name = decodeEntities(rawName);
  const greet = nameLooksBroken(name) ? "" : name;
  const domain = email.split("@")[1] || "";
  const local = email.split("@")[0] || "";

  let bucket = "clean";
  if (EXCLUDE_DOMAINS.includes(domain) || SELF.includes(email)) bucket = "exclude";
  else if (ROLE_LOCALPARTS.includes(local)) bucket = "review";

  byEmail.set(email, { email, name: greet, segment: tagSegment(name, email), bucket });
}

function record(map, key, row) {
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(row);
}

const all = [...byEmail.values()].filter((v) => v.email);
const clean = all.filter((v) => v.bucket === "clean");
const review = all.filter((v) => v.bucket === "review");
const excluded = all.filter((v) => v.bucket === "exclude");
const bouncedRows = byEmail.get("_bounced") || [];

const toCsv = (rows) =>
  "name,email,segment\n" +
  rows.map((r) => `${JSON.stringify(r.name || "")},${r.email},${r.segment}`).join("\n") + "\n";

writeFileSync(join(outDir, "clean-contacts.csv"), toCsv(clean));
writeFileSync(join(outDir, "review-contacts.csv"), toCsv(review));
writeFileSync(
  join(outDir, "bounced-contacts.csv"),
  "email,event,time\n" + bouncedRows.map((r) => `${r.email},${r.event},${r.time}`).join("\n") + "\n"
);

console.log(`Input rows:        ${totalRows}`);
console.log(`Bounced/not-sent:  ${bounced}  -> bounced-contacts.csv`);
console.log(`Duplicate emails:  ${dupes}  (dropped)`);
console.log(`Unique sent:       ${all.length}`);
console.log(`  clean (sendable):  ${clean.length}  -> clean-contacts.csv`);
console.log(`  role (review):     ${review.length}  -> review-contacts.csv`);
console.log(`  excluded (non-cust): ${excluded.length}  (dropped)`);

const segCounts = {};
for (const r of clean) segCounts[r.segment] = (segCounts[r.segment] || 0) + 1;
console.log(`\nSegments (clean):`);
for (const [seg, n] of Object.entries(segCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${seg.padEnd(10)} ${n}`);
}
