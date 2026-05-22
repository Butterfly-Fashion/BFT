import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminCookie } from "@/lib/admin-auth";
import { sendTrackingEmail } from "@/lib/email";
import type { DbOrder } from "@/lib/types";

function selectBox(weightKg: number): { length: string; width: string; height: string } {
  if (weightKg <= 0.30) return { length: "22", width: "18", height: "6" };
  if (weightKg <= 0.80) return { length: "32", width: "24", height: "12" };
  if (weightKg <= 2.00) return { length: "42", width: "32", height: "16" };
  return { length: "50", width: "40", height: "22" };
}

async function quoteAndCreateLabel(
  apiKey: string,
  order: Pick<DbOrder, "customer_name" | "shipping_address">,
  weightKg: number,
  preferredProvider: "UPS" | "Canada Post" | null
): Promise<{ label_url: string; tracking_number: string; tracking_url: string; carrier: string } | null> {
  const box = selectBox(Math.max(0.1, weightKg));
  const dimWeight =
    (parseFloat(box.length) * parseFloat(box.width) * parseFloat(box.height)) / 5000;
  const billable = Math.max(weightKg, dimWeight);

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
        name: order.customer_name ?? "Customer",
        street1: order.shipping_address!.street,
        city: order.shipping_address!.city,
        state: order.shipping_address!.province,
        zip: order.shipping_address!.postal.replace(/\s/g, "").toUpperCase(),
        country: "CA",
      },
      parcels: [{
        length: box.length, width: box.width, height: box.height,
        distance_unit: "cm",
        weight: billable.toFixed(2),
        mass_unit: "kg",
      }],
      async: false,
    }),
  });

  if (!shipmentRes.ok) return null;
  const shipment = await shipmentRes.json();

  const rates: Array<{ object_id: string; provider: string; amount: string; currency: string }> =
    shipment.rates ?? [];

  // prefer Canada Post CAD rates since UPS often has modifier errors on returns
  const sorted = rates
    .filter((r) => r.currency?.toUpperCase() === "CAD")
    .sort((a, b) => {
      const aIsPreferred = preferredProvider ? a.provider === preferredProvider : a.provider === "Canada Post";
      const bIsPreferred = preferredProvider ? b.provider === preferredProvider : b.provider === "Canada Post";
      if (aIsPreferred && !bIsPreferred) return -1;
      if (!aIsPreferred && bIsPreferred) return 1;
      return parseFloat(a.amount) - parseFloat(b.amount);
    });

  for (const rate of sorted) {
    const txRes = await fetch("https://api.goshippo.com/transactions/", {
      method: "POST",
      headers: { Authorization: `ShippoToken ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ rate: rate.object_id, label_file_type: "PDF_4X6", async: false }),
    });
    const tx = await txRes.json();
    if (txRes.ok && tx.object_status === "SUCCESS" && tx.label_url) {
      return {
        label_url: tx.label_url,
        tracking_number: tx.tracking_number ?? "",
        tracking_url: tx.tracking_url_provider ?? "",
        carrier: tx.provider ?? rate.provider,
      };
    }
  }

  return null;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuthenticated = await verifyAdminCookie();
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.SHIPPO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "SHIPPO_API_KEY not configured" }, { status: 500 });
  }

  const { id } = await params;
  const supabase = supabaseAdmin();

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, order_number, customer_name, customer_email, shipping_address, delivery_method, total")
    .eq("id", id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.delivery_method === "pickup") {
    return NextResponse.json({ error: "Pickup orders do not need a label" }, { status: 400 });
  }

  if (!order.shipping_address) {
    return NextResponse.json({ error: "No shipping address on this order" }, { status: 400 });
  }

  // calculate total weight from items
  let totalWeight = 0.5;
  const { data: items } = await supabase
    .from("order_items")
    .select("slug, quantity")
    .eq("order_id", id);

  if (items?.length) {
    const slugs = items.map((i: { slug: string | null }) => i.slug).filter(Boolean);
    const { data: products } = await supabase
      .from("products")
      .select("slug, weight_kg")
      .in("slug", slugs);
    if (products?.length) {
      totalWeight = items.reduce((sum: number, item: { slug: string | null; quantity: number }) => {
        const p = products.find((p: { slug: string }) => p.slug === item.slug);
        return sum + ((p as { weight_kg?: number })?.weight_kg ?? 0.3) * item.quantity;
      }, 0);
    }
  }

  const result = await quoteAndCreateLabel(apiKey, order, totalWeight, "Canada Post");

  if (!result) {
    return NextResponse.json({ error: "Failed to create new label via Shippo" }, { status: 502 });
  }

  // clear old label and save new one
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      shippo_label_url: result.label_url,
      tracking_number: result.tracking_number || null,
      tracking_url: result.tracking_url || null,
      carrier: result.carrier || null,
      shippo_rate_id: null,
      status: "packing",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Label created but failed to save to DB" }, { status: 500 });
  }

  console.log(`[reship] New label for order ${order.order_number} — tracking: ${result.tracking_number}`);

  if (order.customer_email && result.tracking_number) {
    (async () => {
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("name, quantity, unit_price")
        .eq("order_id", id);
      await sendTrackingEmail({
        orderNumber: order.order_number,
        customerEmail: order.customer_email!,
        customerName: order.customer_name ?? null,
        carrier: result.carrier,
        trackingNumber: result.tracking_number,
        trackingUrl: result.tracking_url || null,
        items: (orderItems ?? []).map((i: { name: string; quantity: number; unit_price: number }) => ({
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unit_price,
        })),
        total: order.total ?? 0,
      });
    })().catch((err) => console.error("[reship] Tracking email error:", err));
  }

  return NextResponse.json({
    label_url: result.label_url,
    tracking_number: result.tracking_number,
    tracking_url: result.tracking_url,
    carrier: result.carrier,
  });
}
