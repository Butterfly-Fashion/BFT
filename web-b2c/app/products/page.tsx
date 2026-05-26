import { ProductCard } from "@/components/store/product-card";
import { ProductSortSelect } from "@/components/store/product-sort-select";
import { ProductSearchInput } from "@/components/store/product-search-input";
import { getAllProducts } from "@/lib/products";
import { CATEGORIES } from "@/lib/types";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";

const baseMetadata: Metadata = {
  title: "Shop All Products",
  description:
    "Browse the full World Fan Gear collection — boxing gloves, caps, bucket hats, and car flags for Canadian fans.",
  alternates: {
    canonical: "/products",
  },
};

interface Props {
  searchParams: Promise<{ category?: string; search?: string; sort?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { category, search, sort } = await searchParams;
  const hasFilters = Boolean(category || search || (sort && sort !== "default"));

  return {
    ...baseMetadata,
    title: category ? `${category} Fan Gear` : baseMetadata.title,
    description:
      "Browse the full World Fan Gear collection: boxing gloves, caps, bucket hats, car flags, and sticker packs for Canadian fans.",
    robots: hasFilters ? { index: false, follow: true } : undefined,
  };
}

// Build a map from parent category name → list of child category names
async function buildChildMap(): Promise<Map<string, string[]>> {
  try {
    const supabase = supabaseAdmin();
    const { data } = await supabase.from("categories").select("id, name, parent_id");
    const cats = data ?? [];
    const map = new Map<string, string[]>();
    for (const cat of cats) {
      if (!cat.parent_id) {
        const children = cats.filter((c) => c.parent_id === cat.id).map((c) => c.name);
        map.set(cat.name, children.length > 0 ? children : [cat.name]);
      }
    }
    return map;
  } catch {
    return new Map();
  }
}

export default async function ProductsPage({ searchParams }: Props) {
  const { category, search = "", sort = "default" } = await searchParams;
  const normalizedSearch = search.trim().toLowerCase();

  const [allProducts, childMap] = await Promise.all([getAllProducts(), buildChildMap()]);

  // If the selected category is a parent, expand to all its children
  const effectiveCategories = category ? (childMap.get(category) ?? [category]) : undefined;

  const categoryFiltered = effectiveCategories
    ? allProducts.filter((p) => effectiveCategories.includes(p.category))
    : allProducts;

  const searched = normalizedSearch
    ? categoryFiltered.filter((p) => p.name.toLowerCase().includes(normalizedSearch))
    : categoryFiltered;
  const filtered = [...searched];

  if (sort === "price-asc") filtered.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") filtered.sort((a, b) => b.price - a.price);
  if (sort === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      {/* Page header */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          {search ? `Results for "${search}"` : category ?? "All Products"}
        </h1>
        <p className="text-gray-500 text-sm">
          {filtered.length} {filtered.length === 1 ? "product" : "products"}
        </p>
      </div>

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-2 mb-10">
        <Link
          href="/products"
          className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors duration-150 ${
            !category
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
          }`}
        >
          All ({allProducts.length})
        </Link>
        {CATEGORIES.map((cat) => {
          const effective = childMap.get(cat) ?? [cat];
          const count = allProducts.filter((p) => effective.includes(p.category)).length;
          return (
            <Link
              key={cat}
              href={`/products?category=${encodeURIComponent(cat)}`}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors duration-150 ${
                category === cat
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {cat} ({count})
            </Link>
          );
        })}
      </div>

      {/* Sub-category pills */}
      {(() => {
        const subCats: string[] = [];
        for (const [, children] of childMap) {
          if (children.length > 1) subCats.push(...children);
        }
        const visible = subCats.filter((n) => allProducts.some((p) => p.category === n));
        if (visible.length === 0) return null;
        return (
          <div className="flex flex-wrap gap-2 mb-8 -mt-6">
            {visible.map((name) => {
              const count = allProducts.filter((p) => p.category === name).length;
              return (
                <Link
                  key={name}
                  href={`/products?category=${encodeURIComponent(name)}`}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors duration-150 ${
                    category === name
                      ? "bg-gray-700 text-white border-gray-700"
                      : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700"
                  }`}
                >
                  {name} ({count})
                </Link>
              );
            })}
          </div>
        );
      })()}

      {/* Search + Sort row */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Suspense>
          <ProductSearchInput defaultValue={search} />
        </Suspense>
        <ProductSortSelect value={sort} />
      </div>

      {/* Product grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center">
          <p className="text-gray-400 text-sm">
            {search ? `No products found for "${search}".` : "No products found in this category."}
          </p>
          <Link
            href={category ? `/products?category=${encodeURIComponent(category)}` : "/products"}
            className="mt-4 inline-block text-sm font-semibold text-gray-700 hover:text-gray-900 underline"
          >
            {search ? "Clear search" : "View all products"}
          </Link>
        </div>
      )}
    </div>
  );
}
