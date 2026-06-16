"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Lock, ShoppingCart, Package, X } from "lucide-react";
import { formatMoney } from "@/lib/money";
import type { PricedProduct, Profile } from "@/lib/types";
import { useCart } from "@/components/store/cart-provider";
import { ProductImage } from "@/components/store/product-image";

type Props = {
  products: PricedProduct[];
  profile: Profile | null;
};

const STOCK_COLOR: Record<string, string> = {
  Available:        "#16A34A",
  Limited:          "#D97706",
  "Manual Confirm": "#7C3AED",
  Hidden:           "#9CA3AF",
};

const STOCK_LABEL: Record<string, string> = {
  Available:        "In stock",
  Limited:          "Limited",
  "Manual Confirm": "Pre-order",
  Hidden:           "—",
};

// ── Cart side panel (xl screens) ─────────────────────────────────────────────

function CartPanel({ isApproved }: { isApproved: boolean }) {
  const cart = useCart();
  const cartItems = cart.items;
  const cartTotal = cartItems.reduce((s, i) => s + (i.price || 0) * i.quantity, 0);

  if (!isApproved) return null;

  return (
    <aside className="hidden xl:block xl:w-72 shrink-0 sticky top-24 self-start">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="flex items-center gap-2 text-sm font-black text-gray-900">
            <ShoppingCart size={14} style={{ color: "var(--primary)" }} />
            Order cart
          </h2>
          <p className="mt-0.5 text-xs text-gray-400">Updates as you type quantities</p>
        </div>

        <div className="max-h-[55vh] overflow-y-auto">
          {cartItems.length > 0 ? (
            <div>
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-1.5">
                <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">
                  In cart · {cart.count} units
                </p>
                <p className="text-xs font-black text-gray-700">{formatMoney(cartTotal)}</p>
              </div>
              {cartItems.map((item) => (
                <div key={item.productId} className="grid grid-cols-[28px_1fr_auto] items-center gap-2 border-b border-gray-100 px-3 py-2 last:border-b-0">
                  <ProductImage
                    src={item.imageUrl}
                    alt={item.name || ""}
                    className="aspect-square rounded-md border border-gray-100 object-contain"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-bold text-gray-700">{item.name}</p>
                    <p className="text-[10px] font-semibold text-gray-400">
                      {item.price ? formatMoney(item.price) : "TBD"} × {item.quantity}
                    </p>
                  </div>
                  <button
                    onClick={() => cart.setQuantity(item.productId, 0)}
                    className="text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
              <Package size={20} className="mx-auto mb-2 text-gray-200" />
              <p className="text-xs font-semibold text-gray-400">Enter qty on a product to add</p>
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="border-t border-gray-100 p-3">
            <Link
              href="/cart"
              className="block w-full rounded-lg py-2 text-center text-sm font-bold text-white transition-colors"
              style={{ background: "var(--primary)" }}
            >
              Review & submit cart →
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}

// ── Mobile / tablet sticky bottom bar ────────────────────────────────────────

function CartBottomBar({ isApproved }: { isApproved: boolean }) {
  const cart = useCart();
  const cartTotal = cart.items.reduce((s, i) => s + (i.price || 0) * i.quantity, 0);
  const cartCount = cart.count;

  if (!isApproved || cartCount === 0) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 xl:hidden border-t border-gray-200 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
      <div className="container-shell flex items-center gap-3 py-2.5">
        <div className="flex-1 min-w-0 text-sm">
          <span className="font-semibold text-gray-600">{cartCount} in cart · {formatMoney(cartTotal)}</span>
        </div>
        <Link
          href="/cart"
          className="shrink-0 rounded-full px-4 py-2 text-xs font-bold text-white"
          style={{ background: "var(--primary)" }}
        >
          Review &amp; submit
        </Link>
      </div>
    </div>
  );
}

// ── Main gallery grid ─────────────────────────────────────────────────────────

export function ProductGalleryGrid({ products, profile }: Props) {
  const cart = useCart();
  const router = useRouter();
  const isApproved = profile?.is_b2b_approved ?? false;

  const cartMap = useMemo(
    () => new Map(cart.items.map((i) => [i.productId, i.quantity])),
    [cart.items]
  );

  function setQty(product: PricedProduct, value: string) {
    if (!isApproved) { router.push("/login?next=/products"); return; }
    const qty = Math.max(0, Math.min(9999, parseInt(value || "0") || 0));
    cart.setItem(
      {
        productId: product.id,
        quantity: qty,
        name: product.name,
        sku: product.sku,
        price: product.display_price,
        imageUrl: product.image_url,
        slug: product.slug,
        caseQty: product.case_qty,
      },
      qty
    );
  }

  function addCase(product: PricedProduct) {
    const current = cartMap.get(product.id) || 0;
    setQty(product, String(current + (product.case_qty || 1)));
  }

  if (!products.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white py-20 text-center">
        <Package size={28} className="mx-auto mb-3 text-gray-300" />
        <p className="font-semibold text-gray-500">No products match your filters.</p>
        <button
          onClick={() => router.push("/products")}
          className="mt-4 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors hover:bg-gray-50"
          style={{ borderColor: "var(--line)", color: "var(--primary)" }}
        >
          Clear filters
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Gallery + side panel */}
      <div className="flex gap-5 items-start">
        {/* Cards */}
        <div className="flex-1 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {products.map((product) => {
            const qty = cartMap.get(product.id) || 0;
            const selected = qty > 0;

            return (
              <div
                key={product.id}
                className={`group flex flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-200 ${
                  selected
                    ? "border-blue-300 shadow-md ring-2 ring-blue-100"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-lg hover:-translate-y-0.5"
                }`}
              >
                {/* Image — links to detail */}
                <Link
                  href={`/products/${product.slug}`}
                  className="relative block overflow-hidden bg-gray-50"
                  style={{ aspectRatio: "1 / 1" }}
                >
                  <ProductImage
                    src={product.image_url}
                    alt={product.name}
                    className="absolute inset-0 h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Category badge */}
                  <span
                    className="absolute left-2.5 top-2.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                    style={{ background: "rgba(22,101,52,0.85)" }}
                  >
                    {product.category}
                  </span>
                  {/* Stock dot */}
                  <span
                    className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full ring-2 ring-white"
                    style={{ background: STOCK_COLOR[product.availability_status] ?? "#9CA3AF" }}
                    title={STOCK_LABEL[product.availability_status] ?? product.availability_status}
                    aria-label={STOCK_LABEL[product.availability_status] ?? product.availability_status}
                  />
                </Link>

                {/* Info */}
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <Link href={`/products/${product.slug}`}>
                    <p className="line-clamp-2 text-sm font-bold leading-snug text-gray-900 hover:text-[#166534] transition-colors">
                      {product.name}
                    </p>
                  </Link>

                  {/* Info grid */}
                  <div className="grid grid-cols-3 gap-x-1 gap-y-1.5 border-t border-gray-100 pt-2">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">MOQ</p>
                      <p className="mt-0.5 text-sm font-semibold text-gray-900">
                        {product.case_qty ? `${product.case_qty}` : <span className="text-gray-400">—</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Price/ea</p>
                      <div className="mt-0.5">
                        {isApproved ? (
                          <p className="text-sm font-black text-gray-900">{formatMoney(product.display_price)}</p>
                        ) : profile ? (
                          <span className="flex items-center gap-1 text-amber-700">
                            <Lock size={11} /><span className="text-[11px] font-semibold">Pending</span>
                          </span>
                        ) : (
                          <Link href="/login" className="-ml-1 inline-flex items-center gap-1 rounded px-1 py-1 text-gray-400 hover:bg-gray-50 hover:underline">
                            <Lock size={11} /><span className="text-[11px] font-semibold">Login</span>
                          </Link>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Stock</p>
                      <p className="mt-0.5 text-sm font-semibold" style={{ color: STOCK_COLOR[product.availability_status] ?? "#9CA3AF" }}>
                        {STOCK_LABEL[product.availability_status] ?? "—"}
                      </p>
                    </div>
                  </div>

                  {/* Qty input (approved only) */}
                  {isApproved && (
                    <div className="mt-auto border-t border-gray-100 pt-3 pb-1">
                      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-500">
                        Qty{product.case_qty ? ` · 1cs = ${product.case_qty}ea` : ""}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <input
                          aria-label={`Quantity for ${product.name}`}
                          type="number"
                          inputMode="numeric"
                          min={0}
                          value={qty || ""}
                          placeholder="0"
                          onChange={(e) => setQty(product, e.target.value)}
                          className="quantity-input h-9 w-14 shrink-0 rounded-lg border px-1 text-center text-sm font-bold outline-none transition-colors"
                          style={
                            selected
                              ? { borderColor: "var(--primary)", background: "var(--primary-light)", color: "var(--primary)" }
                              : { borderColor: "var(--line)", background: "white", color: "#111827" }
                          }
                        />
                        {product.case_qty ? (
                          <>
                            <button
                              onClick={() => setQty(product, String(Math.max(0, qty - product.case_qty!)))}
                              className="h-9 flex-1 rounded-lg border text-xs font-bold text-gray-500 hover:border-red-300 hover:text-red-600 transition-colors"
                              style={{ borderColor: "var(--line)" }}
                              title={`Remove 1 case (${product.case_qty})`}
                            >
                              −1cs
                            </button>
                            <button
                              onClick={() => addCase(product)}
                              className="h-9 flex-1 rounded-lg border text-xs font-bold text-gray-500 hover:border-green-400 hover:text-green-700 transition-colors"
                              style={{ borderColor: "var(--line)" }}
                              title={`Add 1 case (${product.case_qty})`}
                            >
                              +1cs
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setQty(product, String(Math.max(0, qty - 1)))}
                              className="h-9 flex-1 rounded-lg border text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                              style={{ borderColor: "var(--line)" }}
                            >−</button>
                            <button
                              onClick={() => setQty(product, String(qty + 1))}
                              className="h-9 flex-1 rounded-lg border text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                              style={{ borderColor: "var(--line)" }}
                            >+</button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Cart side panel (xl only) */}
        <CartPanel isApproved={isApproved} />
      </div>

      {/* Mobile/tablet bottom bar */}
      <CartBottomBar isApproved={isApproved} />
    </>
  );
}
