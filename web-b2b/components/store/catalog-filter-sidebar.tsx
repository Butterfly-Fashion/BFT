"use client";

import { useRouter, useSearchParams } from "next/navigation";

const CATEGORIES = ["Car Flags", "Caps", "Bucket Hats", "Boxing Gloves", "Accessories", "Sticker Packs", "Scarves", "Figures"];

export function CatalogFilterSidebar({ productCount }: { productCount: number }) {
  const router = useRouter();
  const params = useSearchParams();

  function set(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("q"); // keep search only if explicitly typed
    router.push(`/products?${next.toString()}`);
  }

  function setStock(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("stock", value);
    else next.delete("stock");
    router.push(`/products?${next.toString()}`);
  }

  const activeCategory = params.get("category") || "";
  const activeStock = params.get("stock") || "";
  const hasFilters = activeCategory || activeStock;

  return (
    <aside className="w-full lg:w-52 shrink-0">
      <div className="rounded-xl border border-gray-200 bg-white p-4 lg:sticky lg:top-20">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-700">Filters</h3>
          {hasFilters && (
            <button
              onClick={() => router.push("/products")}
              className="text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Category */}
        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Category</p>
          <div className="space-y-1">
            <button
              onClick={() => set("category", "")}
              className={`w-full rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
                !activeCategory
                  ? "font-semibold text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              style={!activeCategory ? { background: "var(--primary)" } : {}}
            >
              All categories
              <span className="ml-1.5 text-xs opacity-60">({productCount})</span>
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => set("category", cat)}
                className={`w-full rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
                  activeCategory === cat
                    ? "font-semibold text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
                style={activeCategory === cat ? { background: "var(--primary)" } : {}}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Stock */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Availability</p>
          <div className="space-y-1">
            {[
              { label: "All", value: "" },
              { label: "In stock", value: "instock" },
              { label: "In stock + limited", value: "limited" },
            ].map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setStock(value)}
                className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                  activeStock === value
                    ? "font-semibold"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
                style={activeStock === value ? { color: "var(--primary)" } : {}}
              >
                {value === "instock" && (
                  <span className="stock-dot" style={{ background: "#16A34A" }} />
                )}
                {value === "limited" && (
                  <span className="stock-dot" style={{ background: "#D97706" }} />
                )}
                {!value && <span className="h-[7px] w-[7px] shrink-0" />}
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
