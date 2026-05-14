import { NextRequest, NextResponse } from "next/server";

export interface ShippingRate {
  id: string;
  provider: string;
  service: string;
  amount: number;
  currency: string;
  days: number | null;
}

// GET /api/shipping-rates — config check (safe, no secrets exposed)
export async function GET() {
  const apiKey = process.env.SHIPPO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ configured: false, reason: "SHIPPO_API_KEY not set" });
  }
  // verify key by calling Shippo carrier accounts
  try {
    const res = await fetch("https://api.goshippo.com/carrier_accounts/?results=1", {
      headers: { Authorization: `ShippoToken ${apiKey}` },
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ configured: false, status: res.status, shippoError: data });
    }
    return NextResponse.json({ configured: true, keyPrefix: apiKey.slice(0, 18) + "…" });
  } catch (e) {
    return NextResponse.json({ configured: false, networkError: String(e) });
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.SHIPPO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ rates: [], fallback: true, debug: "SHIPPO_API_KEY not set in env" }, { status: 200 });
  }

  let body: { postal: string; province: string; city?: string; weightKg?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { postal, province, city, weightKg } = body;
  if (!postal || !province) {
    return NextResponse.json({ error: "postal and province required" }, { status: 400 });
  }

  const weight = Math.max(0.1, weightKg ?? 0.5);

  const shippoPayload = {
    address_from: {
      name: process.env.STORE_NAME ?? "World Fan Gear",
      street1: process.env.STORE_STREET ?? "178 Bentworth Ave",
      city: process.env.STORE_CITY ?? "North York",
      state: process.env.STORE_PROVINCE ?? "ON",
      zip: process.env.STORE_POSTAL ?? "M6A 1P7",
      country: "CA",
    },
    address_to: {
      name: "Customer",
      street1: "1 Main St",
      city: city || "Toronto",
      state: province,
      zip: postal.replace(/\s/g, "").toUpperCase(),
      country: "CA",
      validate: false,
    },
    parcels: [
      {
        length: "35",
        width: "25",
        height: "15",
        distance_unit: "cm",
        weight: weight.toFixed(2),
        mass_unit: "kg",
      },
    ],
    async: false,
  };

  try {
    const res = await fetch("https://api.goshippo.com/shipments/", {
      method: "POST",
      headers: {
        Authorization: `ShippoToken ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(shippoPayload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[shipping-rates] Shippo HTTP error", res.status, JSON.stringify(data));
      return NextResponse.json({
        rates: [],
        fallback: true,
        debug: `Shippo ${res.status}: ${JSON.stringify(data).slice(0, 300)}`,
      }, { status: 200 });
    }

    const allRates: ShippingRate[] = (data.rates ?? [])
      .filter((r: { currency: string }) => r.currency?.toUpperCase() === "CAD")
      .map((r: {
        object_id: string;
        provider: string;
        servicelevel?: { name?: string; token?: string };
        amount: string;
        currency: string;
        estimated_days: number | null;
      }) => ({
        id: r.object_id,
        provider: r.provider,
        service: r.servicelevel?.name ?? r.servicelevel?.token ?? "Standard",
        amount: parseFloat(r.amount),
        currency: r.currency,
        days: r.estimated_days ?? null,
      }))
      .sort((a: ShippingRate, b: ShippingRate) => a.amount - b.amount);

    if (allRates.length === 0) {
      console.warn("[shipping-rates] Shippo returned 0 CAD rates. Total rates:", data.rates?.length, "Status:", data.status);
      return NextResponse.json({
        rates: [],
        fallback: true,
        debug: `Shippo OK but 0 CAD rates (total: ${data.rates?.length ?? 0}, shipment status: ${data.status})`,
      });
    }

    return NextResponse.json({ rates: allRates });
  } catch (err) {
    console.error("[shipping-rates] network error:", err);
    return NextResponse.json({
      rates: [],
      fallback: true,
      debug: `Network error: ${String(err)}`,
    }, { status: 200 });
  }
}
