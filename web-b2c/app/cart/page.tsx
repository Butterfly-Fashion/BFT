"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useCart } from "@/components/store/cart-provider";
import { ProductImage } from "@/components/store/product-image";
import { calculateShipping, formatCAD, FREE_SHIPPING_THRESHOLD } from "@/lib/money";

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCart();
  const shipping = calculateShipping(subtotal);
  const estimatedTotal = subtotal + shipping;
  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center">
        <div className="text-5xl mb-6">Cart</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h1>
        <p className="text-gray-500 text-sm mb-8">
          Looks like you haven&apos;t added anything yet.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center justify-center px-8 py-3.5 bg-[#C41E3A] text-white font-semibold rounded-full hover:bg-[#A01830] transition-colors text-sm"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 pb-20 md:pb-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Your Cart</h1>

        {freeShippingRemaining > 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl px-4 pt-3 pb-4 mb-8">
            <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#C41E3A] transition-all"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
            <p className="mt-3 text-sm font-medium text-gray-700">
              Add{" "}
              <span className="font-bold text-[#C41E3A]">
                {formatCAD(freeShippingRemaining)}
              </span>{" "}
              more for free shipping
            </p>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-8 text-sm text-green-700 font-medium">
            You qualify for free shipping!
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const key = `${item.id}::${item.size ?? ""}`;

              return (
                <div
                  key={key}
                  className="flex gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                >
                  <div
                    className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-lg overflow-hidden"
                    style={{ background: item.placeholderGradient }}
                  >
                    <ProductImage
                      src={item.imageUrl}
                      alt={item.name}
                      placeholderGradient={item.placeholderGradient}
                      sizes="96px"
                      className="object-contain"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 leading-snug mb-0.5 line-clamp-2">
                      {item.name}
                    </h3>
                    {item.size && (
                      <p className="text-xs text-gray-400 mb-2">Size: {item.size}</p>
                    )}
                    <p className="text-base font-black text-gray-900">
                      {formatCAD(item.price)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => removeItem(item.id, item.size)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="inline-flex items-center border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                        className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-sm font-semibold"
                        aria-label={`Decrease quantity for ${item.name}`}
                      >
                        -
                      </button>
                      <span className="w-10 text-center text-sm font-semibold text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                        className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-sm font-semibold"
                        aria-label={`Increase quantity for ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-base font-bold text-gray-900 mb-5">Order Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">{formatCAD(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span
                    className={
                      shipping === 0
                        ? "text-green-600 font-semibold"
                        : "font-medium text-gray-900"
                    }
                  >
                    {shipping === 0 ? "Free" : formatCAD(shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500 text-xs">
                  <span>Taxes</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>

              <div className="border-t border-gray-100 mt-5 pt-4 flex justify-between text-gray-900">
                <span className="font-bold text-lg">Estimated Total</span>
                <span className="font-black text-xl text-[#C41E3A]">
                  {formatCAD(estimatedTotal)}
                </span>
              </div>

              <Link
                href="/checkout"
                className="mt-5 block w-full py-3.5 bg-[#C41E3A] text-white font-semibold rounded-full text-center hover:bg-[#A01830] transition-colors text-sm shadow-sm"
              >
                Checkout - {formatCAD(estimatedTotal)}
              </Link>

              <p className="mt-2 text-center text-[11px] text-gray-400">
                No account needed - guest checkout available
              </p>

              <Link
                href="/products"
                className="mt-3 block w-full py-3 text-gray-600 font-medium text-center hover:text-gray-900 transition-colors text-sm"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        <div className="text-sm">
          <span className="font-bold text-gray-900">{formatCAD(estimatedTotal)}</span>
          <span className="text-gray-400 text-xs ml-1">
            {shipping === 0 ? "- Free shipping" : `- +${formatCAD(shipping)} shipping`}
          </span>
        </div>
        <Link
          href="/checkout"
          className="shrink-0 px-6 py-2.5 bg-[#C41E3A] text-white font-semibold rounded-full text-sm hover:bg-[#A01830] transition-colors"
        >
          Checkout
        </Link>
      </div>
    </>
  );
}
