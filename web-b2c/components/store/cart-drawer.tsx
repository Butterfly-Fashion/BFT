"use client";

import Link from "next/link";
import { X, Trash2, Minus, Plus } from "lucide-react";
import { useCart } from "@/components/store/cart-provider";
import { ProductImage } from "@/components/store/product-image";
import { formatCAD, calculateShipping, calculateTax, FREE_SHIPPING_THRESHOLD } from "@/lib/money";
import { trackBeginCheckout } from "@/lib/gtag";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: Props) {
  const { items, removeItem, updateQuantity, subtotal } = useCart();
  const shipping = calculateShipping(subtotal);
  const tax = calculateTax(subtotal);
  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-screen w-full max-w-120 bg-white z-50 shadow-2xl flex flex-col overflow-hidden transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900">Your Cart</h2>
            {items.length > 0 && (
              <span className="bg-gray-100 text-gray-600 text-xs font-semibold rounded-full px-2 py-0.5">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free shipping bar */}
        {items.length > 0 && (
          <div className="px-5 py-2 border-b border-gray-100 bg-gray-50">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>{freeShippingRemaining > 0 ? `Add ${formatCAD(freeShippingRemaining)} for free shipping` : "🎉 You've unlocked free shipping!"}</span>
              <span className="font-semibold text-[#C41E3A]">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#C41E3A] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-3xl">🛍️</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">Your cart is empty</p>
              <p className="text-sm text-gray-400">Add some game day gear!</p>
            </div>
            <Link
              href="/products"
              onClick={onClose}
              className="px-8 py-3 bg-[#C41E3A] text-white text-sm font-semibold rounded-full hover:bg-[#A01830] transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-2">
              {items.map((item) => {
                const key = `${item.id}::${item.size ?? ""}`;
                return (
                  <div key={key} className="flex items-start gap-2.5 bg-gray-50 rounded-xl p-2.5">
                    {/* Thumbnail */}
                    <div
                      className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden border border-gray-100"
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

                    {/* Info */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-2">
                        {item.name}
                      </p>
                      {item.size && (
                        <p className="text-[11px] text-gray-400 mt-0.5">Size: {item.size}</p>
                      )}
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-sm font-black text-gray-900">
                          {formatCAD(item.price * item.quantity)}
                        </span>
                        {/* Quantity controls */}
                        <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                            aria-label="Decrease"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                            aria-label="Increase"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeItem(item.id, item.size)}
                      className="shrink-0 p-1 text-gray-300 hover:text-red-500 transition-colors self-start"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 border-t border-gray-100 bg-white space-y-2">
              {/* Subtotal */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Subtotal</span>
                <span className="text-sm font-semibold text-gray-900">{formatCAD(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Shipping</span>
                <span className={`text-sm font-semibold ${shipping === 0 ? "text-green-600" : "text-gray-900"}`}>
                  {shipping === 0 ? "Free 🎉" : formatCAD(shipping)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Tax (HST 13%)</span>
                <span className="text-sm font-semibold text-gray-900">{formatCAD(tax)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-100 pt-2">
                <span className="font-bold text-gray-900">Estimated Total</span>
                <span className="font-black text-lg text-[#C41E3A]">{formatCAD(subtotal + shipping + tax)}</span>
              </div>

              {/* CTAs */}
              <Link
                href="/checkout"
                onClick={() => {
                  onClose();
                  trackBeginCheckout({
                    value: subtotal + shipping + tax,
                    items: items.map((i) => ({
                      id: i.id,
                      name: i.name,
                      price: i.price,
                      quantity: i.quantity,
                      size: i.size,
                    })),
                  });
                }}
                className="block w-full py-3 bg-[#C41E3A] text-white font-bold rounded-full text-center text-sm hover:bg-[#A01830] transition-colors shadow-sm"
              >
                Checkout — {formatCAD(subtotal + shipping + tax)}
              </Link>
              <Link
                href="/cart"
                onClick={onClose}
                className="block w-full py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-full text-center text-sm hover:border-gray-400 transition-colors"
              >
                View Full Cart
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
