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

const STOCK_DOT: Record<string, string> = {
  Available:        "#16A34A",
  Limited:          "#D97706",
  "Manual Confirm": "#2563EB",
  Hidden:           "#9CA3AF",
};

function StockCell({ status, qty }: { status: string; qty?: number | null }) {
  const color = STOCK_DOT[status] ?? "#9CA3AF";
  const label =
    status === "Available" ? "In stock"
    : status === "Limited" ? "Limited"
    : status === "Manual Confirm" ? "Available"
    : "—";
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      <span className="stock-dot" style={{ background: color }} />
      <span className="text-sm" style={{ color: status === "Available" ? "#166534" : status === "Limited" ? "#D97706" : "#9CA3AF" }}>
        {qty != null ? `${qty} left` : label}
      </span>
    </span>
  );
}

export function ProductCatalogTable({ products, profile, compact }: Props) {
  const cart = useCart();
  const router = useRouter();
  const isApproved = profile?.is_b2b_approved ?? false;

  const padMap = useMemo(
    () => new Map(cart.orderPadItems.map((i) => [i.productId, i.quantity])),
    [cart.orderPadItems]
  );

  const selectedTotal = useMemo(
    () => cart.orderPadItems.reduce((s, i) => s + (i.price || 0) * i.quantity, 0),
    [cart.orderPadItems]
  );

  function setQty(product: PricedProduct, value: string) {
    if (!isApproved) { router.push("/login?next=/products"); return; }
    const qty = Math.max(0, Math.min(9999, parseInt(value || "0") || 0));
    cart.setOrderQty(
      { productId: product.id, quantity: qty, name: product.name, sku: product.sku, price: product.display_price, imageUrl: product.image_url, slug: product.slug },
      qty
    );
  }

  function addCase(product: PricedProduct) {
    const current = padMap.get(product.id) || 0;
    setQty(product, String(current + (product.case_qty || 1)));
  }

  if (!products.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white py-14 text-center">
        <p className="font-semibold text-gray-400">No products match your filters.</p>
      </div>
    );
  }

  const displayList = compact ? products.slice(0, 8) : products;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* Cart summary bar */}
      {cart.orderPadItems.length > 0 && (
        <div className="flex items-center justify-between border-b px-4 py-2.5" style={{ background: "var(--primary-light)", borderColor: "var(--primary-border)" }}>
          <span className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
            {cart.orderPadCount} items selected · {formatMoney(selectedTotal)}
          </span>
          <div className="flex gap-2">
            <button
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-white"
              style={{ background: "var(--primary)" }}
              onClick={() => cart.addOrderPadToCart()}
            >
              <ShoppingCart size={13} />
              Add to cart
            </button>
            <Link
              href="/cart"
              className="rounded-lg border px-3 py-1.5 text-sm font-semibold"
              style={{ borderColor: "var(--primary-border)", color: "var(--primary)" }}
            >
              View cart
            </Link>
          </div>
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
              <th style={{ width: 110 }} className="hidden sm:table-cell">Stock</th>
              {isApproved && <th style={{ width: 90 }}>Qty</th>}
              {isApproved && <th style={{ width: 80 }}></th>}
            </tr>
          </thead>
          <tbody>
            {displayList.map((product) => {
              const qty = padMap.get(product.id) || 0;
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
                        {product.country && (
                          <span className="text-xs text-gray-400">{product.country}</span>
                        )}
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
                      <span>{product.case_qty} <span className="text-gray-400">units</span></span>
                    ) : (
                      <span className="text-gray-400">—</span>
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
                          <p className="mt-0.5 text-xs text-gray-400">
                            {formatMoney(product.display_case_price)}/case
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="flex items-center gap-1 text-sm text-gray-400">
                        <Lock size={12} />
                        <Link href="/login" className="hover:underline">Login</Link>
                      </span>
                    )}
                  </td>

                  {/* Stock */}
                  <td className="hidden sm:table-cell">
                    <StockCell status={product.availability_status} qty={product.stock_qty} />
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
