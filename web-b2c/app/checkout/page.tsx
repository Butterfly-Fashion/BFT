"use client";

import { useState } from "react";
import { useCart } from "@/components/store/cart-provider";
import { ProductImage } from "@/components/store/product-image";
import {
  formatCAD,
  calculateShipping,
  calculateTax,
} from "@/lib/money";
import { CANADIAN_PROVINCES } from "@/lib/types";
import type { CheckoutAddress, Order } from "@/lib/types";
import Link from "next/link";

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
  const { items, subtotal, clearCart } = useCart();
  const [form, setForm] = useState<CheckoutAddress>(EMPTY_ADDRESS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shipping = calculateShipping(subtotal);
  const tax = calculateTax(subtotal);
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
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Checkout failed");
      }

      const { url } = await res.json();
      clearCart();
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

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Left — shipping info */}
        <div className="lg:col-span-3 space-y-6">
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
            </div>
          </fieldset>

          {/* Shipping */}
          <fieldset>
            <legend className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
              Shipping Address
            </legend>
            <div className="space-y-3">
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
                <span>Tax (HST 13%)</span>
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
