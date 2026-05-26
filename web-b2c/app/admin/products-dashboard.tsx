"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import type { DbProduct, DbProductImage, ProductStatus } from "@/lib/types";
import { formatCAD } from "@/lib/money";

const PAGE_SIZE = 25;

interface ProductsResponse {
  products: DbProduct[];
  total: number;
  hasMore: boolean;
}

interface ProductDetailResponse {
  product: DbProduct;
}
const STATUS_COLORS: Record<ProductStatus, string> = {
  active: "bg-green-50 text-green-700 border-green-200",
  draft: "bg-gray-100 text-gray-500 border-gray-300",
  archived: "bg-red-50 text-red-500 border-red-200",
};

function slugify(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function StatusBadge({ status }: { status: ProductStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[status]}`}>
      {status}
    </span>
  );
}

function shouldBypassImageOptimization(src: string): boolean {
  return src.startsWith("blob:") || src.startsWith("data:");
}

const EMPTY = {
  name: "", slug: "", category: "", description: "",
  price: "", compare_at_price: "", weight_kg: "0.5", badge: "",
  in_stock: true, stock_qty: "", status: "active" as ProductStatus,
};

export default function ProductsDashboard() {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ProductStatus>("all");
  const [selected, setSelected] = useState<DbProduct | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [page, setPage] = useState(1);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [images, setImages] = useState<DbProductImage[]>([]);
  const [pending, setPending] = useState<{ file: File; preview: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories((d.categories ?? []).map((c: { name: string }) => c.name)))
      .catch(() => {});
  }, []);

  const fetchProducts = useCallback(async (pageNum = 1) => {
    setPage(pageNum);
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String((pageNum - 1) * PAGE_SIZE),
      });
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      if (catFilter !== "all") params.set("category", catFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data: ProductsResponse = await res.json();
      setProducts(data.products ?? []);
      setTotalProducts(data.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [catFilter, debouncedSearch, statusFilter]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(id);
  }, [search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  function openNew() {
    setSelected(null); setIsNew(true); setForm(EMPTY);
    setImages([]); setPending([]); setSaveMsg(null);
  }

  async function openEdit(p: DbProduct) {
    setSelected(p); setIsNew(false); setDetailLoading(true);
    setForm({
      name: p.name, slug: p.slug, category: p.category,
      description: p.description ?? "", price: String(p.price),
      compare_at_price: p.compare_at_price != null ? String(p.compare_at_price) : "",
      weight_kg: String(p.weight_kg), badge: p.badge ?? "",
      in_stock: p.in_stock,
      stock_qty: p.stock_qty != null ? String(p.stock_qty) : "",
      status: p.status,
    });
    setImages(p.images ?? []); setPending([]); setSaveMsg(null);

    try {
      const res = await fetch(`/api/admin/products/${p.id}`);
      const data: ProductDetailResponse = await res.json();
      if (!res.ok) throw new Error("Failed to load product details");
      const detail = data.product;
      setSelected(detail);
      setForm({
        name: detail.name, slug: detail.slug, category: detail.category,
        description: detail.description ?? "", price: String(detail.price),
        compare_at_price: detail.compare_at_price != null ? String(detail.compare_at_price) : "",
        weight_kg: String(detail.weight_kg), badge: detail.badge ?? "",
        in_stock: detail.in_stock,
        stock_qty: detail.stock_qty != null ? String(detail.stock_qty) : "",
        status: detail.status,
      });
      setImages(detail.images ?? []);
    } catch (e) {
      setSaveMsg({ type: "err", text: e instanceof Error ? e.message : "Failed to load product details" });
    } finally {
      setDetailLoading(false);
    }
  }

  function closePanel() {
    setSelected(null); setIsNew(false); setSaveMsg(null);
    pending.forEach((f) => URL.revokeObjectURL(f.preview));
    setPending([]);
  }

  function onFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setPending((prev) => [...prev, ...files.map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
    e.target.value = "";
  }

  async function uploadPending(): Promise<DbProductImage[]> {
    const result: DbProductImage[] = [];
    for (const { file } of pending) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("slug", form.slug || "misc");
      const res = await fetch("/api/admin/products/upload-image", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      result.push({ url: data.url, alt: form.name || file.name });
    }
    return result;
  }

  async function handleSave() {
    if (!form.name || !form.slug || !form.price) {
      setSaveMsg({ type: "err", text: "Name, slug and price are required." });
      return;
    }
    setSaving(true); setSaveMsg(null);
    try {
      const newImgs = await uploadPending();
      const allImages = [...images, ...newImgs];
      const payload = {
        name: form.name, slug: form.slug, category: form.category,
        description: form.description || null,
        price: parseFloat(form.price),
        compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
        weight_kg: parseFloat(form.weight_kg) || 0.5,
        badge: form.badge || null, in_stock: form.in_stock,
        stock_qty: form.stock_qty ? parseInt(form.stock_qty) : null,
        status: form.status, images: allImages,
      };
      const url = isNew ? "/api/admin/products" : "/api/admin/products/" + selected!.id;
      const res = await fetch(url, { method: isNew ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setSaveMsg({ type: "ok", text: isNew ? "Product created!" : "Saved!" });
      setPending([]); setImages(data.product.images ?? []);
      setIsNew(false); setSelected(data.product);
      await fetchProducts();
    } catch (e) {
      setSaveMsg({ type: "err", text: e instanceof Error ? e.message : "Save failed" });
    } finally { setSaving(false); }
  }

  async function handleArchive() {
    if (!selected || !confirm("Archive \"" + selected.name + "\"?")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/products/" + selected.id, { method: "DELETE" });
      if (!res.ok) throw new Error("Archive failed");
      setSaveMsg({ type: "ok", text: "Archived." });
      await fetchProducts();
      setSelected((p) => p ? { ...p, status: "archived" } : null);
    } catch (e) {
      setSaveMsg({ type: "err", text: e instanceof Error ? e.message : "Failed" });
    } finally { setSaving(false); }
  }

  const filtered = products;
  const totalPages = Math.ceil(totalProducts / PAGE_SIZE);

  const panelOpen = isNew || selected !== null;

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-gray-900">Products</h2>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
              {totalProducts}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => fetchProducts(page)} disabled={loading}
              className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50">
              {loading ? "Loading..." : "Refresh"}
            </button>
            <button onClick={openNew}
              className="rounded-full bg-[#C41E3A] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#A01830] transition-colors">
              + New Product
            </button>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input type="search" placeholder="Search by name or slug..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#C41E3A] focus:ring-2 focus:ring-[#C41E3A]/15" />
          <div className="flex gap-2">
            <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#C41E3A]">
              <option value="all">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | ProductStatus)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#C41E3A]">
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Table */}
        <div className={`flex-1 overflow-auto ${panelOpen ? "hidden md:block" : ""}`}>
          {error ? (
            <div className="p-6"><p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p></div>
          ) : loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#C41E3A]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-gray-400 text-sm mb-4">{products.length === 0 ? "No products yet." : "No products match your filters."}</p>
            </div>
          ) : (
            <>
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-gray-50 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-bold">Product</th>
                    <th className="px-4 py-3 font-bold hidden md:table-cell">Category</th>
                    <th className="px-4 py-3 font-bold">Price</th>
                    <th className="px-4 py-3 font-bold hidden md:table-cell">Stock</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((p) => {
                    const imgUrl = p.images?.[0]?.url;
                    return (
                      <tr
                        key={p.id}
                        onClick={() => openEdit(p)}
                        className={`cursor-pointer hover:bg-gray-50 bg-white ${selected?.id === p.id ? "bg-blue-50 hover:bg-blue-50" : ""}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                              {imgUrl ? (
                                <Image src={imgUrl} alt={p.name} width={40} height={40} sizes="40px" className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-gray-300 text-xs">-</div>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-xs leading-tight line-clamp-1">{p.name}</p>
                              <p className="text-xs text-gray-400 font-mono">{p.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell"><span className="text-xs text-gray-600">{p.category}</span></td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-gray-900">{formatCAD(p.price)}</p>
                          {p.compare_at_price && <p className="text-xs text-gray-400 line-through">{formatCAD(p.compare_at_price)}</p>}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {p.stock_qty != null
                            ? <span className={`text-xs font-semibold ${p.stock_qty <= 5 ? "text-red-500" : "text-gray-600"}`}>{p.stock_qty} units</span>
                            : <span className="text-xs text-gray-400">-</span>}
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {totalProducts > PAGE_SIZE && (
                <Pagination
                  page={page}
                  totalPages={Math.ceil(totalProducts / PAGE_SIZE)}
                  totalItems={totalProducts}
                  pageSize={PAGE_SIZE}
                  onPage={fetchProducts}
                />
              )}
            </>
          )}
        </div>

        {/* Side Panel */}
        {panelOpen && (
          <div className="w-full md:w-110 shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <p className="font-bold text-gray-900">{isNew ? "New Product" : "Edit Product"}</p>
              <button onClick={closePanel} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 transition-colors">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="px-5 py-4 space-y-4">
                {detailLoading && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-600">
                    Loading full product details...
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Product Name *</label>
                  <input type="text" value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value, slug: isNew ? slugify(e.target.value) : p.slug }))}
                    placeholder="e.g. Canada Flag Car Flag"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#C41E3A] focus:ring-2 focus:ring-[#C41E3A]/15" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Slug (URL) *</label>
                  <input type="text" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                    placeholder="canada-flag-car-flag"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-mono outline-none focus:border-[#C41E3A]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Category *</label>
                    <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#C41E3A]">
                      <option value="">Select category…</option>
                      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                    <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as ProductStatus }))}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#C41E3A]">
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Price (CAD) *</label>
                    <input type="number" step="0.01" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                      placeholder="14.99" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#C41E3A]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Compare At</label>
                    <input type="number" step="0.01" value={form.compare_at_price} onChange={(e) => setForm((p) => ({ ...p, compare_at_price: e.target.value }))}
                      placeholder="19.99" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#C41E3A]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Weight (kg)</label>
                    <input type="number" step="0.01" value={form.weight_kg} onChange={(e) => setForm((p) => ({ ...p, weight_kg: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#C41E3A]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Badge</label>
                    <input type="text" value={form.badge} onChange={(e) => setForm((p) => ({ ...p, badge: e.target.value }))}
                      placeholder="New, Bundle..." className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#C41E3A]" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.in_stock} onChange={(e) => setForm((p) => ({ ...p, in_stock: e.target.checked }))} className="rounded" />
                    <span className="text-sm font-semibold text-gray-700">In Stock</span>
                  </label>
                  <input type="number" value={form.stock_qty} onChange={(e) => setForm((p) => ({ ...p, stock_qty: e.target.value }))}
                    placeholder="Qty (optional)" className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#C41E3A]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    rows={3} placeholder="Product description shown on the store..."
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#C41E3A] resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Images</label>
                  {images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {images.map((img, i) => (
                        <div key={i} className="relative group">
                          <div className="h-16 w-16 rounded-lg overflow-hidden border border-gray-200">
                            <Image
                              src={img.url}
                              alt={img.alt}
                              width={64}
                              height={64}
                              sizes="64px"
                              className="h-full w-full object-cover"
                              unoptimized={shouldBypassImageOptimization(img.url)}
                            />
                          </div>
                          {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] text-center py-0.5 rounded-b-lg">Main</span>}
                          <button onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                            className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs hidden group-hover:flex items-center justify-center">
                            x
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {pending.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {pending.map((f, i) => (
                        <div key={i} className="relative group">
                          <div className="h-16 w-16 rounded-lg overflow-hidden border border-dashed border-blue-300">
                            <Image src={f.preview} alt="pending" width={64} height={64} sizes="64px" className="h-full w-full object-cover" unoptimized />
                          </div>
                          <button onClick={() => { URL.revokeObjectURL(f.preview); setPending((p) => p.filter((_, j) => j !== i)); }}
                            className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs hidden group-hover:flex items-center justify-center">
                            x
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 hover:border-gray-400 transition-colors w-full justify-center">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Upload Image
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onFileSelect} />
                </div>
                {selected?.stripe_price_id && (
                  <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-xs text-gray-500 space-y-0.5">
                    <p className="font-semibold text-gray-700 mb-1">Stripe</p>
                    <p className="truncate">Product: <span className="font-mono">{selected.stripe_product_id}</span></p>
                    <p className="truncate">Price: <span className="font-mono">{selected.stripe_price_id}</span></p>
                  </div>
                )}
                {saveMsg && (
                  <div className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${saveMsg.type === "ok" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
                    {saveMsg.text}
                  </div>
                )}
                <button onClick={handleSave} disabled={saving || detailLoading}
                  className="w-full rounded-full bg-[#C41E3A] py-2.5 text-sm font-bold text-white hover:bg-[#A01830] transition-colors disabled:opacity-60">
                  {saving ? "Saving..." : isNew ? "Create Product" : "Save Changes"}
                </button>
                {!isNew && selected && selected.status !== "archived" && (
                  <button onClick={handleArchive} disabled={saving}
                    className="w-full rounded-full border border-red-200 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
                    Archive Product
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, totalItems, pageSize, onPage }: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  return (
    <div className="border-t border-gray-100 bg-white px-4 py-3 flex items-center justify-between">
      <p className="text-xs text-gray-400">
        {from}–{to} of {totalItems}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← Prev
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs text-gray-300">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={`min-w-7.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                p === page
                  ? "bg-[#C41E3A] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
