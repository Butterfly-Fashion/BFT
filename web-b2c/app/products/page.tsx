import { ProductCard } from "@/components/store/product-card";
import { products } from "@/lib/products";
import { CATEGORIES } from "@/lib/types";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop All Products",
  description:
    "Browse the full World Fan Gear collection — boxing gloves, caps, bucket hats, and car flags for Canadian fans.",
};

interface Props {
  searchParams: Promise<{ category?: string }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const { category } = await searchParams;

  const filtered = category
    ? products.filter((p) => p.category === category)
    : products;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      {/* Page header */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          {category ?? "All Products"}
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
          All ({products.length})
        </Link>
        {CATEGORIES.map((cat) => {
          const count = products.filter((p) => p.category === cat).length;
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

      {/* Product grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center">
          <p className="text-gray-400 text-sm">No products found in this category.</p>
          <Link
            href="/products"
            className="mt-4 inline-block text-sm font-semibold text-gray-700 hover:text-gray-900 underline"
          >
            View all products
          </Link>
        </div>
      )}
    </div>
  );
}
