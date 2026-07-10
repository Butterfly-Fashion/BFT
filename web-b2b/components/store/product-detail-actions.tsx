"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ShoppingCart, CheckCircle, ArrowRight } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { isOutOfStock } from "@/lib/availability";
import type { PricedProduct, Profile } from "@/lib/types";
import { useCart } from "@/components/store/cart-provider";
import { useCartOpen } from "@/components/store/cart-open-context";
import { OrderContactCta } from "@/components/store/order-contact-cta";

export function ProductDetailActions({
  product,
  profile,
}: {
  product: PricedProduct;
  profile: Profile | null;
}) {
  const cart = useCart();
  const { setCartOpen } = useCartOpen();
  const isApproved = profile?.is_b2b_approved ?? false;
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [hasAdded, setHasAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const caseQty = product.case_qty || null;

  useEffect(() => () => { if (addedTimer.current) clearTimeout(addedTimer.current); }, []);

  function clamp(v: number) { return Math.max(0, Math.min(9999, v)); }
  function addUnits(n: number) { setQuantity((q) => clamp(q + n)); }
  function addCases(n: number) { if (!caseQty) return; setQuantity((q) => clamp(q + n * caseQty)); }
  function cases() { return caseQty ? Math.floor(quantity / caseQty) : null; }

  function addToCart() {
    if (quantity <= 0) return;
    // Guests can add to cart — pricing stays hidden and login happens at order submit.
    cart.addItem({
      productId: product.id,
      quantity,
      name: product.name,
      sku: product.sku,
      price: isApproved ? product.display_price : undefined,
      imageUrl: product.image_url,
      slug: product.slug,
      caseQty: product.case_qty,
    });
    setAdded(true);
    setHasAdded(true);
    setCartOpen(true);
    addedTimer.current = setTimeout(() => setAdded(false), 2000);
  }

  const total = product.display_price * quantity;

  // Out of stock — no ordering. Customers can still ask about restock by phone/email.
  if (isOutOfStock(product)) {
    return (
      <div className="grid gap-3">
        <div className="flex items-center justify-center rounded-lg border border-red-200 bg-red-50 py-3 text-sm font-black uppercase tracking-wide text-red-700">
          Out of Stock
        </div>
        <p className="text-xs font-semibold text-slate-500">This item is currently sold out. Contact us to ask about restock or alternatives.</p>
        <OrderContactCta showMessages={!!profile} />
      </div>
    );
  }

  // Signed-in but not approved (declined/edge case) — contact-only ordering.
  // Guests fall through to the quantity UI below: they can build a cart, and
  // pricing/login happen when they sign in or submit the order request.
  if (profile && !isApproved) {
    return (
      <div className="grid gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Order this item</p>
        <OrderContactCta showMessages />
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold leading-relaxed text-slate-600">
          Call or email to order — our team will confirm pricing and availability.
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
              {quantity} ea{isApproved && <> · <span className="font-black text-slate-800">{formatMoney(total)}</span></>}
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

      {/* Post-add CTA — keep a clear path to the cart once something is added */}
      {hasAdded && cart.count > 0 && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            <ShoppingCart size={14} />
            View cart ({cart.count})
          </button>
          <Link
            href="/cart"
            className="flex items-center justify-center gap-1.5 rounded-lg border border-(--primary-border) bg-(--primary-light) py-2.5 text-sm font-black transition-opacity hover:opacity-90"
            style={{ color: "var(--primary)" }}
          >
            Review &amp; request
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* B2B note */}
      {isApproved ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold leading-relaxed text-slate-600">
          No payment collected now — we confirm availability and final pricing within 1 business day, then send a payment link.
        </p>
      ) : (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold leading-relaxed text-slate-600">
          Your cart is saved on this device.{" "}
          <Link href="/register" className="underline" style={{ color: "var(--primary)" }}>Register free</Link>
          {" "}or{" "}
          <Link href={`/login?next=/products/${product.slug}`} className="underline" style={{ color: "var(--primary)" }}>sign in</Link>
          {" "}to see wholesale pricing and submit your order — it takes under 2 minutes.
        </p>
      )}
    </div>
  );
}
