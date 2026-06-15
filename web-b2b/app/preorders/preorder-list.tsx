"use client";

import { useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, Package, Search } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { submitPreorderCommitmentAction } from "@/app/actions";

export interface PreorderItem {
  id: string;
  title: string | null;
  name: string;
  sku: string | null;
  imageUrl: string | null;
  category: string;
  caseQty: number;
  casePrice: number;
  unitPrice: number;
  closesAt: string | null;
  committedQty: number | null;
}

export function PreorderList({ items }: { items: PreorderItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) =>
      [it.name, it.title, it.sku, it.category]
        .filter(Boolean)
        .some((field) => (field as string).toLowerCase().includes(q))
    );
  }, [items, query]);

  // Group filtered items by category, preserving order of appearance.
  const groups = useMemo(() => {
    const map = new Map<string, PreorderItem[]>();
    for (const it of filtered) {
      if (!map.has(it.category)) map.set(it.category, []);
      map.get(it.category)!.push(it);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <>
      {/* Search */}
      <div className="mb-6 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 focus-within:border-slate-400">
        <Search size={16} className="shrink-0 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by product, SKU, or category…"
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          aria-label="Search pre-order campaigns"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="shrink-0 text-xs font-bold text-slate-400 hover:text-slate-600"
          >
            Clear
          </button>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <Package size={28} className="text-slate-300" />
          <p className="font-bold text-slate-500">No matches for &ldquo;{query}&rdquo;.</p>
          <p className="text-sm text-slate-400">Try a different product name, SKU, or category.</p>
        </div>
      )}

      <div className="space-y-8">
        {groups.map(([category, groupItems]) => (
          <section key={category}>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-500">{category}</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-400">
                {groupItems.length}
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              {groupItems.map((item, idx) => {
                const committedCases = item.committedQty ? Math.round(item.committedQty / item.caseQty) : 0;
                const closesAt = item.closesAt ? new Date(item.closesAt) : null;
                const isExpired = closesAt ? closesAt < new Date() : false;
                const hasCommit = item.committedQty != null;

                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-4 px-4 py-4 ${idx !== 0 ? "border-t border-slate-100" : ""} ${hasCommit ? "bg-emerald-50/40" : ""}`}
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                      {item.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-contain p-1"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package size={16} className="text-slate-300" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-900 leading-snug">
                            {item.name || item.title}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[11px] text-slate-400">{item.sku}</span>
                            {closesAt && !isExpired && (
                              <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                                <CalendarClock size={10} />
                                Closes {closesAt.toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                              </span>
                            )}
                            {isExpired && <span className="text-[11px] font-semibold text-red-400">Closed</span>}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-sm font-black text-slate-900">
                            {formatMoney(item.casePrice)}
                            <span className="text-xs font-normal text-slate-400">/case</span>
                          </p>
                          <p className="text-xs text-slate-400">
                            {formatMoney(item.unitPrice)}/pc · {item.caseQty} pcs
                          </p>
                        </div>
                      </div>

                      <div className="mt-3">
                        {hasCommit && (
                          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 size={12} className="text-emerald-500" />
                            Committed: {committedCases} case{committedCases !== 1 ? "s" : ""} ({item.committedQty} pcs)
                          </div>
                        )}
                        {!isExpired && (
                          <form action={submitPreorderCommitmentAction} className="flex flex-wrap items-center gap-2">
                            <input type="hidden" name="campaign_id" value={item.id} />
                            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 focus-within:border-slate-400">
                              <input
                                className="w-14 bg-transparent text-center text-sm font-bold text-slate-900 outline-none"
                                name="cases"
                                type="number"
                                min="1"
                                step="1"
                                defaultValue={hasCommit ? committedCases : ""}
                                placeholder="0"
                                required
                              />
                              <span className="text-xs text-slate-400">case{item.caseQty ? `s ×${item.caseQty}` : "s"}</span>
                            </div>
                            <input type="hidden" name="notes" value="" />
                            <button
                              className="rounded-lg px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
                              style={{ background: "var(--primary)" }}
                              type="submit"
                            >
                              {hasCommit ? "Update" : "Commit"}
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
