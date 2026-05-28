"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, UploadCloud } from "lucide-react";
import { upsertProductAction } from "@/app/actions";

type ProductFormProps = {
  mode: "create" | "edit";
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
  };
};

export function ProductForm({ mode, product }: ProductFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState(product?.image_url || "");
  const [dragging, setDragging] = useState(false);

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

  function openFilePicker() {
    inputRef.current?.click();
  }

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

      <section className="card p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-black uppercase text-[var(--accent)]">{mode === "create" ? "New product" : "Product editor"}</p>
            <h1 className="mt-1 text-3xl font-black">{mode === "create" ? "Create product" : "Edit product"}</h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">Manage storefront copy, B2B starting price, image, visibility, and category.</p>
          </div>
          <Link className="btn-secondary" href="/admin/products">Back to products</Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-4">
            <label className="label">Product name<input className="field" name="name" defaultValue={product?.name || ""} required /></label>
            <label className="label">Description<textarea className="field min-h-40" name="description" defaultValue={product?.description || ""} placeholder="Short operational product description for customers and admin review." /></label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="label">Category
                <select className="field" name="category" defaultValue={product?.category || "Car Flags"} required>
                  <option>Car Flags</option>
                  <option>Caps</option>
                  <option>Bucket Hats</option>
                  <option>Boxing Gloves</option>
                  <option>Accessories</option>
                </select>
              </label>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Pricing</p>
              <p className="mt-1 mb-3 text-xs font-semibold text-slate-500">
                Unit price is required. Case price and case quantity are optional — set both together.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <label className="label">
                  Unit price (낱개)
                  <input className="field" name="unit_price" defaultValue={product?.unit_price ?? ""} required step="0.01" min="0" type="number" placeholder="e.g. 5.99" />
                </label>
                <label className="label">
                  Case price (케이스)
                  <input className="field" name="case_price" defaultValue={product?.case_price ?? ""} step="0.01" min="0" type="number" placeholder="e.g. 59.99" />
                </label>
                <label className="label">
                  Case qty (개/케이스)
                  <input className="field" name="case_qty" defaultValue={product?.case_qty ?? ""} step="1" min="1" type="number" placeholder="e.g. 12" />
                </label>
              </div>
            </div>
            {/* Shipping — weight & box dimensions for accurate carrier quotes */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Shipping</p>
              <p className="mt-1 mb-3 text-xs font-semibold text-slate-500">
                Enter the actual weight and box size <strong>including packaging</strong>. Used to calculate exact carrier rates — inaccurate values cause losses.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="label">
                  Weight (kg, incl. packaging)
                  <input
                    className="field"
                    name="weight_kg"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="e.g. 0.25"
                    defaultValue={product?.weight_kg ?? ""}
                  />
                </label>
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-1">Box dimensions (cm, incl. packaging)</p>
                  <div className="grid grid-cols-3 gap-2">
                    <label className="label text-xs">
                      Length
                      <input className="field" name="box_length_cm" type="number" step="0.1" min="1" placeholder="L" defaultValue={product?.box_length_cm ?? ""} />
                    </label>
                    <label className="label text-xs">
                      Width
                      <input className="field" name="box_width_cm" type="number" step="0.1" min="1" placeholder="W" defaultValue={product?.box_width_cm ?? ""} />
                    </label>
                    <label className="label text-xs">
                      Height
                      <input className="field" name="box_height_cm" type="number" step="0.1" min="1" placeholder="H" defaultValue={product?.box_height_cm ?? ""} />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">System IDs (optional)</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Leave these blank and the system will generate unique values from the product name and category.
              </p>
              <div className="mt-3 grid gap-4 md:grid-cols-3">
                <label className="label">Slug<input className="field" name="slug" defaultValue={product?.slug || ""} placeholder="Auto-generate if blank" /></label>
                <label className="label">SKU<input className="field" name="sku" defaultValue={product?.sku || ""} placeholder="Auto-generate if blank" /></label>
                <label className="label">Barcode<input className="field" name="barcode" defaultValue={product?.barcode || ""} placeholder="Optional" /></label>
              </div>
            </div>
          </div>

          <aside className="grid gap-4">
            <input
              ref={inputRef}
              className="hidden"
              name="image_file"
              type="file"
              accept="image/*"
              onChange={(event) => previewFile(event.target.files?.[0])}
            />
            <div
              role="button"
              tabIndex={0}
              onClick={openFilePicker}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") openFilePicker();
              }}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`rounded-lg border border-dashed bg-[#fafafa] p-3 transition-colors ${
                dragging ? "border-(--primary) bg-blue-50" : "border-slate-300 hover:border-(--primary)"
              }`}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase text-slate-500">Product image</p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-400">Drag and drop, or click the preview.</p>
                </div>
                <UploadCloud size={18} className="text-slate-400" />
              </div>
              <div className="aspect-square overflow-hidden rounded border border-slate-200 bg-white">
                {previewUrl ? (
                  <img alt={product?.name || "Product preview"} className="h-full w-full object-contain" src={previewUrl} />
                ) : (
                  <div className="grid h-full place-items-center text-center text-sm font-bold text-slate-400">
                    <span>
                      <ImagePlus size={28} className="mx-auto mb-2" />
                      Add product image
                    </span>
                  </div>
                )}
              </div>
            </div>
            <label className="label">Availability
              <select className="field" name="availability_status" defaultValue={product?.availability_status || "Manual Confirm"}>
                <option>Available</option>
                <option>Limited</option>
                <option>Manual Confirm</option>
                <option>Hidden</option>
              </select>
            </label>
            <label className="flex items-center gap-2 rounded border border-slate-200 bg-white p-3 text-sm font-bold"><input name="is_bulk_available" type="checkbox" defaultChecked={product?.is_bulk_available ?? true} /> Bulk available</label>
            <label className="flex items-center gap-2 rounded border border-slate-200 bg-white p-3 text-sm font-bold"><input name="is_hidden" type="checkbox" defaultChecked={product?.is_hidden ?? false} /> Hide from storefront</label>
          </aside>
        </div>
      </section>

      <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-[#f6f6f3]/95 py-3 backdrop-blur">
        <Link className="btn-secondary" href="/admin/products">Cancel</Link>
        <button className="btn-primary" type="submit">{mode === "create" ? "Create product" : "Save changes"}</button>
      </div>
    </form>
  );
}
