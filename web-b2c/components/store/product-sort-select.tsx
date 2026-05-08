"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function ProductSortSelect({ value }: { value: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (sort: string) => {
    const next = new URLSearchParams(searchParams.toString());

    if (sort === "default") {
      next.delete("sort");
    } else {
      next.set("sort", sort);
    }

    const query = next.toString();
    router.push(query ? `/products?${query}` : "/products");
  };

  return (
    <select
      value={value}
      onChange={(event) => handleChange(event.target.value)}
      className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 outline-none focus:border-[#C41E3A] focus:ring-2 focus:ring-[#C41E3A]/15"
      aria-label="Sort products"
    >
      <option value="default">Default</option>
      <option value="price-asc">Price: Low to High</option>
      <option value="price-desc">Price: High to Low</option>
      <option value="name">Name A-Z</option>
    </select>
  );
}
