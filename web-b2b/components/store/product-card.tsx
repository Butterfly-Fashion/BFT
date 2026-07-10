"use client";

import Link from "next/link";
import { ShoppingCart, CheckCircle, Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { stockBadge, isOutOfStock } from "@/lib/availability";
import { formatMoney } from "@/lib/money";
import type { PricedProduct, Profile } from "@/lib/types";
import { useCart } from "@/components/store/cart-provider";
import { ProductImage } from "@/components/store/product-image";

export function ProductCard({ product, profile }: { product: PricedProduct; profile: Profile | null }) {
  const cart = useCart();
  const isApproved = profile?.is_b2b_approved ?? false;
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const outOfStock = isOutOfStock(product);
  const badge = stockBadge(product);

  useEffect(() => () => { if (addedTimer.current) clearTimeout(addedTimer.current); }, []);

  function addToCart() {
    if (outOfStock) return;
    // Guests can build a cart too — pricing stays hidden until they sign in,
    // and login is only required when submitting the order request.
    cart.addItem({
      productId: product.id,
      quantity: Math.max(1, qty),
      name: product.name,
      sku: product.sku,
      price: isApproved ? product.display_price : undefined,
      imageUrl: product.image_url,
      slug: product.slug,
    });
    setAdded(true);
    addedTimer.current = setTimeout(() => setAdded(false), 1800);
  }

  return (
    <article className="product-card flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
      {/* ── Image ── */}
      <Link
        className="relative block shrink-0 overflow-hidden border-b border-slate-100 bg-white"
        href={`/products/${product.slug}`}
        style={{ aspectRatio: "1 / 1" }}
      >
        <ProductImage
          className="product-card-img absolute inset-0 h-full w-full object-contain p-5 transition-transform duration-300"
          src={product.image_url}
          alt={product.name}
        />
        <span className={`badge absolute left-2.5 top-2.5 shadow-sm ${badge.className}`}>
          {badge.label}
        </span>
        {product.has_customer_price && (
          <span className="badge absolute right-2.5 top-2.5 border-amber-200 bg-amber-50 text-amber-800 shadow-sm">
            B2B Price
          </span>
        )}
      </Link>

      {/* ── Info ── */}
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        {/* Category only — SKU removed */}
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{product.category}</span>

        {/* Name */}
        <Link
          className="line-clamp-2 min-h-10 text-sm font-bold leading-snug text-slate-900 transition-colors hover:text-(--primary)"
          href={`/products/${product.slug}`}
        >
          {product.name}
        </Link>

        {/* Price — wholesale pricing is register-gated, same as the catalog */}
        <div className="mt-auto pt-1">
          {isApproved ? (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {product.has_customer_price ? "Your B2B price" : "Unit price / ea"}
              </p>
              <strong className="text-xl font-black text-slate-900">{formatMoney(product.display_price)}</strong>
              {product.display_case_price && product.case_qty && (
                <div className="mt-1.5 rounded border border-slate-100 bg-slate-50 px-2.5 py-1.5">
                  <p className="text-[10px] font-semibold text-slate-400">Case price ({product.case_qty} units)</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-black text-slate-700">{formatMoney(product.display_case_price)}</span>
                    <span className="text-[10px] text-slate-400">{formatMoney(product.display_case_price / product.case_qty)}/ea</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Link
              href={profile ? "/products" : "/register"}
              className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-800"
            >
              <Lock size={11} />
              {profile ? "Pricing pending" : "Register free for wholesale price"}
            </Link>
          )}
        </div>

        {/* Qty input */}
        <div>
          <label className="label">
            Order Qty
            <input
              className="field quantity-input text-center"
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </label>
          <p className="mt-1 text-[10px] text-slate-500">Enter number of units (e.g. 50, 100, 500)</p>
        </div>

        {/* Button */}
        <button
          className={`btn-primary w-full text-xs text-white transition-all ${added ? "opacity-80" : ""} ${outOfStock ? "cursor-not-allowed opacity-50" : ""}`}
          type="button"
          disabled={outOfStock}
          onClick={addToCart}
        >
          {outOfStock ? (
            "Sold Out"
          ) : added ? (
            <><CheckCircle size={13} />Added to Cart</>
          ) : (
            <><ShoppingCart size={13} />Add to Cart</>
          )}
        </button>
      </div>
    </article>
  );
}
