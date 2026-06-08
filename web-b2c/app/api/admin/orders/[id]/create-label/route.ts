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

// UPS modifier 에러 시 Canada Post로 재조회해서 rate_id 반환
async function getCanadaPostRateId(
  apiKey: string,
  order: Pick<DbOrder, "customer_name" | "shipping_address">,
  weightKg: number
): Promise<string | null> {
  const box = selectBox(Math.max(0.1, weightKg));
  const dimWeight =
    (parseFloat(box.length) * parseFloat(box.width) * parseFloat(box.height)) / 5000;
  const billable = Math.max(weightKg, dimWeight);

  try {
    const res = await fetch("https://api.goshippo.com/shipments/", {
      method: "POST",
      headers: {
        Authorization: `ShippoToken ${apiKey}`,
        "Content-Type": "application/json",
      },
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
          length: box.length,
          width: box.width,
          height: box.height,
          distance_unit: "cm",
          weight: billable.toFixed(2),
          mass_unit: "kg",
        }],
        async: false,
      }),
    });

    const data = await res.json();
    if (!res.ok) return null;

    const rate = (data.rates ?? [])
      .filter((r: { provider: string; currency: string }) =>
        r.provider === "Canada Post" && r.currency?.toUpperCase() === "CAD"
      )
      .sort((a: { amount: string }, b: { amount: string }) =>
        parseFloat(a.amount) - parseFloat(b.amount)
      )[0];

    return rate?.object_id ?? null;
  } catch {
    return null;
  }
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
    .select("id, order_number, shippo_rate_id, shippo_label_url, tracking_number, tracking_url, carrier, delivery_method, customer_name, customer_email, shipping_address, total, updated_at")
    .eq("id", id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.delivery_method === "pickup") {
    return NextResponse.json({ error: "Pickup orders do not need a shipping label" }, { status: 400 });
  }

  if (!order.shippo_rate_id) {
    return NextResponse.json({
      error: "No Shippo rate ID on this order. The customer may have checked out before rate tracking was enabled.",
    }, { status: 400 });
  }

  if (order.shippo_label_url && order.shippo_label_url !== "__pending__") {
    return NextResponse.json({
      label_url: order.shippo_label_url,
      tracking_number: order.tracking_number ?? "",
      tracking_url: order.tracking_url ?? "",
      carrier: order.carrier ?? "",
    });
  }

  // Atomic DB lock: only one request can proceed at a time.
  // Update sets shippo_label_url = '__pending__' only if it's currently NULL.
  // If 0 rows updated, another request already claimed this order.
  //
  // A '__pending__' value can also mean a *previous* request crashed/timed out
  // mid-purchase and never released the lock. We treat locks older than
  // STALE_LOCK_MS as abandoned and reclaim them — otherwise the order would be
  // stuck forever, and admins retrying would fall through both checks below
  // and risk purchasing a second label (double charge).
  const STALE_LOCK_MS = 2 * 60 * 1000;
  const nowIso = new Date().toISOString();

  if (!order.shippo_label_url) {
    const { data: claimed } = await supabase
      .from("orders")
      .update({ shippo_label_url: "__pending__", updated_at: nowIso })
      .eq("id", id)
      .is("shippo_label_url", null)
      .select("id");
    if (!claimed?.length) {
      return NextResponse.json({ error: "Label creation already in progress for this order." }, { status: 409 });
    }
  } else if (order.shippo_label_url === "__pending__") {
    const lockAgeMs = Date.now() - new Date(order.updated_at).getTime();
    if (lockAgeMs < STALE_LOCK_MS) {
      return NextResponse.json({ error: "Label creation already in progress for this order. Please wait a moment and try again." }, { status: 409 });
    }
    const { data: reclaimed } = await supabase
      .from("orders")
      .update({ shippo_label_url: "__pending__", updated_at: nowIso })
      .eq("id", id)
      .eq("shippo_label_url", "__pending__")
      .lt("updated_at", new Date(Date.now() - STALE_LOCK_MS).toISOString())
      .select("id");
    if (!reclaimed?.length) {
      return NextResponse.json({ error: "Label creation already in progress for this order." }, { status: 409 });
    }
    console.log(`[create-label] Reclaimed stale __pending__ lock for order ${order.order_number} (age ${Math.round(lockAgeMs / 1000)}s)`);
  }

  // Shippo에 이미 성공한 트랜잭션이 있으면 새로 결제하지 않고 재사용
  const existingTxRes = await fetch(
    `https://api.goshippo.com/transactions/?rate=${order.shippo_rate_id}&results=5`,
    { headers: { Authorization: `ShippoToken ${apiKey}` } }
  );
  if (existingTxRes.ok) {
    const existingTxData = await existingTxRes.json();
    const existingSuccess = (existingTxData.results ?? []).find(
      (t: { status: string; label_url: string }) =>
        t.status === "SUCCESS" && t.label_url
    );
    if (existingSuccess) {
      console.log(`[create-label] Found existing Shippo transaction — reusing label for order ${order.order_number}`);
      await supabase.from("orders").update({
        shippo_label_url: existingSuccess.label_url,
        tracking_number: existingSuccess.tracking_number || null,
        tracking_url: existingSuccess.tracking_url_provider || null,
        carrier: existingSuccess.provider || null,
        status: "packing",
        updated_at: new Date().toISOString(),
      }).eq("id", id);

      if (order.customer_email && existingSuccess.tracking_number) {
        (async () => {
          const { data: items } = await supabase
            .from("order_items")
            .select("name, quantity, unit_price")
            .eq("order_id", id);
          await sendTrackingEmail({
            orderNumber: order.order_number,
            customerEmail: order.customer_email!,
            customerName: order.customer_name ?? null,
            carrier: existingSuccess.provider ?? "",
            trackingNumber: existingSuccess.tracking_number,
            trackingUrl: existingSuccess.tracking_url_provider || null,
            items: (items ?? []).map((i: { name: string; quantity: number; unit_price: number }) => ({
              name: i.name,
              quantity: i.quantity,
              unitPrice: i.unit_price,
            })),
            total: order.total ?? 0,
          });
        })().catch((err) => console.error("[create-label] Tracking email error (reuse):", err));
      }

      return NextResponse.json({
        label_url: existingSuccess.label_url,
        tracking_number: existingSuccess.tracking_number,
        tracking_url: existingSuccess.tracking_url_provider,
        carrier: existingSuccess.provider,
        recovered: true,
      });
    }
  }

  async function releaseLock() {
    await supabase
      .from("orders")
      .update({ shippo_label_url: null })
      .eq("id", id)
      .eq("shippo_label_url", "__pending__");
  }

  // 1차 시도: 고객이 선택한 rate_id로 라벨 발급
  let shippoRes: Response;
  try {
    shippoRes = await fetch("https://api.goshippo.com/transactions/", {
      method: "POST",
      headers: {
        Authorization: `ShippoToken ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rate: order.shippo_rate_id,
        label_file_type: "PDF_4X6",
        async: false,
      }),
    });
  } catch (err) {
    console.error("[create-label] Shippo network error:", err);
    await releaseLock();
    return NextResponse.json({ error: "Failed to reach Shippo API" }, { status: 502 });
  }

  let transaction = await shippoRes.json();

  // Rate 만료, UPS modifier 오류 등 어떤 이유로든 실패 시 Canada Post로 자동 재조회
  const isModifierError = (transaction.messages ?? []).some(
    (m: { text?: string }) => m.text?.toLowerCase().includes("modifier is not applied")
  );

  if (
    (!shippoRes.ok || transaction.status !== "SUCCESS") &&
    order.shipping_address
  ) {
    const reason = isModifierError ? "UPS modifier error" : "primary rate failed (possibly expired)";
    console.log(`[create-label] ${reason} — re-quoting with Canada Post`);

    // 주문 상품 무게 계산
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

    const fallbackRateId = await getCanadaPostRateId(apiKey, order, totalWeight);

    if (fallbackRateId) {
      // Persist the fallback rate_id BEFORE purchasing from it. If the purchase
      // below succeeds but this request crashes before the final DB update,
      // order.shippo_rate_id will still point at the rate that was actually
      // charged — so the existing-transaction check above (and Sync/Recover)
      // can find it on retry instead of buying a second label.
      await supabase.from("orders").update({ shippo_rate_id: fallbackRateId }).eq("id", id);

      try {
        const retryRes = await fetch("https://api.goshippo.com/transactions/", {
          method: "POST",
          headers: {
            Authorization: `ShippoToken ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ rate: fallbackRateId, label_file_type: "PDF_4X6", async: false }),
        });
        const retryTx = await retryRes.json();
        if (retryRes.ok && retryTx.status === "SUCCESS") {
          console.log("[create-label] Canada Post fallback succeeded");
          transaction = retryTx;
          shippoRes = retryRes;
        } else {
          console.error("[create-label] Canada Post fallback also failed:", JSON.stringify(retryTx));
        }
      } catch (err) {
        console.error("[create-label] Canada Post fallback network error:", err);
      }
    } else {
      console.error("[create-label] Could not get Canada Post rate for fallback");
    }
  }

  if (!shippoRes.ok || transaction.status !== "SUCCESS") {
    console.error("[create-label] Shippo error:", JSON.stringify(transaction));
    await releaseLock();
    const msg =
      transaction.messages?.[0]?.text ??
      transaction.status ??
      "Shippo returned an error";
    return NextResponse.json({ error: `Shippo: ${msg}` }, { status: 400 });
  }

  const labelUrl: string = transaction.label_url;
  const trackingNumber: string = transaction.tracking_number ?? "";
  const trackingUrl: string = transaction.tracking_url_provider ?? "";
  const carrier: string = transaction.provider ?? "";

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      shippo_label_url: labelUrl,
      tracking_number: trackingNumber || null,
      tracking_url: trackingUrl || null,
      carrier: carrier || null,
      status: "packing",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    console.error("[create-label] Supabase update error:", updateError);
    // Label was purchased — log the transaction ID so admin can recover via sync
    console.error(`[create-label] ORPHANED LABEL — transaction: ${transaction.object_id}, tracking: ${trackingNumber}, url: ${labelUrl}`);
    return NextResponse.json({
      error: "Label was purchased from Shippo but failed to save to DB. Use 'Sync from Shippo' to recover.",
      transaction_id: transaction.object_id,
      tracking_number: trackingNumber,
    }, { status: 500 });
  }

  console.log(`[create-label] Label created for order ${order.order_number} — tracking: ${trackingNumber}`);

  if (order.customer_email && trackingNumber) {
    (async () => {
      const { data: items } = await supabase
        .from("order_items")
        .select("name, quantity, unit_price")
        .eq("order_id", id);
      await sendTrackingEmail({
        orderNumber: order.order_number,
        customerEmail: order.customer_email!,
        customerName: order.customer_name ?? null,
        carrier,
        trackingNumber,
        trackingUrl: trackingUrl || null,
        items: (items ?? []).map((i: { name: string; quantity: number; unit_price: number }) => ({
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unit_price,
        })),
        total: order.total ?? 0,
      });
    })().catch((err) => console.error("[create-label] Tracking email error:", err));
  }

  return NextResponse.json({
    label_url: labelUrl,
    tracking_number: trackingNumber,
    tracking_url: trackingUrl,
    carrier,
  });
}
