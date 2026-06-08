import { NextRequest, NextResponse } from "next/server";

export interface ShippingRate {
  id: string;
  provider: string;
  service: string;
  amount: number;
  currency: string;
  days: number | null;
}

// Pick a standard box based on total weight to avoid always quoting the same box.
// Dimensional weight (L×W×H / 5000 for kg) is checked — we use the larger value.
// Standard box sizes chosen to match common Canada Post / UPS rate breaks.
function selectBox(weightKg: number): { length: string; width: string; height: string } {
  if (weightKg <= 0.30) {
    // Small: stickers, single car flag, single sticker pack
    return { length: "22", width: "18", height: "6" };
  }
  if (weightKg <= 0.80) {
    // Medium: single cap/hat/gloves, 2-3 light items
    return { length: "32", width: "24", height: "12" };
  }
  if (weightKg <= 2.00) {
    // Large: sticker box, multiple caps, mixed order
    return { length: "42", width: "32", height: "16" };
  }
  // XL: bulk order
  return { length: "50", width: "40", height: "22" };
}

// GET /api/shipping-rates — config check (safe, no secrets exposed)
export async function GET() {
  const apiKey = process.env.SHIPPO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ configured: false, reason: "SHIPPO_API_KEY not set" });
  }
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

  let body: { name?: string; street?: string; postal: string; province: string; city?: string; weightKg?: number; country?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { name, street, postal, province, city, weightKg, country = "CA" } = body;
  if (!postal || !province) {
    return NextResponse.json({ error: "postal and province required" }, { status: 400 });
  }

  const weight = Math.max(0.1, weightKg ?? 0.5);
  const box = selectBox(weight);

  // Dimensional weight check — carriers bill max(actual, dim weight)
  // Canada Post/UPS: dim weight (kg) = L×W×H(cm) / 5000
  const dimWeightKg =
    (parseFloat(box.length) * parseFloat(box.width) * parseFloat(box.height)) / 5000;
  const billableWeight = Math.max(weight, dimWeightKg);

  const shippoPayload = {
    address_from: {
      name: process.env.STORE_NAME ?? "World Fan Gear",
      street1: process.env.STORE_STREET ?? "178 Bentworth Ave",
      city: process.env.STORE_CITY ?? "North York",
      state: process.env.STORE_PROVINCE ?? "ON",
      zip: (process.env.STORE_POSTAL ?? "M6A1P7").replace(/\s/g, ""),
      country: "CA",
    },
    address_to: {
      name: name?.trim() || "Customer",
      street1: street?.trim() || "1 Main St",
      city: city || (country === "US" ? "New York" : "Toronto"),
      state: province,
      zip: postal.replace(/\s/g, "").toUpperCase(),
      country: country === "US" ? "US" : "CA",
      validate: false,
    },
    parcels: [
      {
        length: box.length,
        width: box.width,
        height: box.height,
        distance_unit: "cm",
        weight: billableWeight.toFixed(2),
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

    const isInternational = country !== "CA";
    const allRates: ShippingRate[] = (data.rates ?? [])
      .filter((r: { currency: string; provider: string }) =>
        r.currency?.toUpperCase() === "CAD" &&
        (isInternational || r.provider === "Canada Post")
      )
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
