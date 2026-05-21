import { ProductCard } from "@/components/store/product-card";
import { ProductSortSelect } from "@/components/store/product-sort-select";
import { getAllProducts } from "@/lib/products";
import { CATEGORIES } from "@/lib/types";
import Link from "next/link";
import type { Metadata } from "next";

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

export default async function ProductsPage({ searchParams }: Props) {
  const { category, search = "", sort = "default" } = await searchParams;
  const normalizedSearch = search.trim().toLowerCase();

  const allProducts = await getAllProducts();
  const categoryFiltered = category
    ? allProducts.filter((p) => p.category === category)
    : allProducts;
  const searched = normalizedSearch
    ? categoryFiltered.filter((p) => p.name.toLowerCase().includes(normalizedSearch))
    : categoryFiltered;
  const filtered = [...searched];

  if (sort === "price-asc") {
    filtered.sort((a, b) => a.price - b.price);
  }
  if (sort === "price-desc") {
    filtered.sort((a, b) => b.price - a.price);
  }
  if (sort === "name") {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

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
          const count = allProducts.filter((p) => p.category === cat).length;
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

      <div className="mb-6 flex items-center justify-end">
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
