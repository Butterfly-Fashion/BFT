"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/components/store/cart-provider";
import { ProductImage } from "@/components/store/product-image";
import { formatCAD, calculateTax, getTaxLabel } from "@/lib/money";
import { CANADIAN_PROVINCES, US_STATES } from "@/lib/types";
import type { CheckoutAddress, Order } from "@/lib/types";
import type { ShippingRate } from "@/app/api/shipping-rates/route";
import { CHECKOUT_DISABLED_MESSAGE, CHECKOUT_ENABLED } from "@/lib/checkout-status";
import Link from "next/link";

type DeliveryMethod = "shipping" | "pickup";

const CARRIER_META: Record<string, { label: string; bg: string; text: string }> = {
  CANADA_POST:  { label: "Canada Post", bg: "#CC0000", text: "#fff" },
  UPS:          { label: "UPS",         bg: "#351C15", text: "#FFB500" },
  FEDEX:        { label: "FedEx",       bg: "#4D148C", text: "#FF6600" },
  PUROLATOR:    { label: "Purolator",   bg: "#003876", text: "#fff" },
  DHL_EXPRESS:  { label: "DHL",         bg: "#FFCC00", text: "#D40511" },
  USPS:         { label: "USPS",        bg: "#004B87", text: "#fff" },
};

function carrierMeta(provider: string) {
  const key = provider.toUpperCase().replace(/[\s-]/g, "_");
  return CARRIER_META[key] ?? { label: provider, bg: "#374151", text: "#fff" };
}

function CarrierBadge({ provider }: { provider: string }) {
  const { label, bg, text } = carrierMeta(provider);
  return (
    <span
      className="inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[11px] font-black tracking-wide shrink-0"
      style={{ background: bg, color: text, minWidth: 56 }}
    >
      {label}
    </span>
  );
}

const EMPTY_ADDRESS: CheckoutAddress = {
  firstName: "",
  lastName: "",
  email: "",
  address: "",
  apartment: "",
  city: "",
  province: "ON",
  postalCode: "",
  country: "Canada",
};

const COUNTRY_OPTIONS = [
  { code: "CA", label: "🇨🇦 Canada",         country: "Canada",        defaultProvince: "ON" },
  { code: "US", label: "🇺🇸 United States",   country: "United States", defaultProvince: "NY" },
] as const;

function generateOrderId(): string {
  return `WFG-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export default function CheckoutPage() {
  const { items, pricedItems, subtotal } = useCart();
  const [form, setForm] = useState<CheckoutAddress>(EMPTY_ADDRESS);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("pickup");
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [fetchingRates, setFetchingRates] = useState(false);
  const [hasFetchedRates, setHasFetchedRates] = useState(false);
  const [rateDebug, setRateDebug] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const countryCode: "CA" | "US" = form.country === "United States" ? "US" : "CA";

  function handleCountryChange(opt: typeof COUNTRY_OPTIONS[number]) {
    setForm((prev) => ({
      ...prev,
      country: opt.country,
      province: opt.defaultProvince,
      postalCode: "",
    }));
    setShippingRates([]);
    setSelectedRate(null);
    setHasFetchedRates(false);
  }

  // Auto-fetch Shippo rates when postal code is complete
  useEffect(() => {
    if (deliveryMethod !== "shipping") {
        setHasFetchedRates(false);
        return;
    }
    const postal = form.postalCode.replace(/\s/g, "");
    const minLen = countryCode === "US" ? 5 : 6;
    if (postal.length < minLen) {
      setShippingRates([]);
      setSelectedRate(null);
      setHasFetchedRates(false);
      return;
    }
    let cancelled = false;
    setFetchingRates(true);
    setHasFetchedRates(false);
    fetch("/api/shipping-rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
          name: `${form.firstName} ${form.lastName}`.trim(),
          street: form.address,
          postal: form.postalCode,
          province: form.province,
          city: form.city,
          country: countryCode,
          weightKg: items.reduce((sum, item) => sum + item.weightKg * item.quantity, 0),
        }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.rates?.length) {
          setShippingRates(data.rates);
          setSelectedRate(data.rates[0]);
          setRateDebug(null);
        } else {
          setShippingRates([]);
          setSelectedRate(null);
          setRateDebug(data.debug ?? null);
        }
        setHasFetchedRates(true);
      })
      .catch((e) => {
        if (!cancelled) {
            setShippingRates([]);
            setSelectedRate(null);
            setRateDebug(String(e));
            setHasFetchedRates(true);
        }
      })
      .finally(() => { if (!cancelled) setFetchingRates(false); });
    return () => { cancelled = true; };
  }, [form.firstName, form.lastName, form.address, form.postalCode, form.province, form.city, form.country, deliveryMethod, items, countryCode]);

  const taxProvince = deliveryMethod === "pickup" ? "ON" : form.province;
  const shipping =
    deliveryMethod === "pickup"
      ? 0
      : selectedRate?.amount ?? 0;
  const tax = countryCode === "US" ? 0 : calculateTax(subtotal, taxProvince);
  const total = subtotal + shipping + tax;

  const isShippingUnavailable = deliveryMethod === "shipping" && hasFetchedRates && shippingRates.length === 0;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (deliveryMethod === "shipping" && !selectedRate) {
        setError("Please select a shipping carrier to proceed.");
        return;
    }

    setSubmitting(true);

    try {
      const orderId = generateOrderId();

      const pendingOrder: Order = {
        id: orderId,
        items: pricedItems,
        address: form,
        subtotal,
        shipping,
        tax,
        total,
        createdAt: new Date().toISOString(),
        deliveryMethod,
      };
      localStorage.setItem(`b2c-pending-${orderId}`, JSON.stringify(pendingOrder));

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          items: pricedItems,
          customerEmail: form.email,
          subtotal,
          shipping,
          tax,
          total,
          deliveryMethod,
          shippoRateId: selectedRate?.id ?? null,
          carrier: selectedRate?.provider ?? null,
          address: {
            firstName: form.firstName,
            lastName: form.lastName,
            address: form.address,
            apartment: form.apartment,
            city: form.city,
            province: form.province,
            postalCode: form.postalCode,
            country: form.country,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Checkout failed");
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  if (!CHECKOUT_ENABLED) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-3">
          Checkout Paused
        </p>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          We are updating shipping options
        </h1>
        <p className="text-sm leading-6 text-gray-500 mb-8">{CHECKOUT_DISABLED_MESSAGE}</p>
        <Link
          href="/cart"
          className="inline-flex items-center justify-center px-8 py-3.5 bg-gray-900 text-white font-semibold rounded-full hover:bg-gray-800 transition-colors text-sm"
        >
          Return to Cart
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Nothing to check out</h1>
        <Link
          href="/products"
          className="inline-flex items-center justify-center px-8 py-3.5 bg-brand text-white font-semibold rounded-full hover:bg-brand-hover transition-colors text-sm"
        >
          Shop Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-10">Checkout</h1>

      <div className="flex items-center gap-0 mb-10 overflow-x-auto pb-1">
        {["Cart", "Information", "Payment"].map((step, i) => (
          <div key={step} className="flex items-center shrink-0">
            <div className="flex items-center gap-2">
              <div
                className={[
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                  i === 1
                    ? "bg-brand text-white"
                    : i < 1
                      ? "bg-gray-900 text-white"
                      : "bg-gray-200 text-gray-400",
                ].join(" ")}
              >
                {i < 1 ? "✓" : i + 1}
              </div>
              <span
                className={[
                  "text-sm font-semibold",
                  i === 1 ? "text-gray-900" : "text-gray-400",
                ].join(" ")}
              >
                {step}
              </span>
            </div>
            {i < 2 && <div className="w-8 h-px bg-gray-200 mx-3" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-3 space-y-6">

          {/* Delivery Method */}
          <fieldset>
            <legend className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
              Delivery Method
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeliveryMethod("pickup")}
                className={`flex flex-col items-start gap-1 rounded-xl border-2 px-4 py-4 text-left transition-colors ${
                  deliveryMethod === "pickup"
                    ? "border-brand bg-red-50"
                    : "border-gray-200 bg-white hover:border-gray-400"
                }`}
              >
                <span className="text-sm font-bold text-gray-900">Pickup</span>
                <span className="text-xs text-green-600 font-semibold">Free - fastest option</span>
                <span className="text-[11px] text-gray-500 leading-snug mt-0.5">
                  178 Bentworth Ave<br />North York · M6A 1P7
                </span>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMethod("shipping")}
                className={`flex flex-col items-start gap-1 rounded-xl border-2 px-4 py-4 text-left transition-colors ${
                  deliveryMethod === "shipping"
                    ? "border-brand bg-red-50"
                    : "border-gray-200 bg-white hover:border-gray-400"
                }`}
              >
                <span className="text-sm font-bold text-gray-900">Shipping</span>
                <span className="text-xs text-gray-500">Carrier rates calculated by address</span>
              </button>
            </div>
          </fieldset>

          {/* Pickup address info */}
          {deliveryMethod === "pickup" && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-4 space-y-2">
              <p className="text-sm font-bold text-green-900">📍 Pickup Location</p>
              <p className="text-sm text-green-800 font-semibold">178 Bentworth Ave, North York, ON M6A 1P7</p>
              <p className="text-xs text-green-700 leading-5">
                Mon–Sat 9 AM–7 PM · <strong>Sun</strong> 11 AM–4:30 PM ET · Please wait for a confirmation email before coming to pick up.
              </p>
              <a
                href="https://maps.google.com/?q=178+Bentworth+Ave+North+York+ON"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs font-semibold text-green-700 underline hover:text-green-900"
              >
                View on Google Maps →
              </a>
            </div>
          )}

          {/* Contact */}
          <fieldset>
            <legend className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
              Contact
            </legend>
            <div className="space-y-3">
              <input
                type="email"
                name="email"
                required
                placeholder="Email address"
                value={form.email}
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand bg-white transition-colors"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  name="firstName"
                  required
                  placeholder="First name"
                  value={form.firstName}
                  onChange={handleChange}
                  className="h-12 px-4 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand bg-white transition-colors"
                />
                <input
                  type="text"
                  name="lastName"
                  required
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={handleChange}
                  className="h-12 px-4 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand bg-white transition-colors"
                />
              </div>
            </div>
          </fieldset>

          {/* Shipping Address — only when shipping */}
          {deliveryMethod === "shipping" && (
            <fieldset>
              <legend className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
                Shipping Address
              </legend>
              <div className="space-y-3">
                {/* Country selector */}
                <div className="grid grid-cols-2 gap-3">
                  {COUNTRY_OPTIONS.map((opt) => (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => handleCountryChange(opt)}
                      className={`h-12 rounded-xl border-2 text-sm font-semibold transition-colors ${
                        countryCode === opt.code
                          ? "border-brand bg-red-50 text-gray-900"
                          : "border-gray-200 bg-white text-gray-500 hover:border-gray-400"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  name="address"
                  required
                  placeholder="Street address"
                  value={form.address}
                  onChange={handleChange}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand bg-white transition-colors"
                />
                <input
                  type="text"
                  name="apartment"
                  placeholder="Apartment, suite, unit (optional)"
                  value={form.apartment}
                  onChange={handleChange}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand bg-white transition-colors"
                />
                <input
                  type="text"
                  name="city"
                  required
                  placeholder="City"
                  value={form.city}
                  onChange={handleChange}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand bg-white transition-colors"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    name="province"
                    required
                    value={form.province}
                    onChange={handleChange}
                    className="h-12 px-4 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand bg-white transition-colors"
                  >
                    {countryCode === "CA"
                      ? CANADIAN_PROVINCES.map((p) => (
                          <option key={p.code} value={p.code}>{p.name}</option>
                        ))
                      : US_STATES.map((s) => (
                          <option key={s.code} value={s.code}>{s.name}</option>
                        ))
                    }
                  </select>
                  <input
                    type="text"
                    name="postalCode"
                    required
                    placeholder={countryCode === "CA" ? "Postal code" : "ZIP code"}
                    value={form.postalCode}
                    onChange={handleChange}
                    pattern={countryCode === "CA"
                      ? "[A-Za-z][0-9][A-Za-z]\\s?[0-9][A-Za-z][0-9]"
                      : "[0-9]{5}(-[0-9]{4})?"}
                    title={countryCode === "CA"
                      ? "Enter a valid Canadian postal code (e.g. M5V 3L9)"
                      : "Enter a valid US ZIP code (e.g. 10001)"}
                    maxLength={countryCode === "CA" ? 7 : 10}
                    className="h-12 px-4 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand bg-white transition-colors uppercase"
                  />
                </div>

                {countryCode === "US" && (
                  <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                    🌎 International order — no Canadian taxes charged. Shipping rates are in CAD.
                  </p>
                )}
              </div>
            </fieldset>
          )}

          {/* Shipping carrier picker */}
          {deliveryMethod === "shipping" && (
            <fieldset>
              <legend className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                Shipping Method
              </legend>

              {/* hint before postal is filled */}
              {!fetchingRates && shippingRates.length === 0 && !hasFetchedRates && form.postalCode.replace(/\s/g, "").length < 6 && (
                <p className="text-xs text-gray-400 py-2 px-3 bg-gray-50 rounded-lg">
                  Enter your postal code above to see available carriers and rates.
                </p>
              )}

              {/* spinner */}
              {fetchingRates && (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-3 px-3 bg-gray-50 rounded-lg">
                  <svg className="animate-spin w-4 h-4 text-brand shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                  Fetching rates from Canada Post, UPS and more…
                </div>
              )}

              {/* rate cards */}
              {!fetchingRates && shippingRates.length > 0 && (
                <div className="space-y-2">
                  {shippingRates.map((rate) => {
                    const selected = selectedRate?.id === rate.id;
                    return (
                      <button
                        key={rate.id}
                        type="button"
                        onClick={() => setSelectedRate(rate)}
                        className={`w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                          selected
                            ? "border-brand bg-red-50 shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-400"
                        }`}
                      >
                        {/* radio dot */}
                        <span className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                          selected ? "border-brand" : "border-gray-300"
                        }`}>
                          {selected && <span className="w-2 h-2 rounded-full bg-brand" />}
                        </span>

                        {/* carrier badge */}
                        <CarrierBadge provider={rate.provider} />

                        {/* service info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {rate.service}
                          </p>
                          {rate.days != null && (
                            <p className="text-xs text-gray-400">
                              Est. {rate.days} business day{rate.days !== 1 ? "s" : ""}
                            </p>
                          )}
                        </div>

                        {/* price */}
                        <span className={`text-sm font-bold shrink-0 ${selected ? "text-brand" : "text-gray-900"}`}>
                          {formatCAD(rate.amount)}
                        </span>
                      </button>
                    );
                  })}

                  <p className="text-[11px] text-gray-400 pt-1 px-1">
                    Rates provided by carriers via Shippo. Sorted by price.
                  </p>
                </div>
              )}

              {/* no rates failure */}
              {!fetchingRates && hasFetchedRates && shippingRates.length === 0 && (
                <div className="py-3 px-4 bg-amber-50 border border-amber-100 rounded-xl space-y-1">
                  <p className="text-sm font-bold text-amber-900 flex items-center gap-2">
                    <span>⚠️</span> Shipping unavailable
                  </p>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    We could not find shipping carriers for this address. Please switch to <strong>Pickup</strong> to complete your order, or contact us for help.
                  </p>
                </div>
              )}
            </fieldset>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>
          )}
        </div>

        {/* Right — order summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
            <h2 className="text-sm font-bold text-gray-900 mb-5 uppercase tracking-wide">
              Order Summary
            </h2>

            <div className="space-y-3 mb-5">
              {pricedItems.map((item) => (
                <div
                  key={`${item.id}::${item.size ?? ""}`}
                  className="flex items-start gap-3"
                >
                  <div
                    className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden"
                    style={{ background: item.placeholderGradient }}
                  >
                    <ProductImage
                      src={item.imageUrl}
                      alt={item.name}
                      placeholderGradient={item.placeholderGradient}
                      sizes="48px"
                      className="object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 leading-snug truncate">
                      {item.name}
                    </p>
                    {item.size && (
                      <p className="text-[11px] text-gray-400">Size: {item.size}</p>
                    )}
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-xs font-semibold text-gray-900 shrink-0">
                    {formatCAD(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium">{formatCAD(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className={`font-medium ${deliveryMethod === "pickup" ? "text-green-600" : ""}`}>
                  {deliveryMethod === "pickup"
                    ? "Free"
                    : selectedRate
                      ? formatCAD(selectedRate.amount)
                      : fetchingRates
                        ? "Calculating…"
                        : form.postalCode.replace(/\s/g, "").length >= 6
                          ? "—"
                          : "Enter address"}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{countryCode === "US" ? "Tax" : getTaxLabel(taxProvince)}</span>
                <span className="font-medium">
                  {countryCode === "US" ? <span className="text-blue-600 text-xs font-semibold">Not charged</span> : formatCAD(tax)}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between font-bold text-gray-900">
              <span>Total</span>
              <span>
                {deliveryMethod === "shipping" && !selectedRate
                  ? "—"
                  : formatCAD(total)}
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting || (deliveryMethod === "shipping" && !selectedRate)}
              className="mt-6 w-full py-3.5 bg-brand text-white font-semibold rounded-full hover:bg-brand-hover transition-colors text-sm shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Redirecting to payment…" : isShippingUnavailable ? "Shipping unavailable — use Pickup" : `Pay ${formatCAD(total)}`}
            </button>

            <p className="mt-3 text-center text-[11px] text-gray-400">
              🔒 Secure checkout via Stripe · Your information is protected
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
