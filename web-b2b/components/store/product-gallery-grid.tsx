"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { formatMoney } from "@/lib/money";
import type { PricedProduct, Profile } from "@/lib/types";
import { ProductImage } from "@/components/store/product-image";

type Props = {
  products: PricedProduct[];
  profile: Profile | null;
};

const STOCK_COLOR: Record<string, string> = {
  Available:     "#16A34A",
  Limited:       "#D97706",
  "Manual Confirm": "#9CA3AF",
  Hidden:        "#9CA3AF",
};

const STOCK_LABEL: Record<string, string> = {
  Available:     "In stock",
  Limited:       "Limited",
  "Manual Confirm": "On request",
  Hidden:        "—",
};

function StockBadge({ status, qty }: { status: string; qty?: number | null }) {
  const color = STOCK_COLOR[status] ?? "#9CA3AF";
  const label = qty != null ? `${qty} left` : (STOCK_LABEL[status] ?? "—");
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block h-2 w-2 rounded-full flex-shrink-0" style={{ background: color }} />
      <span className="text-xs font-semibold" style={{ color }}>
        {label}
      </span>
    </span>
  );
}

export function ProductGalleryGrid({ products, profile }: Props) {
  const isApproved = profile?.is_b2b_approved ?? false;

  if (!products.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white py-20 text-center">
        <p className="font-semibold text-gray-400">No products match your filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/products/${product.slug}`}
          className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-200 hover:border-gray-300 hover:shadow-lg hover:-translate-y-0.5"
        >
          {/* Image area */}
          <div className="relative overflow-hidden bg-gray-50" style={{ aspectRatio: "1 / 1" }}>
            <ProductImage
              src={product.image_url}
              alt={product.name}
              className="absolute inset-0 h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
            />
            {/* Category badge — top left */}
            <span
              className="absolute left-2.5 top-2.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
              style={{ background: "rgba(22,101,52,0.85)", backdropFilter: "blur(4px)" }}
            >
              {product.category}
            </span>
            {/* Stock dot — top right */}
            <span
              className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full ring-2 ring-white"
              style={{ background: STOCK_COLOR[product.availability_status] ?? "#9CA3AF" }}
            />
          </div>

          {/* Info */}
          <div className="flex flex-1 flex-col gap-2.5 p-3.5">
            <p className="line-clamp-2 text-sm font-bold leading-snug text-gray-900 group-hover:text-[#166534] transition-colors">
              {product.name}
            </p>

            {/* 4-cell info grid */}
            <div className="mt-auto grid grid-cols-3 gap-x-2 gap-y-2 border-t border-gray-100 pt-2.5">
              {/* MOQ */}
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">MOQ</p>
                <p className="mt-0.5 text-xs font-semibold text-gray-700">
                  {product.case_qty ? `${product.case_qty} ea` : <span className="text-gray-400">—</span>}
                </p>
              </div>

              {/* Price / ea */}
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">Price / ea</p>
                <div className="mt-0.5">
                  {isApproved ? (
                    <p className="text-xs font-black text-gray-900">{formatMoney(product.display_price)}</p>
                  ) : (
                    <span className="flex items-center gap-1 text-gray-400">
                      <Lock size={10} />
                      <span className="text-[10px] font-semibold">Login</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Stock */}
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">Stock</p>
                <div className="mt-0.5">
                  <StockBadge status={product.availability_status} qty={product.stock_qty} />
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
