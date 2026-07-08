"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, Trash2, X } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { searchProductsAction } from "@/app/actions";

export type EditorItem = {
  key: string;
  product_id: string | null;
  name: string;
  sku: string | null;
  quantity: number;
  unit_price: number;
  image_url?: string | null;
};

type SearchResult = { id: string; name: string; sku: string; unit_price: number; image_url: string | null };

type Props = {
  initialItems: EditorItem[];
  initialShipping: number | null;
  initialTax: number;
  initialDiscount: number;
  initialTotalOverride: number | null;
  paid: boolean;
};

export function OrderEditor({ initialItems, initialShipping, initialTax, initialDiscount, initialTotalOverride, paid }: Props) {
  const [items, setItems] = useState<EditorItem[]>(initialItems);
  const [discountPct, setDiscountPct] = useState("");
  const [discountAmt, setDiscountAmt] = useState(initialDiscount || 0);
  // Kept as a string so a never-entered shipping fee ("") can be told apart from an
  // explicitly confirmed $0 — the payment-link flow requires the latter before sending.
  const [shipping, setShipping] = useState<string>(initialShipping != null ? String(initialShipping) : "");
  const [tax, setTax] = useState(initialTax || 0);
  const [override, setOverride] = useState<string>(initialTotalOverride != null ? String(initialTotalOverride) : "");

  // Product search
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        const found = await searchProductsAction(term);
        setResults(found);
        setShowResults(true);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  // Close the results dropdown on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) setShowResults(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function addProduct(p: SearchResult) {
    setItems((current) => {
      // If the product is already in the order, bump its quantity instead of duplicating.
      const existing = current.find((i) => i.product_id === p.id);
      if (existing) {
        return current.map((i) => (i.product_id === p.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...current,
        { key: crypto.randomUUID(), product_id: p.id, name: p.name, sku: p.sku || null, quantity: 1, unit_price: p.unit_price, image_url: p.image_url },
      ];
    });
    setQuery("");
    setResults([]);
    setShowResults(false);
  }

  function updateItem(key: string, patch: Partial<EditorItem>) {
    setItems((current) => current.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }

  function removeItem(key: string) {
    setItems((current) => current.filter((i) => i.key !== key));
  }

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0),
    [items]
  );

  const pctNum = Number(discountPct);
  const usingPct = discountPct.trim() !== "" && Number.isFinite(pctNum) && pctNum > 0;
  const effectiveDiscount = usingPct ? Number(((subtotal * pctNum) / 100).toFixed(2)) : Number(discountAmt) || 0;

  const overrideNum = override.trim() === "" ? null : Number(override);
  const usingOverride = overrideNum != null && Number.isFinite(overrideNum) && overrideNum >= 0;
  const computedTotal = subtotal - effectiveDiscount + (Number(shipping) || 0) + (Number(tax) || 0);
  const total = usingOverride ? overrideNum! : computedTotal;

  const itemsJson = JSON.stringify(
    items.map((i) => ({ product_id: i.product_id, name: i.name, sku: i.sku, quantity: i.quantity, unit_price: i.unit_price }))
  );

  return (
    <div className="grid gap-5">
      {/* Hidden fields submitted with the parent form */}
      <input type="hidden" name="items_json" value={itemsJson} />
      <input type="hidden" name="discount_percent" value={usingPct ? String(pctNum) : ""} />
      <input type="hidden" name="discount_amount" value={String(effectiveDiscount)} />
      <input type="hidden" name="shipping_fee" value={shipping} />
      <input type="hidden" name="tax_amount" value={String(Number(tax) || 0)} />
      <input type="hidden" name="total_override" value={usingOverride ? String(overrideNum) : ""} />

      {/* Line items */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Order items</h2>
            <p className="mt-0.5 text-xs text-slate-500">Add, remove, or edit products. Totals recalculate live.</p>
          </div>
        </div>

        {/* Product search */}
        <div className="border-b border-slate-100 px-5 py-3">
          <div ref={searchBoxRef} className="relative max-w-md">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 focus-within:border-(--primary)">
              <Search size={15} className="shrink-0 text-slate-400" />
              <input
                className="w-full text-sm outline-none"
                placeholder="Search products by name or item code…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => results.length && setShowResults(true)}
              />
              {query && (
                <button type="button" onClick={() => { setQuery(""); setResults([]); }} aria-label="Clear search">
                  <X size={14} className="text-slate-400 hover:text-slate-700" />
                </button>
              )}
            </div>
            {showResults && (
              <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                {searching && <p className="px-3 py-2 text-xs text-slate-400">Searching…</p>}
                {!searching && results.length === 0 && (
                  <p className="px-3 py-2 text-xs text-slate-400">No products found.</p>
                )}
                {results.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addProduct(p)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded bg-slate-100">
                      {p.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Plus size={14} className="text-slate-300" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">{p.name}</span>
                      <span className="block truncate font-mono text-xs text-slate-400">{p.sku}</span>
                    </span>
                    <span className="shrink-0 text-sm font-bold text-slate-700">{formatMoney(p.unit_price)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full min-w-160 text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Item Code</th>
                <th className="px-5 py-3">Qty</th>
                <th className="px-5 py-3">Unit price</th>
                <th className="px-5 py-3 text-right">Line total</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.key} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded border border-slate-200 bg-slate-50">
                        {item.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image_url} alt="" className="h-full w-full object-contain" />
                        ) : (
                          <span className="text-[10px] font-bold text-slate-300">N/A</span>
                        )}
                      </span>
                      <span className="font-semibold text-slate-900">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{item.sku}</td>
                  <td className="px-5 py-3">
                    <input
                      className="field w-20 text-center"
                      aria-label={`Quantity for ${item.name}`}
                      value={item.quantity}
                      min={1}
                      type="number"
                      onChange={(e) => updateItem(item.key, { quantity: Math.max(1, Math.floor(Number(e.target.value) || 1)) })}
                    />
                  </td>
                  <td className="px-5 py-3">
                    <input
                      className="field w-28"
                      aria-label={`Unit price for ${item.name}`}
                      value={item.unit_price}
                      step="0.01"
                      min={0}
                      type="number"
                      onChange={(e) => updateItem(item.key, { unit_price: Math.max(0, Number(e.target.value) || 0) })}
                    />
                  </td>
                  <td className="px-5 py-3 text-right font-black">{formatMoney(item.quantity * item.unit_price)}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      aria-label={`Remove ${item.name}`}
                      className="rounded border border-slate-200 p-1.5 text-slate-400 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-sm font-semibold text-slate-400">
                    No items. Search above to add products.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Adjustments + live totals */}
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <section className="card p-5">
          <h2 className="mb-3 text-base font-bold text-slate-900">Pricing</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="label">
              Discount (%)
              <input
                className="field"
                value={discountPct}
                step="0.01"
                min={0}
                max={100}
                type="number"
                placeholder="e.g. 10"
                onChange={(e) => setDiscountPct(e.target.value)}
              />
              <span className="mt-1 text-xs text-slate-400">Percent off the subtotal. Overrides the dollar discount.</span>
            </label>
            <label className="label">
              Discount ($)
              <input
                className="field"
                value={usingPct ? effectiveDiscount : discountAmt}
                step="0.01"
                min={0}
                type="number"
                disabled={usingPct}
                onChange={(e) => setDiscountAmt(Math.max(0, Number(e.target.value) || 0))}
              />
              {usingPct && <span className="mt-1 text-xs text-slate-400">Calculated from {pctNum}% of subtotal.</span>}
            </label>
            <label className="label">
              Shipping ($)
              <input
                className="field"
                value={shipping}
                step="0.01"
                min={0}
                type="number"
                placeholder="Not entered yet"
                onChange={(e) => setShipping(e.target.value)}
              />
              {shipping.trim() === "" && (
                <span className="mt-1 text-xs font-semibold text-amber-600">
                  Required for Shipping orders before the payment link can be sent — enter 0 if shipping is free.
                </span>
              )}
            </label>
            <label className="label">
              HST ($)
              <input className="field" value={tax} step="0.01" min={0} type="number" onChange={(e) => setTax(Math.max(0, Number(e.target.value) || 0))} />
            </label>
            <label className="label sm:col-span-2">
              Final total override ($) — optional
              <input
                className="field"
                value={override}
                step="0.01"
                min={0}
                type="number"
                placeholder="Leave blank to auto-calculate"
                onChange={(e) => setOverride(e.target.value)}
              />
              <span className="mt-1 text-xs text-slate-400">Set a custom negotiated total. When filled, it replaces the calculated total on the order and payment link.</span>
            </label>
          </div>
          {paid && (
            <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              This order is already paid — review changes carefully before saving.
            </p>
          )}
        </section>

        <section className="card p-5">
          <h2 className="mb-3 text-base font-bold text-slate-900">Order total</h2>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatMoney(subtotal)}</span></div>
            <div className="flex justify-between text-slate-600">
              <span>Discount{usingPct ? ` (${pctNum}%)` : ""}</span>
              <span>−{formatMoney(effectiveDiscount)}</span>
            </div>
            <div className="flex justify-between text-slate-600"><span>Shipping</span><span>{formatMoney(Number(shipping) || 0)}</span></div>
            <div className="flex justify-between text-slate-600"><span>HST</span><span>{formatMoney(Number(tax) || 0)}</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-black text-slate-900">
              <span>Total</span>
              <span>{formatMoney(total)}</span>
            </div>
          </div>
          {usingOverride && <p className="mt-3 text-xs text-slate-400">Total is set manually (override). Clear the override field to recalculate from items.</p>}
        </section>
      </div>
    </div>
  );
}
