"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Package, Lock } from "lucide-react";
import { formatMoney } from "@/lib/money";
import type { PricedProduct, Profile } from "@/lib/types";
import { useCart } from "@/components/store/cart-provider";
import { ProductImage } from "@/components/store/product-image";

type WholesaleProductBrowserProps = {
  products: PricedProduct[];
  profile: Profile | null;
};

const STATUS_DOT: Record<string, string> = {
  Available: "bg-emerald-400",
  Limited: "bg-amber-400",
  "Out of Stock": "bg-gray-300",
};

export function WholesaleProductBrowser({ products, profile }: WholesaleProductBrowserProps) {
  const cart = useCart();
  const router = useRouter();
  const isApproved = profile?.is_b2b_approved ?? false;

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
    if (!isApproved) {
      router.push("/register");
      return;
    }
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
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-14 text-center">
        <Package size={28} className="mx-auto mb-3 text-gray-300" />
        <p className="font-bold text-gray-500">No products match your filters.</p>
        <p className="mt-1 text-sm text-gray-400">Try adjusting your search or category.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      {/* Product grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {products.map((product) => {
          const qty = padMap.get(product.id) || 0;
          const hasQty = qty > 0;
          const statusDot = STATUS_DOT[product.availability_status] ?? "bg-gray-300";

          return (
            <article
              className={`product-card flex flex-col overflow-hidden rounded-2xl bg-white transition-all ${
                hasQty
                  ? "ring-2 shadow-lg"
                  : "shadow-sm hover:shadow-md"
              }`}
              style={hasQty ? { "--tw-ring-color": "rgba(49,130,246,0.25)" } as React.CSSProperties : {}}
              key={product.id}
            >
              {/* Image */}
              <Link
                className="relative block shrink-0 overflow-hidden bg-gray-50"
                href={`/products/${product.slug}`}
                style={{ aspectRatio: "1 / 1" }}
              >
                <ProductImage
                  className="product-card-img absolute inset-0 h-full w-full object-contain p-4"
                  src={product.image_url}
                  alt={product.name}
                />
                {/* Status dot */}
                <span className={`absolute top-3 right-3 h-2.5 w-2.5 rounded-full ${statusDot} ring-2 ring-white`} />
              </Link>

              {/* Info */}
              <div className="flex flex-1 flex-col gap-1 p-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {product.category}
                </span>
                <Link
                  className="line-clamp-2 text-sm font-bold leading-snug text-gray-900 transition-colors hover:text-blue-600"
                  href={`/products/${product.slug}`}
                >
                  {product.name}
                </Link>

                <div className="mt-auto pt-2">
                  {isApproved ? (
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <strong className="text-lg font-black text-gray-900">
                          {formatMoney(product.display_price)}
                        </strong>
                        <span className="text-[10px] font-semibold text-gray-400">/ea</span>
                        {product.has_customer_price && (
                          <span
                            className="rounded-full px-1.5 py-0.5 text-[9px] font-black text-white"
                            style={{ background: "var(--primary)" }}
                          >
                            My price
                          </span>
                        )}
                      </div>
                      {product.display_case_price != null && product.case_qty && (
                        <p className="mt-0.5 text-xs font-semibold text-gray-400">
                          Case ({product.case_qty} pcs) {formatMoney(product.display_case_price)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Lock size={11} className="shrink-0" />
                      <span className="text-xs font-semibold">Price visible after approval</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order qty */}
              {isApproved && (
                <div className="border-t border-gray-100 px-3.5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-gray-400">Qty</span>
                    <input
                      aria-label={`Quantity for ${product.name}`}
                      className={`field quantity-input min-h-0 h-8 py-0 text-center text-sm font-bold ${
                        hasQty ? "border-blue-400 bg-blue-50 text-blue-700" : ""
                      }`}
                      inputMode="numeric"
                      min={0}
                      type="number"
                      value={qty || ""}
                      placeholder="0"
                      onChange={(e) => setProductQuantity(product, e.target.value)}
                    />
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Aside cart panel — approved users only */}
      {isApproved && (
        <aside className="xl:sticky xl:top-32 xl:h-fit">
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3.5">
              <h2 className="flex items-center gap-2 text-sm font-black text-gray-900">
                <ShoppingCart size={15} style={{ color: "var(--primary)" }} />
                Request Cart
              </h2>
              <p className="mt-0.5 text-xs text-gray-400">
                Items persist while you browse.
              </p>
            </div>

            <div className="max-h-[60vh] overflow-auto">
              {cart.orderPadItems.length > 0 && (
                <div>
                  <div className="sticky top-0 z-10 flex items-center justify-between border-b border-blue-100 bg-blue-50 px-4 py-2">
                    <p className="text-[10px] font-black uppercase tracking-wide text-blue-600">
                      Order pad · {cart.orderPadCount} units
                    </p>
                    <p className="text-xs font-black text-blue-800">{formatMoney(selectedTotal)}</p>
                  </div>
                  {cart.orderPadItems.map((item) => (
                    <div
                      key={item.productId}
                      className="grid grid-cols-[36px_1fr_48px] items-center gap-2.5 border-b border-blue-50/70 px-3 py-2.5 last:border-b-0"
                    >
                      <ProductImage
                        className="aspect-square rounded-lg border border-blue-100 object-cover"
                        src={item.imageUrl}
                        alt={item.name || "Product"}
                      />
                      <div className="min-w-0">
                        {item.slug ? (
                          <Link className="line-clamp-2 text-xs font-bold leading-snug text-gray-800 hover:underline" href={`/products/${item.slug}`}>
                            {item.name}
                          </Link>
                        ) : (
                          <p className="line-clamp-2 text-xs font-bold leading-snug text-gray-800">{item.name || item.productId}</p>
                        )}
                        <p className="text-[10px] font-semibold text-blue-500">
                          {item.price ? formatMoney(item.price) : "TBD"} × {item.quantity}
                          {item.price ? ` = ${formatMoney(item.price * item.quantity)}` : ""}
                        </p>
                      </div>
                      <input
                        aria-label={`Qty for ${item.name || item.productId}`}
                        className="field quantity-input h-8 min-h-0 px-1 text-center text-xs font-bold"
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

              {cart.items.length > 0 && (
                <div>
                  <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-2">
                    <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">
                      In cart · {cart.count} units
                    </p>
                    <p className="text-xs font-black text-gray-700">{formatMoney(cartTotal)}</p>
                  </div>
                  {cart.items.map((item) => (
                    <div className="grid grid-cols-[36px_1fr_48px] items-center gap-2.5 border-b border-gray-100 px-3 py-2.5 last:border-b-0" key={item.productId}>
                      <ProductImage className="aspect-square rounded-lg border border-gray-100 object-cover" src={item.imageUrl} alt={item.name || "Product"} />
                      <div className="min-w-0">
                        {item.slug ? (
                          <Link className="line-clamp-2 text-xs font-bold leading-snug hover:underline" href={`/products/${item.slug}`}>{item.name}</Link>
                        ) : (
                          <p className="line-clamp-2 text-xs font-bold leading-snug">{item.name || item.productId}</p>
                        )}
                        <p className="text-[10px] font-semibold text-gray-400">
                          {item.price ? formatMoney(item.price) : "TBD"}
                          {item.sku && <> · {item.sku}</>}
                        </p>
                      </div>
                      <input
                        aria-label={`Cart qty for ${item.name || item.productId}`}
                        className="field quantity-input h-8 min-h-0 px-1 text-center text-xs font-bold"
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

              {!cart.orderPadItems.length && !cart.items.length && (
                <div className="p-8 text-center">
                  <ShoppingCart size={24} className="mx-auto mb-3 text-gray-200" />
                  <p className="text-sm font-bold text-gray-400">Request cart is empty</p>
                  <p className="mt-1 text-xs text-gray-300">Enter quantities to build your order</p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 p-4">
              <div className="mb-3 space-y-1">
                <div className="flex justify-between text-xs font-semibold text-gray-500">
                  <span>Cart units</span>
                  <span className="font-bold text-gray-800">{cart.count}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-gray-500">
                  <span>Est. subtotal</span>
                  <span className="font-black text-gray-900">{formatMoney(cartTotal)}</span>
                </div>
              </div>

              <p className="mb-3 rounded-xl bg-gray-50 px-3 py-2 text-[11px] font-medium leading-relaxed text-gray-400">
                Final pricing confirmed by our team before payment.
              </p>

              <button
                className="btn-primary w-full text-sm"
                type="button"
                disabled={!cart.orderPadItems.length}
                onClick={addSelectedToCart}
              >
                <ShoppingCart size={14} />
                {cart.orderPadCount > 0 ? `Add ${cart.orderPadCount} item${cart.orderPadCount !== 1 ? "s" : ""}` : "Add selected"}
              </button>
              <Link className="btn-secondary mt-2 w-full text-sm" href="/cart">
                Open request cart
              </Link>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
