"use client";

import Link from "next/link";
import { X, ShoppingCart, Package, Trash2, ArrowRight } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { useCart } from "@/components/store/cart-provider";
import { ProductImage } from "@/components/store/product-image";

type Props = {
  open: boolean;
  onClose: () => void;
  defaultAddress?: string;
};

export function CartDrawer({ open, onClose }: Props) {
  const cart = useCart();

  const subtotal = cart.items.reduce((s, i) => s + (i.price || 0) * i.quantity, 0);
  const totalUnits = cart.items.reduce((s, i) => s + i.quantity, 0);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-black text-slate-900">
            <ShoppingCart size={16} style={{ color: "var(--primary)" }} />
            Cart
            {totalUnits > 0 && (
              <span className="rounded-full px-2 py-0.5 text-xs font-black text-white" style={{ background: "var(--primary)" }}>
                {totalUnits}
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package size={32} className="mb-3 text-slate-200" />
              <p className="font-bold text-slate-400">Your cart is empty</p>
              <p className="mt-1 text-sm text-slate-400">Add products from the catalog</p>
              <button
                onClick={onClose}
                className="mt-5 rounded-full px-5 py-2 text-sm font-bold text-white"
                style={{ background: "var(--primary)" }}
              >
                Browse products
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"
                >
                  {/* Image */}
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <ProductImage
                      src={item.imageUrl}
                      alt={item.name || ""}
                      className="h-full w-full object-contain p-1"
                    />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">{item.name}</p>
                    {item.sku && <p className="text-xs font-mono text-slate-400">{item.sku}</p>}
                    <p className="mt-0.5 text-xs font-semibold text-slate-500">
                      {item.price ? formatMoney(item.price) : "TBD"} / ea
                    </p>
                  </div>

                  {/* Qty + remove */}
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={9999}
                        value={item.quantity}
                        onChange={(e) => {
                          const v = parseInt(e.target.value || "0") || 0;
                          cart.setQuantity(item.productId, Math.max(0, Math.min(9999, v)));
                        }}
                        className="quantity-input h-7 w-14 rounded border border-slate-200 bg-white text-center text-sm font-bold text-slate-900 outline-none focus:border-slate-400"
                      />
                      <button
                        onClick={() => cart.setQuantity(item.productId, 0)}
                        className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 text-slate-400 hover:border-red-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Remove"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                    <p className="text-xs font-black text-slate-800">
                      {item.price ? formatMoney(item.price * item.quantity) : "TBD"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.items.length > 0 && (
          <div className="border-t border-slate-200 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-600">{totalUnits} units · Est. subtotal</span>
              <span className="text-base font-black text-slate-900">{formatMoney(subtotal)}</span>
            </div>
            <p className="text-[11px] font-semibold text-amber-700 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
              No payment now — we review and send a Pay Now link after approval.
            </p>
            <Link
              href="/cart"
              onClick={onClose}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-colors"
              style={{ background: "var(--primary)" }}
            >
              Review &amp; request
              <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
