import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminCookie } from "@/lib/admin-auth";

type ShippoTx = {
  object_id: string;
  status: string;
  label_url: string;
  tracking_number: string;
  tracking_url_provider: string;
  rate: string;
};

// Shippo transaction objects don't include a `provider` field — the carrier
// name lives on the referenced rate object, so it must be fetched separately.
async function fetchRateProvider(apiKey: string, rateId: string): Promise<string> {
  const res = await fetch(`https://api.goshippo.com/rates/${rateId}`, {
    headers: { Authorization: `ShippoToken ${apiKey}` },
  });
  if (!res.ok) return "";
  const rate = await res.json();
  return rate.provider ?? "";
}

// Search Shippo for a matching SUCCESS transaction
async function findShippoTransaction(
  apiKey: string,
  opts: { transactionId?: string; trackingNumber?: string; rateId?: string }
): Promise<ShippoTx | null> {
  // 1. Direct lookup by transaction ID
  if (opts.transactionId) {
    const res = await fetch(`https://api.goshippo.com/transactions/${opts.transactionId}`, {
      headers: { Authorization: `ShippoToken ${apiKey}` },
    });
    if (res.ok) {
      const tx: ShippoTx = await res.json();
      if (tx.status === "SUCCESS" && tx.label_url) return tx;
    }
    return null;
  }

  // 2. Search by rate ID
  if (opts.rateId) {
    const res = await fetch(
      `https://api.goshippo.com/transactions/?rate=${opts.rateId}&results=10`,
      { headers: { Authorization: `ShippoToken ${apiKey}` } }
    );
    if (res.ok) {
      const data = await res.json();
      const match = (data.results ?? []).find(
        (t: ShippoTx) => t.status === "SUCCESS" && t.label_url
      );
      if (match) return match;
    }
  }

  // 3. Search by tracking number across recent pages
  if (opts.trackingNumber) {
    for (let page = 1; page <= 10; page++) {
      const res = await fetch(
        `https://api.goshippo.com/transactions/?results=50&page=${page}`,
        { headers: { Authorization: `ShippoToken ${apiKey}` } }
      );
      if (!res.ok) break;
      const data = await res.json();
      const results: ShippoTx[] = data.results ?? [];
      const match = results.find(
        (t) => t.tracking_number === opts.trackingNumber && t.label_url
      );
      if (match) return match;
      if (!data.next) break;
    }
  }

  return null;
}

export async function POST(
  req: NextRequest,
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
  let body: { transaction_id?: string; tracking_number?: string } = {};
  try { body = await req.json(); } catch { /* no body */ }

  const supabase = supabaseAdmin();

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, order_number, shippo_rate_id, customer_name")
    .eq("id", id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const tx = await findShippoTransaction(apiKey, {
    transactionId: body.transaction_id?.trim() || undefined,
    trackingNumber: body.tracking_number?.trim() || undefined,
    rateId: order.shippo_rate_id ?? undefined,
  });

  if (!tx) {
    return NextResponse.json({
      error: "No matching label found in Shippo. Try providing a transaction ID or tracking number.",
    }, { status: 404 });
  }

  const carrier = await fetchRateProvider(apiKey, tx.rate);

  // Check this label isn't already linked to a different order
  const { data: duplicate } = await supabase
    .from("orders")
    .select("order_number")
    .neq("id", id)
    .eq("tracking_number", tx.tracking_number)
    .maybeSingle();

  if (duplicate) {
    return NextResponse.json(
      { error: `This label is already linked to order ${duplicate.order_number}` },
      { status: 409 }
    );
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      shippo_label_url: tx.label_url,
      tracking_number: tx.tracking_number || null,
      tracking_url: tx.tracking_url_provider || null,
      carrier: carrier || null,
      status: "packing",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Found label but failed to save to DB" }, { status: 500 });
  }

  console.log(`[sync-label] Synced label for order ${order.order_number} — tracking: ${tx.tracking_number}`);

  return NextResponse.json({
    synced: true,
    label_url: tx.label_url,
    tracking_number: tx.tracking_number,
    tracking_url: tx.tracking_url_provider,
    carrier,
  });
}
