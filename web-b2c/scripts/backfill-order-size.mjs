// One-off: backfill order_items.size for a single order from a known value.
// Usage: node scripts/backfill-order-size.mjs WFG-XXXX "<item name substring>" "<size>"
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);

const [orderNumber, nameSubstring, size] = process.argv.slice(2);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: order } = await supabase
  .from("orders")
  .select("id")
  .eq("order_number", orderNumber)
  .single();

if (!order) {
  console.log("Order not found");
  process.exit(1);
}

const { data, error } = await supabase
  .from("order_items")
  .update({ size })
  .eq("order_id", order.id)
  .ilike("name", `%${nameSubstring}%`)
  .select("name, size");

if (error) {
  console.log("Update failed:", error.message);
  process.exit(1);
}
console.log("Updated:", JSON.stringify(data));
