"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { Download } from "lucide-react";
import { formatMoney } from "@/lib/money";
import type { Product } from "@/lib/types";

function escape(v: unknown): string {
  const s = v == null ? "" : String(v);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function downloadCsv(products: Product[]) {
  const headers = ["SKU", "Name", "Category", "Unit Price", "Case Price", "Case Qty", "Availability", "Visibility", "Sales Channels", "Weight (kg)", "Description"];
  const lines = [
    headers.join(","),
    ...products.map((p) =>
      [
        p.sku, p.name, p.category,
        p.unit_price, p.case_price ?? "", p.case_qty ?? "",
        p.availability_status,
        p.is_hidden ? "Hidden" : "Visible",
        (p.sales_channels || []).join("|"),
        p.weight_kg ?? "", p.description ?? "",
      ].map(escape).join(",")
    ),
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "products-export.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminProductsTable({ products }: { products: Product[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allSelected = products.length > 0 && selected.size === products.length;
  const someSelected = selected.size > 0;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(products.map((p) => p.id)));
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const selectedProducts = useMemo(
    () => products.filter((p) => selected.has(p.id)),
    [products, selected]
  );

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {/* Selection action bar */}
      {someSelected && (
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-2.5">
          <span className="text-sm font-semibold text-slate-700">
            {selected.size} / {products.length} selected
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => downloadCsv(selectedProducts)}
              className="btn-secondary flex items-center gap-1.5 min-h-8 px-3 text-xs"
            >
              <Download size={13} />
              Export {selected.size} products
            </button>
          </div>
        </div>
      )}

      <div className="overflow-auto">
        <table className="w-full min-w-[48rem] table-fixed text-sm">
          <colgroup>
            <col className="w-12" />
            <col className="w-80" />
            <col className="w-32" />
            <col className="w-28" />
            <col className="w-36" />
            <col className="w-28" />
            <col className="w-24" />
          </colgroup>
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-green-700"
                />
              </th>
              <th className="px-5 py-3">Product</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Unit price</th>
              <th className="px-5 py-3">Availability</th>
              <th className="px-5 py-3">Visibility</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const isSelected = selected.has(product.id);
              return (
                <tr
                  key={product.id}
                  className={`border-b border-slate-100 last:border-b-0 transition-colors ${isSelected ? "bg-green-50" : "table-row-hover"}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(product.id)}
                      className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-green-700"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-lg border border-slate-200 bg-white object-contain"
                        src={product.image_url || "/images/product-placeholder.svg"}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-black text-slate-900" title={product.name}>{product.name}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500" title={product.description || ""}>
                          {product.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="block max-w-full truncate font-semibold text-slate-700" title={product.category}>
                      {product.category}
                    </span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap font-black">{formatMoney(product.unit_price)}</td>
                  <td className="px-5 py-3">
                    <span className="badge max-w-full justify-center text-center">{product.availability_status}</span>
                  </td>
                  <td className="px-5 py-3">
                    {product.is_hidden ? (
                      <span className="badge justify-center border-slate-300 bg-slate-100 text-slate-600">Hidden</span>
                    ) : (
                      <span className="badge justify-center border-emerald-200 bg-emerald-50 text-emerald-800">Visible</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link className="btn-secondary min-h-8 px-3 text-xs" href={`/admin/products/${product.id}`}>
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!products.length && (
        <div className="p-12 text-center">
          <p className="font-bold text-slate-500">No products match this filter.</p>
        </div>
      )}
    </section>
  );
}
