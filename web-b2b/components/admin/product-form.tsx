"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, UploadCloud, ChevronDown, ChevronRight } from "lucide-react";
import { upsertProductAction } from "@/app/actions";
import type { Category } from "@/lib/category-utils";
import { buildCategoryTree } from "@/lib/category-utils";

const FALLBACK_CATEGORIES: Category[] = [
  { id: "1", name: "Car Flags", slug: "car-flags", sort_order: 1, is_active: true, parent_id: null },
  { id: "2", name: "Caps", slug: "caps", sort_order: 2, is_active: true, parent_id: null },
  { id: "3", name: "Bucket Hats", slug: "bucket-hats", sort_order: 3, is_active: true, parent_id: null },
  { id: "4", name: "Boxing Gloves", slug: "boxing-gloves", sort_order: 4, is_active: true, parent_id: null },
  { id: "5", name: "Rolling Papers", slug: "rolling-papers", sort_order: 5, is_active: true, parent_id: null },
  { id: "6", name: "Bongs & Pipes", slug: "bongs-pipes", sort_order: 6, is_active: true, parent_id: null },
  { id: "7", name: "Lighters", slug: "lighters", sort_order: 7, is_active: true, parent_id: null },
  { id: "8", name: "Winter Items", slug: "winter-items", sort_order: 8, is_active: true, parent_id: null },
  { id: "9", name: "Accessories", slug: "accessories", sort_order: 9, is_active: true, parent_id: null },
];

type ProductFormProps = {
  mode: "create" | "edit";
  categories?: Category[];
  product?: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    sku: string;
    barcode?: string | null;
    unit_price: number;
    case_price?: number | null;
    case_qty?: number | null;
    image_url?: string | null;
    category: string;
    availability_status: string;
    is_bulk_available: boolean;
    is_hidden: boolean;
    weight_kg?: number | null;
    box_length_cm?: number | null;
    box_width_cm?: number | null;
    box_height_cm?: number | null;
    stock_qty?: number | null;
    country?: string | null;
    lead_time?: string | null;
  };
};

function OptionalBadge() {
  return (
    <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
      Optional
    </span>
  );
}

function SectionHeader({ title, description, optional }: { title: string; description?: string; optional?: boolean }) {
  return (
    <div className="mb-4">
      <p className="flex items-center text-sm font-bold text-slate-700">
        {title}
        {optional && <OptionalBadge />}
      </p>
      {description && <p className="mt-0.5 text-xs text-slate-400">{description}</p>}
    </div>
  );
}

function CollapsibleSection({ title, description, defaultOpen = false, children }: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div>
          <p className="flex items-center text-sm font-bold text-slate-600">
            {title}
            <OptionalBadge />
          </p>
          {description && !open && (
            <p className="mt-0.5 text-xs text-slate-400">{description}</p>
          )}
        </div>
        {open ? <ChevronDown size={14} className="shrink-0 text-slate-400" /> : <ChevronRight size={14} className="shrink-0 text-slate-400" />}
      </button>
      {open && <div className="border-t border-slate-200 p-4">{children}</div>}
    </div>
  );
}

export function ProductForm({ mode, product, categories }: ProductFormProps) {
  const catList = categories?.length ? categories : FALLBACK_CATEGORIES;
  const tree = buildCategoryTree(catList);
  const defaultCategory = product?.category || (tree[0]?.children[0]?.name ?? tree[0]?.name ?? "");

  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState(product?.image_url || "");
  const [dragging, setDragging] = useState(false);

  const hasInventory = !!(product?.stock_qty != null || product?.country || product?.lead_time);
  const hasShipping = !!(product?.weight_kg || product?.box_length_cm);
  const hasIds = !!(product?.slug || product?.sku || product?.barcode);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function previewFile(file?: File) {
    if (!file || !file.type.startsWith("image/")) return;
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function openFilePicker() { inputRef.current?.click(); }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (!file || !inputRef.current) return;
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    inputRef.current.files = dataTransfer.files;
    previewFile(file);
  }

  return (
    <form action={upsertProductAction} className="grid gap-5">
      {product?.id && <input name="id" type="hidden" value={product.id} />}
      <input name="image_url" type="hidden" value={product?.image_url || ""} />

      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="section-label">{mode === "create" ? "New product" : "Edit product"}</p>
          <h1 className="mt-1 text-2xl font-black text-slate-900">
            {mode === "create" ? "Create product" : product?.name || "Edit product"}
          </h1>
        </div>
        <Link className="btn-secondary" href="/admin/products">← Back to products</Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        {/* ── Left: main fields ── */}
        <div className="grid gap-4">

          {/* REQUIRED: basics */}
          <div className="card p-5">
            <SectionHeader title="Basic info" description="Name and category are required to save." />
            <div className="grid gap-4">
              <label className="label">
                Product name <span className="text-red-500">*</span>
                <input
                  className="field"
                  name="name"
                  defaultValue={product?.name || ""}
                  required
                  placeholder="e.g. Canada Car Flag"
                />
              </label>

              <label className="label">
                Category <span className="text-red-500">*</span>
                {tree.length === 0 ? (
                  <div className="field flex items-center text-sm text-slate-400">
                    No categories — <Link href="/admin/categories" className="ml-1 underline text-slate-600">add one first</Link>
                  </div>
                ) : (
                  <select className="field" name="category" defaultValue={defaultCategory} required>
                    {tree.map((parent) =>
                      parent.children.length === 0 ? (
                        <option key={parent.id} value={parent.name}>{parent.name}</option>
                      ) : (
                        <optgroup key={parent.id} label={parent.name}>
                          {parent.children.map((child) => (
                            <option key={child.id} value={child.name}>{child.name}</option>
                          ))}
                        </optgroup>
                      )
                    )}
                  </select>
                )}
              </label>

              <label className="label">
                Description <OptionalBadge />
                <textarea
                  className="field min-h-24"
                  name="description"
                  defaultValue={product?.description || ""}
                  placeholder="Short description for customers and admin. Leave blank if not needed."
                />
              </label>
            </div>
          </div>

          {/* REQUIRED: pricing */}
          <div className="card p-5">
            <SectionHeader title="Pricing" />
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="label sm:col-span-1">
                Unit price / ea <span className="text-red-500">*</span>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                  <input
                    className="field"
                    style={{ paddingLeft: "1.5rem" }}
                    name="unit_price"
                    defaultValue={product?.unit_price ?? ""}
                    required
                    step="0.01"
                    min="0"
                    type="number"
                    placeholder="0.00"
                  />
                </div>
              </label>
              <label className="label">
                Case price <OptionalBadge />
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                  <input
                    className="field"
                    style={{ paddingLeft: "1.5rem" }}
                    name="case_price"
                    defaultValue={product?.case_price ?? ""}
                    step="0.01"
                    min="0"
                    type="number"
                    placeholder="0.00"
                  />
                </div>
              </label>
              <label className="label">
                Case qty / MOQ <OptionalBadge />
                <input
                  className="field"
                  name="case_qty"
                  defaultValue={product?.case_qty ?? ""}
                  step="1"
                  min="1"
                  type="number"
                  placeholder="e.g. 12"
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Case price + MOQ are optional. If set, customers see the per-case price alongside individual pricing.
            </p>
          </div>

          {/* OPTIONAL: inventory */}
          <CollapsibleSection
            title="Inventory & origin"
            description="Stock count, country variant, lead time"
            defaultOpen={hasInventory}
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="label">
                Stock qty
                <input
                  className="field"
                  name="stock_qty"
                  defaultValue={product?.stock_qty ?? ""}
                  step="1"
                  min="0"
                  type="number"
                  placeholder="Leave blank if unknown"
                />
                <span className="mt-1 block text-xs text-slate-400">Decrements automatically when orders complete.</span>
              </label>
              <label className="label">
                Country / variant
                <input
                  className="field"
                  name="country"
                  defaultValue={product?.country ?? ""}
                  placeholder="e.g. Canada, Mexico"
                />
              </label>
              <label className="label">
                Lead time
                <input
                  className="field"
                  name="lead_time"
                  defaultValue={product?.lead_time ?? ""}
                  placeholder="e.g. In stock, 2–3 days"
                />
              </label>
            </div>
          </CollapsibleSection>

          {/* OPTIONAL: shipping dimensions */}
          <CollapsibleSection
            title="Shipping dimensions"
            description="Weight and box size for carrier rate calculation"
            defaultOpen={hasShipping}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="label">
                Weight (kg, incl. packaging)
                <input
                  className="field"
                  name="weight_kg"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 0.25"
                  defaultValue={product?.weight_kg ?? ""}
                />
              </label>
              <div>
                <p className="label mb-1">Box dimensions (cm)</p>
                <div className="grid grid-cols-3 gap-2">
                  <label className="label text-xs">
                    L
                    <input className="field" name="box_length_cm" type="number" step="0.1" min="0" placeholder="L" defaultValue={product?.box_length_cm ?? ""} />
                  </label>
                  <label className="label text-xs">
                    W
                    <input className="field" name="box_width_cm" type="number" step="0.1" min="0" placeholder="W" defaultValue={product?.box_width_cm ?? ""} />
                  </label>
                  <label className="label text-xs">
                    H
                    <input className="field" name="box_height_cm" type="number" step="0.1" min="0" placeholder="H" defaultValue={product?.box_height_cm ?? ""} />
                  </label>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* OPTIONAL: system IDs */}
          <CollapsibleSection
            title="System IDs"
            description="Auto-generated from name — only fill if you need specific values"
            defaultOpen={hasIds}
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="label">
                Slug
                <input className="field" name="slug" defaultValue={product?.slug || ""} placeholder="auto-generate" />
              </label>
              <label className="label">
                SKU
                <input className="field" name="sku" defaultValue={product?.sku || ""} placeholder="auto-generate" />
              </label>
              <label className="label">
                Barcode
                <input className="field" name="barcode" defaultValue={product?.barcode || ""} placeholder="—" />
              </label>
            </div>
          </CollapsibleSection>
        </div>

        {/* ── Right: image + visibility ── */}
        <div className="grid gap-4">
          {/* Image upload */}
          <div className="card p-4">
            <p className="mb-3 flex items-center text-sm font-bold text-slate-700">
              Product image <OptionalBadge />
            </p>
            <input
              ref={inputRef}
              className="hidden"
              name="image_file"
              type="file"
              accept="image/*"
              onChange={(e) => previewFile(e.target.files?.[0])}
            />
            <div
              role="button"
              tabIndex={0}
              onClick={openFilePicker}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openFilePicker(); }}
              onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`cursor-pointer rounded-lg border border-dashed p-2 transition-colors ${
                dragging ? "border-green-500 bg-green-50" : "border-slate-300 hover:border-green-500"
              }`}
            >
              <div className="aspect-square overflow-hidden rounded border border-slate-200 bg-white">
                {previewUrl ? (
                  <img alt="preview" className="h-full w-full object-contain" src={previewUrl} />
                ) : (
                  <div className="grid h-full place-items-center text-center text-sm text-slate-400">
                    <span>
                      <ImagePlus size={24} className="mx-auto mb-1.5 text-slate-300" />
                      <span className="text-xs">Click or drag & drop</span>
                    </span>
                  </div>
                )}
              </div>
              <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <UploadCloud size={12} /> Max 5 MB · JPG, PNG, WebP
              </p>
            </div>
          </div>

          {/* Visibility */}
          <div className="card p-4">
            <p className="mb-3 text-sm font-bold text-slate-700">Visibility & status</p>
            <div className="grid gap-3">
              <label className="label">
                Availability
                <select className="field" name="availability_status" defaultValue={product?.availability_status || "Manual Confirm"}>
                  <option value="Available">Available</option>
                  <option value="Limited">Limited stock</option>
                  <option value="Manual Confirm">Manual confirm</option>
                  <option value="Hidden">Hidden</option>
                </select>
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <input name="is_bulk_available" type="checkbox" defaultChecked={product?.is_bulk_available ?? true} className="accent-green-600" />
                Bulk ordering available
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <input name="is_hidden" type="checkbox" defaultChecked={product?.is_hidden ?? false} className="accent-green-600" />
                Hide from storefront
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-1 py-3 backdrop-blur">
        <p className="text-xs text-slate-400">
          <span className="text-red-500">*</span> Required fields
        </p>
        <div className="flex gap-3">
          <Link className="btn-secondary" href="/admin/products">Cancel</Link>
          <button className="btn-primary" type="submit">
            {mode === "create" ? "Create product" : "Save changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
