"use client";

import { useRouter, usePathname } from "next/navigation";
import { useRef, useState } from "react";
import type { CategoryTree } from "@/lib/categories";

type FilterValues = { q: string; category: string; visibility: string; channel: string };

export function AdminProductsFilter({
  tree,
  initial,
}: {
  tree: CategoryTree[];
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

  // The active top-level category: either selected directly, or the parent of a selected subcategory.
  const activeParent =
    tree.find((c) => c.name === values.category) ||
    tree.find((c) => c.children.some((child) => child.name === values.category));
  const activeSubcategory = activeParent && activeParent.name !== values.category ? values.category : "";

  function handleParentSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = { ...values, category: e.target.value };
    setValues(next);
    pushURL(next);
  }

  function handleSubcategorySelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = { ...values, category: e.target.value || activeParent?.name || "" };
    setValues(next);
    pushURL(next);
  }

  return (
    <div className="mb-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="grid gap-3 p-4 lg:grid-cols-[1fr_170px_170px_150px_150px]">
        <label className="label">
          Search products
          <input
            className="field"
            value={values.q}
            placeholder="Product name, Item Code, or category"
            onChange={handleText}
          />
        </label>
        <label className="label">
          Category
          <select className="field" value={activeParent?.name || ""} onChange={handleParentSelect}>
            <option value="">All categories</option>
            {tree.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="label">
          Subcategory
          <select
            className="field"
            value={activeSubcategory}
            onChange={handleSubcategorySelect}
            disabled={!activeParent || activeParent.children.length === 0}
          >
            <option value="">{activeParent ? "All in category" : "—"}</option>
            {(activeParent?.children || []).map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
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
