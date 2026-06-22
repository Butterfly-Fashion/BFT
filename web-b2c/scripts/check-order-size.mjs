// One-off: look up an order's items + sizes in Supabase, falling back to Stripe.
// Usage: node scripts/check-order-size.mjs WFG-XXXX
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);

const orderNumber = process.argv[2];
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: order, error } = await supabase
  .from("orders")
  .select("id, order_number, stripe_session_id, created_at, items:order_items(name, size, quantity, unit_price)")
  .eq("order_number", orderNumber)
  .single();

if (error || !order) {
  console.log("DB lookup failed:", error?.message ?? "not found");
  process.exit(1);
}

console.log("Order:", order.order_number, "| created:", order.created_at);
console.log("\n[Supabase order_items]");
for (const i of order.items) {
  console.log(`- ${i.name} | size: ${i.size ?? "(null)"} | qty: ${i.quantity} | $${i.unit_price}`);
}

if (order.stripe_session_id && order.items.some((i) => !i.size)) {
  console.log("\n[Stripe line items]");
  // Live sessions need the live key — it may only exist as a commented-out line locally.
  let key = env.STRIPE_SECRET_KEY;
  if (order.stripe_session_id.startsWith("cs_live_") && !key.startsWith("sk_live_")) {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    const m = raw.match(/^#\s*STRIPE_SECRET_KEY=(sk_live_\S+)/m);
    if (m) key = m[1];
  }
  const stripe = new Stripe(key);
  const li = await stripe.checkout.sessions.listLineItems(order.stripe_session_id, {
    limit: 100,
    expand: ["data.price.product"],
  });
  for (const item of li.data) {
    const p = item.price?.product;
    const desc = p && typeof p !== "string" && !p.deleted ? p.description : null;
    console.log(`- ${item.description} | product description: ${desc ?? "(none)"} | qty: ${item.quantity}`);
  }
}
