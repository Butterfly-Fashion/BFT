import { NextRequest, NextResponse } from "next/server";

export interface ShippingRate {
  id: string;
  provider: string;
  service: string;
  amount: number;
  currency: string;
  days: number | null;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.SHIPPO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ rates: [], fallback: true }, { status: 200 });
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
          street1: process.env.STORE_STREET ?? "100 King St W",
          city: process.env.STORE_CITY ?? "Toronto",
          state: process.env.STORE_PROVINCE ?? "ON",
          zip: process.env.STORE_POSTAL ?? "M5X 1A9",
          country: "CA",
        },
        address_to: {
          name: "Customer",
          street1: "1 Main St",
          city: city || "",
          state: province,
          zip: postal,
          country: "CA",
          validate: false,
        },
        parcels: [
          {
            length: "35",
            width: "25",
            height: "15",
            distance_unit: "cm",
            weight: String((weightKg ?? 0.5).toFixed(2)),
            mass_unit: "kg",
          },
        ],
        async: false,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[shipping-rates] Shippo error:", err);
      return NextResponse.json({ rates: [], fallback: true }, { status: 200 });
    }

    const data = await res.json();

    const rates: ShippingRate[] = (data.rates ?? [])
      .filter((r: { currency: string }) => r.currency === "CAD")
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

    return NextResponse.json({ rates });
  } catch (err) {
    console.error("[shipping-rates] fetch error:", err);
    return NextResponse.json({ rates: [], fallback: true }, { status: 200 });
  }
}
