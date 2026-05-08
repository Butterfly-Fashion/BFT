import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index);
    const value = trimmed.slice(index + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, serviceRole, { auth: { persistSession: false } });

async function createUser(email, password, profile) {
  const { data: existing } = await supabase.from("profiles").select("*").eq("email", email).maybeSingle();
  if (existing) return existing;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;

  const { data: createdProfile, error: profileError } = await supabase
    .from("profiles")
    .insert({ auth_user_id: data.user.id, email, ...profile })
    .select()
    .single();
  if (profileError) throw profileError;
  return createdProfile;
}

const admin = await createUser("admin@example.com", "Admin12345!", {
  role: "admin",
  business_name: "World Fan Gear",
  contact_name: "Admin User",
  phone: "555-0100",
  business_address: "1 Admin Street",
  city: "Toronto",
  province: "ON",
  postal_code: "M5V 1A1",
  country: "Canada",
  business_type: "Admin",
  is_b2b_approved: true,
});

const customer = await createUser("customer@example.com", "Customer12345!", {
  role: "customer",
  business_name: "Sample Retail Customer",
  contact_name: "Customer Buyer",
  phone: "555-0200",
  business_address: "20 Customer Road",
  city: "Waterloo",
  province: "ON",
  postal_code: "N2L 1A1",
  country: "Canada",
  business_type: "Retailer",
  is_b2b_approved: false,
});

const approved = await createUser("b2b@example.com", "B2B12345!", {
  role: "customer",
  business_name: "Approved B2B Buyer",
  contact_name: "B2B Buyer",
  phone: "555-0300",
  business_address: "30 Wholesale Ave",
  city: "Mississauga",
  province: "ON",
  postal_code: "L5B 2A1",
  country: "Canada",
  business_type: "Wholesaler",
  is_b2b_approved: true,
});

const { data: products } = await supabase.from("products").select("*").limit(3);
if (products?.length) {
  await supabase.from("customer_prices").upsert({
    customer_id: approved.id,
    product_id: products[0].id,
    price: Math.max(1, Number(products[0].base_price) - 2),
    min_quantity: null,
  }, { onConflict: "customer_id,product_id,min_quantity" });

  const product = products[0];
  const lineTotal = Number(product.base_price) * 2;
  const tax = Number((lineTotal * 0.13).toFixed(2));
  const { data: order } = await supabase
    .from("orders")
    .insert({
      customer_id: customer.id,
      status: "Pending Review",
      payment_status: "Unpaid",
      subtotal: lineTotal,
      shipping_fee: 0,
      discount_amount: 0,
      tax_amount: tax,
      total_amount: lineTotal + tax,
      delivery_method: "Shipping",
      shipping_address: "20 Customer Road, Waterloo, ON N2L 1A1",
      customer_notes: "Sample seeded pending order.",
    })
    .select()
    .single();
  if (order) {
    await supabase.from("order_items").insert({
      order_id: order.id,
      product_id: product.id,
      product_name_snapshot: product.name,
      sku_snapshot: product.sku,
      quantity: 2,
      unit_price_snapshot: product.base_price,
      line_total: lineTotal,
    });
  }

  const { data: quote } = await supabase
    .from("quotes")
    .insert({
      customer_id: approved.id,
      status: "Pending",
      message: "Looking for bulk pricing on event merchandise.",
    })
    .select()
    .single();
  if (quote) {
    await supabase.from("quote_items").insert({
      quote_id: quote.id,
      product_id: product.id,
      quantity: 100,
      requested_price: Number(product.base_price) - 3,
    });
  }
}

console.log("Seed complete.");
console.log("Admin: admin@example.com / Admin12345!");
console.log("Customer: customer@example.com / Customer12345!");
console.log("Approved B2B: b2b@example.com / B2B12345!");
