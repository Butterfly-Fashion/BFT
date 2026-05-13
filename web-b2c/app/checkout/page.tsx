"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/components/store/cart-provider";
import { ProductImage } from "@/components/store/product-image";
import {
  formatCAD,
  calculateShipping,
  calculateTax,
  getTaxLabel,
  FLAT_SHIPPING,
} from "@/lib/money";
import { CANADIAN_PROVINCES } from "@/lib/types";
import type { CheckoutAddress, Order } from "@/lib/types";
import type { ShippingRate } from "@/app/api/shipping-rates/route";
import Link from "next/link";

type DeliveryMethod = "shipping" | "pickup";

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

function generateOrderId(): string {
  return `WFG-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export default function CheckoutPage() {
  const { items, subtotal } = useCart();
  const [form, setForm] = useState<CheckoutAddress>(EMPTY_ADDRESS);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("shipping");
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [fetchingRates, setFetchingRates] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fetch Shippo rates when postal code is complete
  useEffect(() => {
    if (deliveryMethod !== "shipping") return;
    const postal = form.postalCode.replace(/\s/g, "");
    if (postal.length < 6) {
      setShippingRates([]);
      setSelectedRate(null);
      return;
    }
    let cancelled = false;
    setFetchingRates(true);
    fetch("/api/shipping-rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
          postal: form.postalCode,
          province: form.province,
          city: form.city,
          weightKg: items.reduce((sum, item) => sum + item.weightKg * item.quantity, 0),
        }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.rates?.length) {
          setShippingRates(data.rates);
          setSelectedRate(data.rates[0]);
        } else {
          setShippingRates([]);
          setSelectedRate(null);
        }
      })
      .catch(() => { if (!cancelled) { setShippingRates([]); setSelectedRate(null); } })
      .finally(() => { if (!cancelled) setFetchingRates(false); });
    return () => { cancelled = true; };
  }, [form.postalCode, form.province, form.city, deliveryMethod]);

  const taxProvince = deliveryMethod === "pickup" ? "ON" : form.province;
  const shipping =
    deliveryMethod === "pickup"
      ? 0
      : selectedRate?.amount ?? calculateShipping(subtotal, form.province);
  const tax = calculateTax(subtotal, taxProvince);
  const total = subtotal + shipping + tax;

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

    setSubmitting(true);

    try {
      const orderId = generateOrderId();

      const pendingOrder: Order = {
        id: orderId,
        items,
        address: form,
        subtotal,
        shipping,
        tax,
        total,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(`b2c-pending-${orderId}`, JSON.stringify(pendingOrder));

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          items,
          customerEmail: form.email,
          subtotal,
          shipping,
          tax,
          total,
          deliveryMethod,
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

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Nothing to check out</h1>
        <Link
          href="/products"
          className="inline-flex items-center justify-center px-8 py-3.5 bg-[#C41E3A] text-white font-semibold rounded-full hover:bg-[#A01830] transition-colors text-sm"
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
                    ? "bg-[#C41E3A] text-white"
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
                onClick={() => setDeliveryMethod("shipping")}
                className={`flex flex-col items-start gap-1 rounded-xl border-2 px-4 py-4 text-left transition-colors ${
                  deliveryMethod === "shipping"
                    ? "border-[#C41E3A] bg-red-50"
                    : "border-gray-200 bg-white hover:border-gray-400"
                }`}
              >
                <span className="text-xl">🚚</span>
                <span className="text-sm font-bold text-gray-900">Shipping</span>
                <span className="text-xs text-gray-500">From {formatCAD(FLAT_SHIPPING)}</span>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMethod("pickup")}
                className={`flex flex-col items-start gap-1 rounded-xl border-2 px-4 py-4 text-left transition-colors ${
                  deliveryMethod === "pickup"
                    ? "border-[#C41E3A] bg-red-50"
                    : "border-gray-200 bg-white hover:border-gray-400"
                }`}
              >
                <span className="text-xl">🏪</span>
                <span className="text-sm font-bold text-gray-900">Pickup</span>
                <span className="text-xs text-green-600 font-semibold">Free</span>
              </button>
            </div>
          </fieldset>

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
                className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#C41E3A] focus:ring-1 focus:ring-[#C41E3A] bg-white transition-colors"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  name="firstName"
                  required
                  placeholder="First name"
                  value={form.firstName}
                  onChange={handleChange}
                  className="h-12 px-4 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#C41E3A] focus:ring-1 focus:ring-[#C41E3A] bg-white transition-colors"
                />
                <input
                  type="text"
                  name="lastName"
                  required
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={handleChange}
                  className="h-12 px-4 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#C41E3A] focus:ring-1 focus:ring-[#C41E3A] bg-white transition-colors"
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
                <input
                  type="text"
                  name="address"
                  required
                  placeholder="Street address"
                  value={form.address}
                  onChange={handleChange}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#C41E3A] focus:ring-1 focus:ring-[#C41E3A] bg-white transition-colors"
                />
                <input
                  type="text"
                  name="apartment"
                  placeholder="Apartment, suite, unit (optional)"
                  value={form.apartment}
                  onChange={handleChange}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#C41E3A] focus:ring-1 focus:ring-[#C41E3A] bg-white transition-colors"
                />
                <input
                  type="text"
                  name="city"
                  required
                  placeholder="City"
                  value={form.city}
                  onChange={handleChange}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#C41E3A] focus:ring-1 focus:ring-[#C41E3A] bg-white transition-colors"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    name="province"
                    required
                    value={form.province}
                    onChange={handleChange}
                    className="h-12 px-4 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#C41E3A] focus:ring-1 focus:ring-[#C41E3A] bg-white transition-colors"
                  >
                    {CANADIAN_PROVINCES.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    name="postalCode"
                    required
                    placeholder="Postal code"
                    value={form.postalCode}
                    onChange={handleChange}
                    pattern="[A-Za-z][0-9][A-Za-z]\s?[0-9][A-Za-z][0-9]"
                    title="Enter a valid Canadian postal code (e.g. M5V 3L9)"
                    maxLength={7}
                    className="h-12 px-4 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#C41E3A] focus:ring-1 focus:ring-[#C41E3A] bg-white transition-colors uppercase"
                  />
                </div>
                <input
                  type="text"
                  name="country"
                  value="Canada"
                  readOnly
                  className="w-full h-12 px-4 rounded-xl border border-gray-100 text-sm text-gray-500 bg-gray-50 cursor-not-allowed"
                />
              </div>
            </fieldset>
          )}

          {/* Shippo shipping rate picker */}
          {deliveryMethod === "shipping" && (fetchingRates || shippingRates.length > 0) && (
            <fieldset>
              <legend className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
                Shipping Method
              </legend>
              {fetchingRates ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                  <svg className="animate-spin w-4 h-4 text-[#C41E3A]" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                  Fetching shipping rates…
                </div>
              ) : (
                <div className="space-y-2">
                  {shippingRates.map((rate) => (
                    <button
                      key={rate.id}
                      type="button"
                      onClick={() => setSelectedRate(rate)}
                      className={`w-full flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                        selectedRate?.id === rate.id
                          ? "border-[#C41E3A] bg-red-50"
                          : "border-gray-200 bg-white hover:border-gray-400"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {rate.provider} — {rate.service}
                        </p>
                        {rate.days != null && (
                          <p className="text-xs text-gray-400">
                            {rate.days} business day{rate.days !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-bold text-gray-900 shrink-0 ml-4">
                        {formatCAD(rate.amount)}
                      </span>
                    </button>
                  ))}
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
              {items.map((item) => (
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
                <span className={`font-medium ${shipping === 0 ? "text-green-600" : ""}`}>
                  {shipping === 0 ? "Free" : formatCAD(shipping)}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{getTaxLabel(taxProvince)}</span>
                <span className="font-medium">{formatCAD(tax)}</span>
              </div>
            </div>

            <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between font-bold text-gray-900">
              <span>Total</span>
              <span>{formatCAD(total)}</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full py-3.5 bg-[#C41E3A] text-white font-semibold rounded-full hover:bg-[#A01830] transition-colors text-sm shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Redirecting to payment…" : `Pay ${formatCAD(total)}`}
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
