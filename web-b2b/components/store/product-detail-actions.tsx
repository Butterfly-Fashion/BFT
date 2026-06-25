"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, CheckCircle } from "lucide-react";
import { formatMoney } from "@/lib/money";
import type { PricedProduct, Profile } from "@/lib/types";
import { useCart } from "@/components/store/cart-provider";
import { OrderContactCta } from "@/components/store/order-contact-cta";

export function ProductDetailActions({
  product,
  profile,
}: {
  product: PricedProduct;
  profile: Profile | null;
}) {
  const cart = useCart();
  const router = useRouter();
  const isApproved = profile?.is_b2b_approved ?? false;
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const caseQty = product.case_qty || null;

  useEffect(() => () => { if (addedTimer.current) clearTimeout(addedTimer.current); }, []);

  function clamp(v: number) { return Math.max(0, Math.min(9999, v)); }
  function addUnits(n: number) { setQuantity((q) => clamp(q + n)); }
  function addCases(n: number) { if (!caseQty) return; setQuantity((q) => clamp(q + n * caseQty)); }
  function cases() { return caseQty ? Math.floor(quantity / caseQty) : null; }

  function addToCart() {
    if (!profile) { router.push(`/login?next=/products/${product.slug}`); return; }
    if (quantity <= 0) return;
    cart.addItem({
      productId: product.id,
      quantity,
      name: product.name,
      sku: product.sku,
      price: product.display_price,
      imageUrl: product.image_url,
      slug: product.slug,
      caseQty: product.case_qty,
    });
    setAdded(true);
    addedTimer.current = setTimeout(() => setAdded(false), 2000);
  }

  const total = product.display_price * quantity;

  // Wholesale pricing and online ordering are shown to signed-in accounts.
  // Anonymous visitors can still order by phone or email, or register to order online.
  if (!isApproved) {
    return (
      <div className="grid gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Order this item</p>
        <OrderContactCta showMessages={!!profile} />
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold leading-relaxed text-slate-600">
          Call or email to order, or register and sign in to see wholesale pricing and order online.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5">

      {/* Quantity section */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-4">

        {/* Unit input */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Units</p>
            <p className="text-xs font-semibold text-slate-400">
              {quantity} ea · <span className="font-black text-slate-800">{formatMoney(total)}</span>
            </p>
          </div>
          <div className="flex h-10 overflow-hidden rounded-lg border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => addUnits(-1)}
              className="flex w-10 items-center justify-center border-r border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors font-bold text-lg"
            >−</button>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={9999}
              value={quantity || ""}
              placeholder="0"
              onChange={(e) => setQuantity(clamp(parseInt(e.target.value || "0") || 0))}
              className="quantity-input flex-1 bg-transparent text-center text-sm font-bold text-slate-900 outline-none"
            />
            <button
              type="button"
              onClick={() => addUnits(1)}
              className="flex w-10 items-center justify-center border-l border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors font-bold text-lg"
            >+</button>
          </div>
        </div>

        {/* Case shortcuts (only if MOQ/case_qty exists) */}
        {caseQty && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                By case <span className="ml-1 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-black text-slate-600">{caseQty} ea / case</span>
              </p>
              {cases()! > 0 && (
                <p className="text-xs font-semibold text-slate-400">
                  {cases()} case{cases()! > 1 ? "s" : ""} = {cases()! * caseQty} ea
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => addCases(-1)}
                disabled={quantity < caseQty}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-600 transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                − 1 case
                <span className="text-xs font-normal text-slate-400">({caseQty})</span>
              </button>
              <button
                type="button"
                onClick={() => addCases(1)}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-600 transition-colors hover:border-green-400 hover:text-green-700"
              >
                + 1 case
                <span className="text-xs font-normal text-slate-400">({caseQty})</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CTA button */}
      <button
        className={`btn-primary w-full gap-2 py-3 text-sm ${added ? "opacity-80" : ""}`}
        type="button"
        disabled={quantity <= 0}
        onClick={addToCart}
      >
        {added ? (
          <><CheckCircle size={16} />Added to Cart</>
        ) : (
          <><ShoppingCart size={16} />Add to Cart</>
        )}
      </button>

      {/* B2B note */}
      <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold leading-relaxed text-slate-600">
        No payment collected now — we confirm availability and final pricing within 1 business day, then send a payment link.
      </p>
    </div>
  );
}
