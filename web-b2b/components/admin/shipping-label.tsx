"use client";

import { useState } from "react";

type Address = {
  name: string;
  street: string;
  city: string;
  province: string;
  postal: string;
  country: string;
};

type Props = {
  orderId: string;
  deliveryMethod: string;
  labelUrl: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  carrier: string | null;
  orderShippingAddress: string | null;
  defaultAddress: Address;
};

export function ShippingLabel({
  orderId,
  deliveryMethod,
  labelUrl: initialLabelUrl,
  trackingNumber: initialTracking,
  trackingUrl: initialTrackingUrl,
  carrier: initialCarrier,
  orderShippingAddress,
  defaultAddress,
}: Props) {
  const [addr, setAddr] = useState<Address>(defaultAddress);
  const [labelUrl, setLabelUrl] = useState(initialLabelUrl);
  const [tracking, setTracking] = useState(initialTracking);
  const [trackingUrl, setTrackingUrl] = useState(initialTrackingUrl);
  const [carrier, setCarrier] = useState(initialCarrier);
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  if (deliveryMethod === "Pickup") {
    return (
      <section className="card p-5">
        <h2 className="mb-1 text-base font-bold text-slate-900">Shipping label</h2>
        <p className="text-sm text-slate-500">
          This is a <span className="font-semibold">Pickup</span> order — no shipping label is needed. Set the status to
          “Ready for Pickup” when it’s packed.
        </p>
      </section>
    );
  }

  function update(field: keyof Address, value: string) {
    setAddr((prev) => ({ ...prev, [field]: value }));
  }

  async function createLabel() {
    setCreating(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/create-label`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: addr }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create label");
      setLabelUrl(data.label_url);
      setTracking(data.tracking_number ?? null);
      setTrackingUrl(data.tracking_url ?? null);
      setCarrier(data.carrier ?? null);
      setMsg({ type: "ok", text: data.reused ? "Existing label loaded." : "Label created! Order set to “Label Created”." });
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Label creation failed" });
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="card p-5">
      <h2 className="mb-3 text-base font-bold text-slate-900">Shipping label</h2>

      {labelUrl ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-800">
            ✓ Label ready{carrier ? ` — ${carrier}` : ""}
          </div>
          {tracking && (
            <p className="rounded-md bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600">
              {carrier && <span className="mr-2 font-bold text-slate-800">{carrier}</span>}
              {tracking}
            </p>
          )}
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            <iframe src={labelUrl} title="Shipping label" className="w-full" style={{ height: "280px", border: "none" }} />
          </div>
          <div className="flex flex-wrap gap-2">
            <a className="btn-primary text-sm" href={labelUrl} target="_blank" rel="noopener noreferrer">
              Open / Print PDF
            </a>
            {trackingUrl && (
              <a className="btn-secondary text-sm" href={trackingUrl} target="_blank" rel="noopener noreferrer">
                Track package →
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {orderShippingAddress && (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <p className="mb-1 text-xs font-bold text-slate-400">Customer’s requested shipping address</p>
              {orderShippingAddress}
            </div>
          )}
          <p className="text-xs text-slate-500">
            Confirm the ship-to address below (prefilled from the order / customer profile), then create the label.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="label md:col-span-2">
              Recipient name
              <input className="field" value={addr.name} onChange={(e) => update("name", e.target.value)} />
            </label>
            <label className="label md:col-span-2">
              Street
              <input className="field" value={addr.street} onChange={(e) => update("street", e.target.value)} />
            </label>
            <label className="label">
              City
              <input className="field" value={addr.city} onChange={(e) => update("city", e.target.value)} />
            </label>
            <label className="label">
              Province
              <input className="field" value={addr.province} onChange={(e) => update("province", e.target.value)} />
            </label>
            <label className="label">
              Postal code
              <input className="field" value={addr.postal} onChange={(e) => update("postal", e.target.value)} />
            </label>
            <label className="label">
              Country (2-letter)
              <input className="field" value={addr.country} onChange={(e) => update("country", e.target.value)} />
            </label>
          </div>
          <p className="text-xs text-slate-400">
            Box size and parcel weight are calculated automatically from the products on this order. The cheapest CAD rate
            is purchased.
          </p>
          <button type="button" className="btn-primary text-sm" disabled={creating} onClick={createLabel}>
            {creating ? "Creating label…" : "🏷️ Create shipping label"}
          </button>
        </div>
      )}

      {msg && (
        <div
          className={`mt-3 rounded-md px-3 py-2 text-sm font-semibold ${
            msg.type === "ok" ? "border border-green-200 bg-green-50 text-green-800" : "border border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {msg.text}
        </div>
      )}
    </section>
  );
}
