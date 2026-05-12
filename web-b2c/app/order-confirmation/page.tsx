"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Order } from "@/lib/types";
import { formatCAD } from "@/lib/money";
import { ProductImage } from "@/components/store/product-image";
import { useCart } from "@/components/store/cart-provider";
import { getProvinceName } from "@/lib/types";
import Link from "next/link";

type Status = "loading" | "success" | "failed" | "no-order";

function OrderConfirmationInner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { clearCart } = useCart();

  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    async function verify() {
      if (!sessionId) {
        const stored = localStorage.getItem("b2c-last-order");
        if (stored) {
          try {
            setOrder(JSON.parse(stored));
            setStatus("success");
          } catch {
            setStatus("no-order");
          }
        } else {
          setStatus("no-order");
        }
        return;
      }

      try {
        const res = await fetch(`/api/verify-payment?session_id=${sessionId}`);
        const data = await res.json();

        if (!res.ok || !data.paid) {
          setStatus("failed");
          return;
        }

        const { orderId, fallbackOrder } = data;
        if (orderId) {
          const raw = localStorage.getItem(`b2c-pending-${orderId}`);
          if (raw) {
            try {
              const pending: Order = JSON.parse(raw);
              localStorage.setItem("b2c-last-order", raw);
              localStorage.removeItem(`b2c-pending-${orderId}`);
              setOrder(pending);
            } catch {
              setOrder(fallbackOrder ?? null);
            }
          } else if (fallbackOrder) {
            // Different device / cleared localStorage — use Stripe data
            localStorage.setItem("b2c-last-order", JSON.stringify(fallbackOrder));
            setOrder(fallbackOrder);
          }
        }

        // 결제 확인 후 장바구니 비우기 (checkout에서 미리 지우지 않음)
        clearCart();
        setStatus("success");
      } catch {
        setStatus("failed");
      }
    }

    verify();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  if (status === "loading") {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#C41E3A] rounded-full animate-spin mx-auto mb-6" />
        <p className="text-gray-500 text-sm">Confirming your payment…</p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Payment not completed</h1>
        <p className="text-gray-500 text-sm mb-8">
          Your payment was not confirmed. You have not been charged. Please try again.
        </p>
        <Link
          href="/checkout"
          className="inline-flex items-center justify-center px-8 py-3.5 bg-[#C41E3A] text-white font-semibold rounded-full hover:bg-[#A01830] transition-colors text-sm"
        >
          Return to Checkout
        </Link>
      </div>
    );
  }

  if (status === "no-order") {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">No order found</h1>
        <Link
          href="/products"
          className="inline-flex items-center justify-center px-8 py-3.5 bg-[#C41E3A] text-white font-semibold rounded-full hover:bg-[#A01830] transition-colors text-sm"
        >
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      {/* Success header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Order Confirmed!
        </h1>
        <p className="text-gray-500 text-sm">
          Thanks for your order. A confirmation email will be sent to{" "}
          <strong className="text-gray-700">{order?.address.email}</strong>.
        </p>
      </div>

      {order && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Order number */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Order Number</p>
              <p className="font-bold text-gray-900 font-mono text-sm mt-0.5">{order.id}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Date</p>
              <p className="text-sm font-medium text-gray-700 mt-0.5">
                {new Date(order.createdAt).toLocaleDateString("en-CA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Items */}
          <div className="px-6 py-4 border-b border-gray-100 space-y-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Items</p>
            {order.items.map((item) => (
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
                  <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                  {item.size && (
                    <p className="text-xs text-gray-400">Size: {item.size}</p>
                  )}
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCAD(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          {/* Shipping address */}
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
              Shipping To
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {order.address.firstName} {order.address.lastName}
              <br />
              {order.address.address}
              {order.address.apartment && `, ${order.address.apartment}`}
              <br />
              {order.address.city}, {getProvinceName(order.address.province)}
              {"  "}
              {order.address.postalCode}
              <br />
              {order.address.country}
            </p>
          </div>

          {/* Totals */}
          <div className="px-6 py-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatCAD(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className={order.shipping === 0 ? "text-green-600 font-medium" : ""}>
                  {order.shipping === 0 ? "Free" : formatCAD(order.shipping)}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>{formatCAD(order.tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-2 mt-2">
                <span>Total</span>
                <span>{formatCAD(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/products"
          className="inline-flex items-center justify-center px-8 py-3.5 bg-[#C41E3A] text-white font-semibold rounded-full hover:bg-[#A01830] transition-colors text-sm"
        >
          Continue Shopping
        </Link>
        <a
          href="mailto:support@fifa2026.ca"
          className="inline-flex items-center justify-center px-8 py-3.5 border border-gray-200 text-gray-600 font-semibold rounded-full hover:border-gray-400 transition-colors text-sm"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-[#C41E3A] rounded-full animate-spin mx-auto mb-6" />
          <p className="text-gray-500 text-sm">Loading…</p>
        </div>
      }
    >
      <OrderConfirmationInner />
    </Suspense>
  );
}
