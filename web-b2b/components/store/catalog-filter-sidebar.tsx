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

  const activeCategory = params.get("category") || "";
  const hasFilters = !!activeCategory;

  // The active top-level category: either selected directly, or the parent of a selected subcategory.
  const activeParent =
    tree.find((c) => c.name === activeCategory) ||
    tree.find((c) => c.children.some((child) => child.name === activeCategory));
  const activeSubcategory = activeParent && activeParent.name !== activeCategory ? activeCategory : "";

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
          <label className="mb-2 block">
            <span className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-400">
              <span>Category</span>
              {!activeCategory && <span className="normal-case text-gray-400">({productCount})</span>}
            </span>
            <select
              className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-700 outline-none"
              value={activeParent?.name || ""}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All categories</option>
              {tree.map((parent) => (
                <option key={parent.id} value={parent.name}>{parent.name}</option>
              ))}
            </select>
          </label>

          {/* Subcategory — only meaningful once a parent with children is selected */}
          <label className="mb-1 block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">Subcategory</span>
            <select
              className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-700 outline-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
              value={activeSubcategory}
              onChange={(e) => setCategory(e.target.value || activeParent?.name || "")}
              disabled={!activeParent || activeParent.children.length === 0}
            >
              <option value="">{activeParent ? "All in category" : "—"}</option>
              {(activeParent?.children || []).map((child) => (
                <option key={child.id} value={child.name}>{child.name}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </aside>
  );
}
