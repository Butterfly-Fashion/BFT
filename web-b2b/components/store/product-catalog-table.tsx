"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Lock, ChevronRight } from "lucide-react";
import { formatMoney } from "@/lib/money";
import type { PricedProduct, Profile } from "@/lib/types";
import { useCart } from "@/components/store/cart-provider";
import { ProductImage } from "@/components/store/product-image";

type Props = {
  products: PricedProduct[];
  profile: Profile | null;
  compact?: boolean;
};

export function ProductCatalogTable({ products, profile, compact }: Props) {
  const cart = useCart();
  const router = useRouter();
  const isApproved = profile?.is_b2b_approved ?? false;

  const cartMap = useMemo(
    () => new Map(cart.items.map((i) => [i.productId, i.quantity])),
    [cart.items]
  );

  const cartTotal = useMemo(
    () => cart.items.reduce((s, i) => s + (i.price || 0) * i.quantity, 0),
    [cart.items]
  );

  function setQty(product: PricedProduct, value: string) {
    if (!isApproved) { router.push("/login?next=/products"); return; }
    const qty = Math.max(0, Math.min(9999, parseInt(value || "0") || 0));
    cart.setItem(
      { productId: product.id, quantity: qty, name: product.name, sku: product.sku, price: product.display_price, imageUrl: product.image_url, slug: product.slug, caseQty: product.case_qty },
      qty
    );
  }

  function addCase(product: PricedProduct) {
    const current = cartMap.get(product.id) || 0;
    setQty(product, String(current + (product.case_qty || 1)));
  }

  if (!products.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white py-14 text-center">
        <p className="font-semibold text-gray-500">No products match your filters.</p>
      </div>
    );
  }

  const displayList = compact ? products.slice(0, 8) : products;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* Cart summary bar */}
      {cart.items.length > 0 && (
        <div className="flex items-center justify-between border-b px-4 py-2.5" style={{ background: "var(--primary-light)", borderColor: "var(--primary-border)" }}>
          <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--primary)" }}>
            <ShoppingCart size={13} />
            {cart.count} items in cart · {formatMoney(cartTotal)}
          </span>
          <Link
            href="/cart"
            className="rounded-lg border px-3 py-1.5 text-sm font-semibold"
            style={{ borderColor: "var(--primary-border)", color: "var(--primary)" }}
          >
            Review & submit
          </Link>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="catalog-table">
          <thead>
            <tr>
              <th style={{ width: 320 }}>Product</th>
              <th style={{ width: 120 }} className="hidden md:table-cell">Item Code</th>
              <th style={{ width: 120 }} className="hidden lg:table-cell">Category</th>
              <th style={{ width: 100 }}>MOQ</th>
              <th style={{ width: 110 }}>Price / ea</th>
              {isApproved && <th style={{ width: 90 }}>Qty</th>}
              {isApproved && <th style={{ width: 80 }}></th>}
            </tr>
          </thead>
          <tbody>
            {displayList.map((product) => {
              const qty = cartMap.get(product.id) || 0;
              const selected = qty > 0;
              return (
                <tr key={product.id} className={selected ? "row-selected" : ""}>
                  {/* Product name + image */}
                  <td>
                    <div className="flex items-center gap-3">
                      <ProductImage
                        src={product.image_url}
                        alt={product.name}
                        className="product-thumb"
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/products/${product.slug}`}
                          className="block truncate font-semibold text-gray-900 hover:underline"
                          style={{ maxWidth: 200 }}
                          title={product.name}
                        >
                          {product.name}
                        </Link>
                        <span className="flex items-center gap-1.5">
                          {product.availability_status === "Manual Confirm" && (
                            <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white" style={{ background: "#7C3AED" }}>
                              Pre-order
                            </span>
                          )}
                          {product.country && (
                            <span className="text-xs text-gray-500">{product.country}</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* SKU */}
                  <td className="hidden md:table-cell">
                    <span className="font-mono text-xs text-gray-500">{product.sku}</span>
                  </td>

                  {/* Category */}
                  <td className="hidden lg:table-cell text-sm text-gray-600">{product.category}</td>

                  {/* MOQ */}
                  <td className="whitespace-nowrap text-sm text-gray-600">
                    {product.case_qty ? (
                      <span>{product.case_qty} <span className="text-gray-500">units</span></span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>

                  {/* Price */}
                  <td>
                    {isApproved ? (
                      <div>
                        <span className="font-bold text-gray-900">{formatMoney(product.display_price)}</span>
                        {product.has_customer_price && (
                          <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: "var(--primary)" }}>
                            My price
                          </span>
                        )}
                        {product.display_case_price && product.case_qty && (
                          <p className="mt-0.5 text-xs text-gray-500">
                            {formatMoney(product.display_case_price)}/case
                          </p>
                        )}
                      </div>
                    ) : profile ? (
                      <span className="flex items-center gap-1 text-sm text-amber-700">
                        <Lock size={12} />
                        Pending approval
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <Lock size={12} />
                        <Link href="/login" className="hover:underline">Login</Link>
                      </span>
                    )}
                  </td>

                  {/* Qty input */}
                  {isApproved && (
                    <td>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={qty || ""}
                        placeholder="0"
                        onChange={(e) => setQty(product, e.target.value)}
                        className="quantity-input w-20 rounded-md border px-2 py-1.5 text-center text-sm font-semibold outline-none transition-colors"
                        style={
                          qty > 0
                            ? { borderColor: "var(--primary)", background: "var(--primary-light)", color: "var(--primary)" }
                            : { borderColor: "var(--line)", background: "white" }
                        }
                      />
                    </td>
                  )}

                  {/* +1 case button */}
                  {isApproved && (
                    <td>
                      <button
                        onClick={() => addCase(product)}
                        className="rounded-md border px-2.5 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:text-gray-900"
                        style={{ borderColor: "var(--line)" }}
                        title={product.case_qty ? `Add 1 case (${product.case_qty})` : "Add 1"}
                      >
                        +1 case
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {compact && products.length > 8 && (
        <div className="border-t border-gray-100 px-4 py-3">
          <Link
            href="/products"
            className="flex items-center gap-1.5 text-sm font-semibold"
            style={{ color: "var(--primary)" }}
          >
            View full catalog ({products.length} products)
            <ChevronRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
