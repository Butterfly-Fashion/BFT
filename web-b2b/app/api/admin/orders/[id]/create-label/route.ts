import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

// Pick a box size from the total parcel weight (mirrors the B2C heuristic).
function selectBox(weightKg: number): { length: string; width: string; height: string } {
  if (weightKg <= 0.3) return { length: "22", width: "18", height: "6" };
  if (weightKg <= 0.8) return { length: "32", width: "24", height: "12" };
  if (weightKg <= 2.0) return { length: "42", width: "32", height: "16" };
  if (weightKg <= 5.0) return { length: "50", width: "40", height: "22" };
  return { length: "60", width: "40", height: "40" };
}

type AddressInput = {
  name?: string;
  street?: string;
  city?: string;
  province?: string;
  postal?: string;
  country?: string;
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.SHIPPO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "SHIPPO_API_KEY not configured" }, { status: 500 });
  }

  const { id } = await params;
  const admin = createSupabaseAdminClient();

  const { data: order, error: fetchError } = await admin
    .from("orders")
    .select("id, delivery_method, shippo_label_url, tracking_number, tracking_url, carrier")
    .eq("id", id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.delivery_method === "Pickup") {
    return NextResponse.json({ error: "Pickup orders do not need a shipping label" }, { status: 400 });
  }
  // Already has a label — return it instead of buying a second one.
  if (order.shippo_label_url) {
    return NextResponse.json({
      label_url: order.shippo_label_url,
      tracking_number: order.tracking_number ?? "",
      tracking_url: order.tracking_url ?? "",
      carrier: order.carrier ?? "",
      reused: true,
    });
  }

  const to = ((await req.json().catch(() => ({}))).to ?? {}) as AddressInput;
  if (!to.street || !to.city || !to.province || !to.postal) {
    return NextResponse.json(
      { error: "Shipping address is incomplete — street, city, province and postal code are required." },
      { status: 400 }
    );
  }

  // Total parcel weight from the order's products (fallback 0.3 kg per unit).
  const { data: items } = await admin
    .from("order_items")
    .select("quantity, product_id")
    .eq("order_id", id);
  let weightKg = 0;
  if (items?.length) {
    const productIds = items.map((i) => i.product_id).filter(Boolean) as string[];
    const { data: products } = productIds.length
      ? await admin.from("products").select("id, weight_kg").in("id", productIds)
      : { data: [] };
    const weightById = new Map((products ?? []).map((p) => [p.id, Number(p.weight_kg) || 0]));
    weightKg = items.reduce((sum, i) => sum + (weightById.get(i.product_id ?? "") || 0.3) * Number(i.quantity), 0);
  }
  weightKg = Math.max(0.1, weightKg);
  const box = selectBox(weightKg);

  // Quote rates for the shipment.
  let shipmentRes: Response;
  try {
    shipmentRes = await fetch("https://api.goshippo.com/shipments/", {
      method: "POST",
      headers: { Authorization: `ShippoToken ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        address_from: {
          name: process.env.STORE_NAME ?? "Butterfly Fashion Trading",
          street1: process.env.STORE_STREET ?? "",
          city: process.env.STORE_CITY ?? "",
          state: process.env.STORE_PROVINCE ?? "ON",
          zip: (process.env.STORE_POSTAL ?? "").replace(/\s/g, ""),
          country: "CA",
        },
        address_to: {
          name: to.name || "Customer",
          street1: to.street,
          city: to.city,
          state: to.province,
          zip: to.postal.replace(/\s/g, "").toUpperCase(),
          country: (to.country || "CA").slice(0, 2).toUpperCase(),
        },
        parcels: [
          {
            length: box.length,
            width: box.width,
            height: box.height,
            distance_unit: "cm",
            weight: weightKg.toFixed(2),
            mass_unit: "kg",
          },
        ],
        async: false,
      }),
    });
  } catch (err) {
    console.error("[b2b create-label] Shippo network error:", err);
    return NextResponse.json({ error: "Failed to reach Shippo API" }, { status: 502 });
  }

  const shipment = await shipmentRes.json();
  if (!shipmentRes.ok) {
    const msg = shipment.detail ?? shipment.messages?.[0]?.text ?? "Could not get shipping rates";
    return NextResponse.json({ error: `Shippo: ${msg}` }, { status: 400 });
  }

  // Cheapest CAD rate.
  const rate = (shipment.rates ?? [])
    .filter((r: { currency?: string }) => (r.currency ?? "").toUpperCase() === "CAD")
    .sort((a: { amount: string }, b: { amount: string }) => parseFloat(a.amount) - parseFloat(b.amount))[0];
  if (!rate) {
    return NextResponse.json({ error: "No shipping rates available for this address." }, { status: 400 });
  }

  // Buy the label.
  const txRes = await fetch("https://api.goshippo.com/transactions/", {
    method: "POST",
    headers: { Authorization: `ShippoToken ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ rate: rate.object_id, label_file_type: "PDF_4X6", async: false }),
  });
  const tx = await txRes.json();
  if (!txRes.ok || tx.status !== "SUCCESS") {
    const msg = tx.messages?.[0]?.text ?? tx.status ?? "Shippo returned an error";
    return NextResponse.json({ error: `Shippo: ${msg}` }, { status: 400 });
  }

  const labelUrl: string = tx.label_url;
  const trackingNumber: string = tx.tracking_number ?? "";
  const trackingUrl: string = tx.tracking_url_provider ?? "";
  const carrier: string = rate.provider ?? "";

  const { error: updateError } = await admin
    .from("orders")
    .update({
      shippo_label_url: labelUrl,
      tracking_number: trackingNumber || null,
      tracking_url: trackingUrl || null,
      carrier: carrier || null,
      status: "Label Created",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    console.error(
      `[b2b create-label] ORPHANED LABEL — tx: ${tx.object_id}, tracking: ${trackingNumber}, url: ${labelUrl}`,
      updateError.message
    );
    return NextResponse.json(
      { error: "Label was purchased but failed to save. Tracking: " + trackingNumber, label_url: labelUrl },
      { status: 500 }
    );
  }

  return NextResponse.json({
    label_url: labelUrl,
    tracking_number: trackingNumber,
    tracking_url: trackingUrl,
    carrier,
  });
}
