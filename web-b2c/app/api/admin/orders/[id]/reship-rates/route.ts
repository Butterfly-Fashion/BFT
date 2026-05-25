import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminCookie } from "@/lib/admin-auth";
import type { DbOrder } from "@/lib/types";

function selectBox(weightKg: number) {
  if (weightKg <= 0.30) return { length: "22", width: "18", height: "6" };
  if (weightKg <= 0.80) return { length: "32", width: "24", height: "12" };
  if (weightKg <= 2.00) return { length: "42", width: "32", height: "16" };
  return { length: "50", width: "40", height: "22" };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuthenticated = await verifyAdminCookie();
  if (!isAuthenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.SHIPPO_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "SHIPPO_API_KEY not configured" }, { status: 500 });

  const { id } = await params;
  const supabase = supabaseAdmin();

  const { data: order, error } = await supabase
    .from("orders")
    .select("id, customer_name, shipping_address, delivery_method")
    .eq("id", id)
    .single();

  if (error || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if ((order as Pick<DbOrder, "delivery_method">).delivery_method === "pickup") {
    return NextResponse.json({ error: "Pickup orders don't need labels" }, { status: 400 });
  }
  if (!(order as Pick<DbOrder, "shipping_address">).shipping_address) {
    return NextResponse.json({ error: "No shipping address" }, { status: 400 });
  }

  // calc weight from items
  let weightKg = 0.5;
  const { data: items } = await supabase.from("order_items").select("slug, quantity").eq("order_id", id);
  if (items?.length) {
    const slugs = items.map((i: { slug: string | null }) => i.slug).filter(Boolean);
    const { data: products } = await supabase.from("products").select("slug, weight_kg").in("slug", slugs);
    if (products?.length) {
      weightKg = items.reduce((sum: number, item: { slug: string | null; quantity: number }) => {
        const p = products.find((p: { slug: string }) => p.slug === item.slug);
        return sum + ((p as { weight_kg?: number })?.weight_kg ?? 0.3) * item.quantity;
      }, 0);
    }
  }

  const box = selectBox(Math.max(0.1, weightKg));
  const dimWeight = (parseFloat(box.length) * parseFloat(box.width) * parseFloat(box.height)) / 5000;
  const billable = Math.max(weightKg, dimWeight);
  const addr = (order as Pick<DbOrder, "shipping_address">).shipping_address!;

  const shipmentRes = await fetch("https://api.goshippo.com/shipments/", {
    method: "POST",
    headers: { Authorization: `ShippoToken ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      address_from: {
        name: process.env.STORE_NAME ?? "World Fan Gear",
        street1: process.env.STORE_STREET ?? "178 Bentworth Ave",
        city: process.env.STORE_CITY ?? "North York",
        state: process.env.STORE_PROVINCE ?? "ON",
        zip: (process.env.STORE_POSTAL ?? "M6A1P7").replace(/\s/g, ""),
        country: "CA",
      },
      address_to: {
        name: (order as Pick<DbOrder, "customer_name">).customer_name ?? "Customer",
        street1: addr.street,
        city: addr.city,
        state: addr.province,
        zip: addr.postal.replace(/\s/g, "").toUpperCase(),
        country: "CA",
      },
      parcels: [{ length: box.length, width: box.width, height: box.height, distance_unit: "cm", weight: billable.toFixed(2), mass_unit: "kg" }],
      async: false,
    }),
  });

  if (!shipmentRes.ok) return NextResponse.json({ error: "Shippo quote failed" }, { status: 502 });
  const shipment = await shipmentRes.json();

  const rates = (shipment.rates ?? [])
    .filter((r: { currency: string }) => r.currency?.toUpperCase() === "CAD")
    .map((r: { object_id: string; provider: string; servicelevel: { name: string }; amount: string; estimated_days: number }) => ({
      rate_id: r.object_id,
      provider: r.provider,
      service: r.servicelevel?.name ?? r.provider,
      amount: parseFloat(r.amount),
      estimated_days: r.estimated_days ?? null,
    }))
    .sort((a: { amount: number }, b: { amount: number }) => a.amount - b.amount);

  return NextResponse.json({ rates });
}
