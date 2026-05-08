"use client";

import Link from "next/link";
import { X, Trash2 } from "lucide-react";
import { useCart } from "@/components/store/cart-provider";
import { ProductImage } from "@/components/store/product-image";
import { formatCAD, calculateShipping, FREE_SHIPPING_THRESHOLD } from "@/lib/money";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: Props) {
  const { items, removeItem, updateQuantity, subtotal } = useCart();
  const shipping = calculateShipping(subtotal);
  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 shadow-xl flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Your Cart</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-gray-500 text-sm">Your cart is empty</p>
            <Link
              href="/products"
              onClick={onClose}
              className="px-6 py-2.5 bg-[#C41E3A] text-white text-sm font-semibold rounded-full hover:bg-[#A01830] transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            {/* Free shipping bar */}
            {freeShippingRemaining > 0 && (
              <div className="px-5 py-3 bg-[#C41E3A]/5 border-b border-[#C41E3A]/10 text-xs text-gray-600">
                Add <strong className="text-[#C41E3A]">{formatCAD(freeShippingRemaining)}</strong> more for free shipping
              </div>
            )}
            {freeShippingRemaining === 0 && (
              <div className="px-5 py-3 bg-green-50 border-b border-green-100 text-xs text-green-700 font-medium">
                ✓ You qualify for free shipping!
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {items.map((item) => {
                const key = `${item.id}::${item.size ?? ""}`;
                return (
                  <div key={key} className="flex gap-3">
                    <div
                      className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden"
                      style={{ background: item.placeholderGradient }}
                    >
                      <ProductImage
                        src={item.imageUrl}
                        alt={item.name}
                        placeholderGradient={item.placeholderGradient}
                        sizes="64px"
                        className="object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{item.name}</p>
                      {item.size && <p className="text-xs text-gray-400 mt-0.5">Size: {item.size}</p>}
                      <p className="text-sm font-bold text-gray-900 mt-1">{formatCAD(item.price)}</p>
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
                          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-sm"
                        >
                          −
                        </button>
                        <span className="w-7 text-center text-xs font-semibold text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 space-y-3">
              <div className="flex justify-between text-sm font-bold text-gray-900">
                <span>Subtotal</span>
                <span>{formatCAD(subtotal + shipping)}</span>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/cart"
                  onClick={onClose}
                  className="flex-1 py-2.5 border-2 border-gray-900 text-gray-900 font-semibold rounded-full text-center text-sm hover:bg-gray-900 hover:text-white transition-colors"
                >
                  View Cart
                </Link>
                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-[#C41E3A] text-white font-semibold rounded-full text-center text-sm hover:bg-[#A01830] transition-colors"
                >
                  Checkout
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
