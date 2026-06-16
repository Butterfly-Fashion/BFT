"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import type { Category, CategoryTree } from "@/lib/category-utils";
import { buildCategoryTree } from "@/lib/category-utils";

const FALLBACK: CategoryTree[] = [
  { id: "1", name: "Winter Gloves", slug: "winter-gloves", sort_order: 1, is_active: true, parent_id: null, children: [] },
  { id: "2", name: "Winter Hats", slug: "winter-hats", sort_order: 2, is_active: true, parent_id: null, children: [] },
  { id: "3", name: "Winter Masks", slug: "winter-masks", sort_order: 3, is_active: true, parent_id: null, children: [] },
  { id: "4", name: "Fidget Toy", slug: "fidget-toy", sort_order: 4, is_active: true, parent_id: null, children: [] },
  { id: "5", name: "Rolling Papers", slug: "rolling-papers", sort_order: 5, is_active: true, parent_id: null, children: [] },
];

export function CatalogFilterSidebar({ productCount, categories }: { productCount: number; categories?: Category[] }) {
  const tree = categories?.length ? buildCategoryTree(categories) : FALLBACK;
  const router = useRouter();
  const params = useSearchParams();

  const [open, setOpen] = useState(false);

  function setCategory(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("category", value);
    else next.delete("category");
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

  function catBtn(name: string, indent = false) {
    const active = activeCategory === name;
    return (
      <button
        key={name}
        onClick={() => setCategory(name)}
        className={`w-full rounded-md text-left text-sm transition-colors ${
          indent ? "py-1 pl-5 pr-2.5" : "px-2.5 py-1.5"
        } ${active ? "font-semibold text-white" : "text-gray-600 hover:bg-gray-50"}`}
        style={active ? { background: "var(--primary)" } : {}}
      >
        {name}
      </button>
    );
  }

  return (
    <aside className="w-full shrink-0 lg:w-52">
      <div className="rounded-xl border border-gray-200 bg-white p-4 lg:sticky lg:top-20">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 lg:pointer-events-none"
            aria-expanded={open}
          >
            <SlidersHorizontal size={14} className="text-gray-500" />
            <h3 className="text-sm font-bold text-gray-700">Filters</h3>
            {hasFilters && (
              <span className="rounded-full px-1.5 py-0.5 text-[11px] font-bold text-white" style={{ background: "var(--primary)" }}>
                on
              </span>
            )}
            <ChevronDown size={15} className={`text-gray-400 transition-transform lg:hidden ${open ? "rotate-180" : ""}`} />
          </button>
          {hasFilters && (
            <button
              onClick={() => router.push("/products")}
              className="text-xs font-semibold text-gray-500 transition-colors hover:text-gray-800"
            >
              Clear all
            </button>
          )}
        </div>

        <div className={`${open ? "mt-4 block" : "hidden"} lg:mt-4 lg:block`}>
        {/* Category */}
        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Category</p>
          <div className="space-y-0.5">
            {/* All */}
            <button
              onClick={() => setCategory("")}
              className={`w-full rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
                !activeCategory ? "font-semibold text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
              style={!activeCategory ? { background: "var(--primary)" } : {}}
            >
              All categories
              <span className="ml-1.5 text-xs opacity-60">({productCount})</span>
            </button>

            {tree.map((parent) =>
              parent.children.length === 0 ? (
                catBtn(parent.name)
              ) : (
                <div key={parent.id}>
                  {/* Parent as clickable group header */}
                  <button
                    onClick={() => setCategory(parent.name)}
                    className={`w-full rounded-md px-2.5 py-1.5 text-left text-sm font-bold transition-colors ${
                      activeCategory === parent.name ? "text-white" : "text-gray-700 hover:bg-gray-50"
                    }`}
                    style={activeCategory === parent.name ? { background: "var(--primary)" } : {}}
                  >
                    {parent.name}
                  </button>
                  {/* Children indented */}
                  <div className="mb-1 ml-2 space-y-0.5 border-l-2 border-gray-100 pl-2">
                    {parent.children.map((child) => catBtn(child.name, true))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Availability */}
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
                  activeStock === value ? "font-semibold" : "text-gray-600 hover:bg-gray-50"
                }`}
                style={activeStock === value ? { color: "var(--primary)" } : {}}
              >
                {value === "instock" && <span className="stock-dot" style={{ background: "#16A34A" }} />}
                {value === "limited" && <span className="stock-dot" style={{ background: "#D97706" }} />}
                {!value && <span className="h-[7px] w-[7px] shrink-0" />}
                {label}
              </button>
            ))}
          </div>
        </div>
        </div>
      </div>
    </aside>
  );
}
