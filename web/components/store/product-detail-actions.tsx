"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, FileText, CheckCircle, Minus, Plus } from "lucide-react";
import { formatMoney } from "@/lib/money";
import type { PricedProduct, Profile } from "@/lib/types";
import { useCart } from "@/components/store/cart-provider";

export function ProductDetailActions({
  product,
  profile,
}: {
  product: PricedProduct;
  profile: Profile | null;
}) {
  const cart = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (addedTimer.current) clearTimeout(addedTimer.current); }, []);

  function decrement() { setQuantity((q) => Math.max(1, q - 1)); }
  function increment() { setQuantity((q) => Math.min(9999, q + 1)); }

  function addToCart() {
    if (!profile) {
      router.push(`/login?next=/products/${product.slug}`);
      return;
    }
    cart.addItem({
      productId: product.id,
      quantity,
      name: product.name,
      sku: product.sku,
      price: product.display_price,
      imageUrl: product.image_url,
      slug: product.slug,
    });
    setAdded(true);
    addedTimer.current = setTimeout(() => setAdded(false), 2000);
  }

  function requestQuote() {
    if (!profile) router.push("/login?next=/account/quotes");
    else router.push(`/account/quotes?product=${product.id}`);
  }

  return (
    <div className="grid gap-4">
      {/* Quantity selector */}
      <div>
        <p className="label mb-2">Quantity</p>
        <div className="flex items-center gap-0">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-l-md border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-50 active:bg-slate-100"
            type="button"
            onClick={decrement}
            aria-label="Decrease quantity"
          >
            <Minus size={14} />
          </button>
          <input
            aria-label="Quantity"
            className="quantity-input h-10 w-16 border-y border-slate-300 bg-white text-center text-sm font-bold text-slate-900 outline-none focus:border-slate-900"
            inputMode="numeric"
            min={1}
            max={9999}
            type="number"
            value={quantity}
            onChange={(e) =>
              setQuantity(Math.max(1, Math.min(9999, Number.parseInt(e.target.value || "1", 10) || 1)))
            }
          />
          <button
            className="flex h-10 w-10 items-center justify-center rounded-r-md border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-50 active:bg-slate-100"
            type="button"
            onClick={increment}
            aria-label="Increase quantity"
          >
            <Plus size={14} />
          </button>
          <span className="ml-3 text-sm font-semibold text-slate-500">
            = {formatMoney(product.display_price * quantity)}
          </span>
        </div>
      </div>

      {/* CTA buttons */}
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          className={`btn-primary gap-2 py-3 text-sm ${added ? "bg-emerald-600 border-emerald-600" : ""}`}
          type="button"
          onClick={addToCart}
        >
          {added ? (
            <><CheckCircle size={16} />Added to Cart</>
          ) : (
            <><ShoppingCart size={16} />Add to Cart</>
          )}
        </button>
        <button className="btn-secondary gap-2 py-3 text-sm" type="button" onClick={requestQuote}>
          <FileText size={16} />
          Request Quote
        </button>
      </div>

      {/* B2B note */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs font-semibold leading-relaxed text-slate-600">
        No payment collected now — we review your order, confirm availability and final pricing, then send a payment link.
      </div>
    </div>
  );
}
