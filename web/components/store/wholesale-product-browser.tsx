"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Package } from "lucide-react";
import { formatMoney } from "@/lib/money";
import type { PricedProduct, Profile } from "@/lib/types";
import { useCart } from "@/components/store/cart-provider";
import { ProductImage } from "@/components/store/product-image";

type WholesaleProductBrowserProps = {
  products: PricedProduct[];
  profile: Profile | null;
};

export function WholesaleProductBrowser({ products, profile }: WholesaleProductBrowserProps) {
  const cart = useCart();
  const router = useRouter();

  const padMap = useMemo(
    () => new Map(cart.orderPadItems.map((i) => [i.productId, i.quantity])),
    [cart.orderPadItems]
  );

  const selectedTotal = useMemo(
    () => cart.orderPadItems.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0),
    [cart.orderPadItems]
  );

  const cartTotal = useMemo(
    () => cart.items.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0),
    [cart.items]
  );

  function setProductQuantity(product: PricedProduct, value: string) {
    const quantity = Math.max(0, Math.min(9999, Number.parseInt(value || "0", 10) || 0));
    cart.setOrderQty(
      {
        productId: product.id,
        quantity,
        name: product.name,
        sku: product.sku,
        price: product.display_price,
        imageUrl: product.image_url,
        slug: product.slug,
      },
      quantity
    );
  }

  function addSelectedToCart() {
    if (!profile) {
      router.push("/login?next=/products");
      return;
    }
    cart.addOrderPadToCart();
  }

  if (!products.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <Package size={32} className="mx-auto mb-3 text-slate-300" />
        <p className="font-bold text-slate-500">No products match your filters.</p>
        <p className="mt-1 text-sm text-slate-400">Try adjusting your search or category.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      {/* Product grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {products.map((product) => {
          const qty = padMap.get(product.id) || 0;
          const hasQty = qty > 0;
          return (
            <article
              className={`product-card flex flex-col overflow-hidden rounded-lg border bg-white ${
                hasQty ? "border-(--primary) ring-1 ring-(--primary)/20" : "border-slate-200"
              }`}
              key={product.id}
            >
              {/* ── Image ── */}
              <Link
                className="relative block shrink-0 overflow-hidden border-b border-slate-100 bg-white"
                href={`/products/${product.slug}`}
                style={{ aspectRatio: "1 / 1" }}
              >
                <ProductImage
                  className="product-card-img absolute inset-0 h-full w-full object-contain p-4 transition-transform duration-300"
                  src={product.image_url}
                  alt={product.name}
                />
              </Link>

              {/* ── Info ── */}
              <div className="flex flex-1 flex-col gap-2 p-3">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{product.category}</span>
                </div>
                <Link
                  className="line-clamp-2 min-h-10 text-sm font-bold leading-snug text-slate-900 transition-colors hover:text-(--accent)"
                  href={`/products/${product.slug}`}
                >
                  {product.name}
                </Link>
                <div className="mt-auto">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {product.has_customer_price ? "Your B2B price" : "Starting from"}
                  </p>
                  <strong className="text-lg font-black">{formatMoney(product.display_price)}</strong>
                </div>
              </div>

              <div className="border-t border-slate-100 p-3">
                <label className="label">
                  Order Qty
                  <input
                    aria-label={`Quantity for ${product.name}`}
                    className={`field quantity-input text-center font-bold transition-colors ${
                      hasQty ? "border-(--primary) bg-slate-50" : ""
                    }`}
                    inputMode="numeric"
                    min={0}
                    type="number"
                    value={qty || ""}
                    onChange={(e) => setProductQuantity(product, e.target.value)}
                  />
                </label>
              </div>
            </article>
          );
        })}
      </div>

      {/* Aside cart panel */}
      <aside className="xl:sticky xl:top-32 xl:h-fit">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <h2 className="flex items-center gap-2 text-base font-black">
              <ShoppingCart size={16} />
              Request Cart
            </h2>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              Items persist while you browse categories.
            </p>
          </div>

          <div className="max-h-[60vh] overflow-auto">
            {/* Order-pad selected items (not yet in persistent cart) */}
            {cart.orderPadItems.length > 0 && (
              <div>
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-amber-200 bg-amber-50 px-4 py-2">
                  <p className="text-[10px] font-black uppercase tracking-wide text-amber-800">
                    Order pad · {cart.orderPadCount} units
                  </p>
                  <p className="text-xs font-black text-amber-900">{formatMoney(selectedTotal)}</p>
                </div>
                {cart.orderPadItems.map((item) => (
                  <div
                    key={item.productId}
                    className="grid grid-cols-[40px_1fr_52px] items-center gap-2.5 border-b border-amber-100 bg-amber-50/60 px-3 py-2 last:border-b-0"
                  >
                    <ProductImage
                      className="aspect-square rounded border border-amber-200 object-cover"
                      src={item.imageUrl}
                      alt={item.name || "Product"}
                    />
                    <div className="min-w-0">
                      {item.slug ? (
                        <Link
                          className="line-clamp-2 text-xs font-bold leading-snug text-slate-800 hover:underline"
                          href={`/products/${item.slug}`}
                        >
                          {item.name}
                        </Link>
                      ) : (
                        <p className="line-clamp-2 text-xs font-bold leading-snug text-slate-800">{item.name || item.productId}</p>
                      )}
                      <p className="text-[10px] font-semibold text-amber-700">
                        {item.price ? formatMoney(item.price) : "Price TBD"} × {item.quantity}
                        {item.price ? ` = ${formatMoney(item.price * item.quantity)}` : ""}
                      </p>
                    </div>
                    <input
                      aria-label={`Qty for ${item.name || item.productId}`}
                      className="field quantity-input h-8 min-h-8 px-1 text-center text-xs font-bold"
                      inputMode="numeric"
                      min={0}
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        cart.setOrderQty(item, Math.max(0, Number.parseInt(e.target.value || "0", 10) || 0))
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Persistent cart items (already added) */}
            {cart.items.length > 0 && (
              <div>
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-100 px-4 py-2">
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-600">
                    In cart · {cart.count} units
                  </p>
                  <p className="text-xs font-black text-slate-800">{formatMoney(cartTotal)}</p>
                </div>
                {cart.items.map((item) => (
                  <div
                    className="grid grid-cols-[40px_1fr_52px] items-center gap-2.5 border-b border-slate-100 px-3 py-2 last:border-b-0"
                    key={item.productId}
                  >
                    <ProductImage
                      className="aspect-square rounded border border-slate-200 object-cover"
                      src={item.imageUrl}
                      alt={item.name || "Product"}
                    />
                    <div className="min-w-0">
                      {item.slug ? (
                        <Link
                          className="line-clamp-2 text-xs font-bold leading-snug hover:underline"
                          href={`/products/${item.slug}`}
                        >
                          {item.name}
                        </Link>
                      ) : (
                        <p className="line-clamp-2 text-xs font-bold leading-snug">{item.name || item.productId}</p>
                      )}
                      <p className="text-[10px] font-semibold text-slate-500">
                        {item.price ? formatMoney(item.price) : "Price TBD"}
                        {item.sku && <> · {item.sku}</>}
                      </p>
                    </div>
                    <input
                      aria-label={`Cart qty for ${item.name || item.productId}`}
                      className="field quantity-input h-8 min-h-8 px-1 text-center text-xs font-bold"
                      inputMode="numeric"
                      min={0}
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        cart.setQuantity(item.productId, Math.max(0, Number.parseInt(e.target.value || "0", 10) || 0))
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!cart.orderPadItems.length && !cart.items.length && (
              <div className="p-6 text-center">
                <ShoppingCart size={28} className="mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-bold text-slate-500">Your request cart is empty</p>
                <p className="mt-1 text-xs text-slate-400">Enter quantities next to products to build your order</p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 p-4">
            <div className="mb-3 grid gap-1">
              <div className="flex justify-between text-sm font-semibold text-slate-600">
                <span>Cart units</span>
                <span className="font-bold text-slate-900">{cart.count}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-slate-600">
                <span>Est. subtotal</span>
                <span className="font-black text-slate-900">{formatMoney(cartTotal)}</span>
              </div>
            </div>

            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold leading-relaxed text-amber-800">
              No payment collected now — final pricing confirmed after review.
            </div>

            <button
              className="btn-primary w-full"
              type="button"
              disabled={!cart.orderPadItems.length}
              onClick={addSelectedToCart}
            >
              <ShoppingCart size={14} />
              Add {cart.orderPadCount > 0 ? `${cart.orderPadCount} items` : "selected"} to cart
            </button>
            <Link className="btn-secondary mt-2 w-full" href="/cart">
              Open request cart
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
