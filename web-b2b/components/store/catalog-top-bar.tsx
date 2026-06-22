"use client";

import { useRouter } from "next/navigation";
import { Search, ArrowUpDown } from "lucide-react";

type Props = {
  initialQ?: string;
  initialSort?: string;
  category?: string;
  productCount: number;
  title: string;
  isApproved: boolean;
};

export function CatalogTopBar({ initialQ, initialSort, category, productCount, title, isApproved }: Props) {
  const router = useRouter();

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams();
    if (category) p.set("category", category);
    if (initialSort) p.set("sort", initialSort);
    if (initialQ) p.set("q", initialQ);
    Object.entries(overrides).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    return `/products?${p.toString()}`;
  }

  return (
    <div className="mb-4 space-y-3">
      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-2">
        <form
          action="/products"
          className="flex flex-1 min-w-52 gap-2"
        >
          {category && <input type="hidden" name="category" value={category} />}
          {initialSort && <input type="hidden" name="sort" value={initialSort} />}
          <div className="relative flex-1">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="field pl-9"
              name="q"
              defaultValue={initialQ || ""}
              placeholder="Search product, Item Code, country…"
            />
          </div>
          <button className="btn-secondary shrink-0" type="submit">Search</button>
        </form>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer">
            <ArrowUpDown size={13} />
            <select
              className="border-0 bg-transparent text-sm font-semibold text-gray-700 outline-none"
              value={initialSort || "name"}
              onChange={(e) => router.push(buildUrl({ sort: e.target.value }))}
            >
              <option value="name">Name A–Z</option>
              <option value="priceAsc">Price ↑</option>
              <option value="priceDesc">Price ↓</option>
              <option value="newest">Newest</option>
            </select>
          </label>
        </div>
      </div>

      {/* Title row */}
      <div className="flex items-baseline gap-3">
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        <span className="text-sm text-gray-400">
          {productCount} product{productCount !== 1 ? "s" : ""}
          {isApproved && " · B2B pricing"}
        </span>
      </div>
    </div>
  );
}
