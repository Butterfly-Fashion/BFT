"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, CheckCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { availabilityStyle } from "@/lib/availability";
import { formatMoney } from "@/lib/money";
import type { PricedProduct, Profile } from "@/lib/types";
import { useCart } from "@/components/store/cart-provider";
import { ProductImage } from "@/components/store/product-image";

export function ProductCard({ product, profile }: { product: PricedProduct; profile: Profile | null }) {
  const cart = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (addedTimer.current) clearTimeout(addedTimer.current); }, []);

  function addToCart() {
    if (!profile) {
      router.push("/login?next=/products");
      return;
    }
    cart.addItem({
      productId: product.id,
      quantity: Math.max(1, qty),
      name: product.name,
      sku: product.sku,
      price: product.display_price,
      imageUrl: product.image_url,
      slug: product.slug,
    });
    setAdded(true);
    addedTimer.current = setTimeout(() => setAdded(false), 1800);
  }

  return (
    <article className="product-card flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
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
        <span className={`badge absolute left-2.5 top-2.5 shadow-sm ${availabilityStyle(product.availability_status)}`}>
          {product.availability_status}
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

        {/* Price */}
        <div className="mt-auto pt-1">
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
          className={`btn-primary w-full text-xs text-white transition-all ${added ? "opacity-80" : ""}`}
          type="button"
          onClick={addToCart}
        >
          {added ? (
            <><CheckCircle size={13} />Added to Cart</>
          ) : (
            <><ShoppingCart size={13} />Add to Cart</>
          )}
        </button>
      </div>
    </article>
  );
}
