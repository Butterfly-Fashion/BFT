"use client";

import { useRouter, usePathname } from "next/navigation";
import { useRef, useState } from "react";

type FilterValues = { q: string; category: string; visibility: string; channel: string };

export function AdminProductsFilter({
  categories,
  initial,
}: {
  categories: string[];
  initial: FilterValues;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [values, setValues] = useState<FilterValues>(initial);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function pushURL(next: FilterValues) {
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    if (next.category) params.set("category", next.category);
    if (next.visibility) params.set("visibility", next.visibility);
    if (next.channel) params.set("channel", next.channel);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleText(e: React.ChangeEvent<HTMLInputElement>) {
    const next = { ...values, q: e.target.value };
    setValues(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushURL(next), 350);
  }

  function handleSelect(key: keyof FilterValues) {
    return (e: React.ChangeEvent<HTMLSelectElement>) => {
      const next = { ...values, [key]: e.target.value };
      setValues(next);
      pushURL(next);
    };
  }

  return (
    <div className="mb-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="grid gap-3 p-4 lg:grid-cols-[1fr_190px_170px_170px]">
        <label className="label">
          Search products
          <input
            className="field"
            value={values.q}
            placeholder="Product name, SKU, or category"
            onChange={handleText}
          />
        </label>
        <label className="label">
          Category
          <select className="field" value={values.category} onChange={handleSelect("category")}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="label">
          Visibility
          <select className="field" value={values.visibility} onChange={handleSelect("visibility")}>
            <option value="">All</option>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
          </select>
        </label>
        <label className="label">
          Channel
          <select className="field" value={values.channel} onChange={handleSelect("channel")}>
            <option value="">All channels</option>
            <option value="b2c">B2C Store</option>
            <option value="b2b">B2B Wholesale</option>
          </select>
        </label>
      </div>
    </div>
  );
}
