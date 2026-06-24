// Split clean-contacts.csv into per-segment CSVs formatted for Wix Contacts
// import. Wix maps columns by header; "First Name / Last Name / Email" are the
// standard ones. We put the store/contact name in First Name (Wix merge tag
// {First Name}, with a fallback you set in the editor). One file per segment so
// each Wix campaign can hard-code that segment's product line.
//
// Usage: node scripts/outreach/to-wix-csv.mjs <clean-contacts.csv>
//   (defaults to excel/clean-contacts.csv)
// Outputs: wix-<segment>.csv next to the input.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const input = process.argv[2] || join("excel", "clean-contacts.csv");
const outDir = dirname(input);

const lines = readFileSync(input, "utf8").split(/\r?\n/).filter((l) => l.trim());
lines.shift(); // header: name,email,segment

const bySeg = new Map();
for (const line of lines) {
  // Parse from the right: segment + email are clean; name may be quoted.
  const cols = line.split(",");
  const segment = (cols.pop() || "").trim();
  const email = (cols.pop() || "").trim();
  let name = cols.join(",").trim();
  if (name.startsWith('"') && name.endsWith('"')) name = JSON.parse(name);
  if (!email) continue;
  if (!bySeg.has(segment)) bySeg.set(segment, []);
  bySeg.get(segment).push({ name, email });
}

const esc = (v) => (/[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v);
for (const [segment, rows] of bySeg) {
  const csv =
    "First Name,Last Name,Email\n" +
    rows.map((r) => `${esc(r.name)},,${r.email}`).join("\n") + "\n";
  writeFileSync(join(outDir, `wix-${segment}.csv`), csv);
  console.log(`wix-${segment}.csv  ${rows.length}`);
}
