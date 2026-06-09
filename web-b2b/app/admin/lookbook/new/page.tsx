"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ImagePlus, Loader2, UploadCloud } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { createLookbookItemAction } from "@/app/actions";

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 1400;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }) : file),
        "image/jpeg",
        0.88
      );
    };
    img.src = url;
  });
}

export default function NewLookbookItemPage() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [imageInfo, setImageInfo] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    setImageInfo("Compressing…");
    try {
      const compressed = await compressImage(file);
      setCompressedFile(compressed);
      setPreviewUrl(URL.createObjectURL(compressed));
      const kb = (compressed.size / 1024).toFixed(0);
      setImageInfo(`✓ ${compressed.name} — ${kb} KB`);
    } catch {
      setImageInfo("❌ Failed to process image.");
    } finally {
      setCompressing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!compressedFile) { setError("Please select an image."); return; }
    setSubmitting(true);
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("image", compressedFile, compressedFile.name);
    const result = await createLookbookItemAction(fd);
    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <>
      <AdminNav />
      <main className="container-shell py-7">
        <form ref={formRef} onSubmit={handleSubmit} className="mx-auto max-w-2xl grid gap-5">
          <section className="card p-5">
            <div className="mb-5 border-b border-slate-100 pb-4">
              <p className="text-xs font-black uppercase tracking-widest text-(--primary)">Lookbook</p>
              <h1 className="mt-1 text-2xl font-black text-slate-900">Upload Image</h1>
              <p className="mt-1 text-sm text-slate-500">
                Add a banner or campaign image to the public lookbook gallery.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <div className="grid gap-4">
              {/* Image upload */}
              <div>
                <p className="label mb-2 text-sm font-semibold text-slate-700">Image *</p>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => inputRef.current?.click()}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
                  className="cursor-pointer rounded-xl border-2 border-dashed border-slate-200 p-3 transition-colors hover:border-green-500"
                >
                  <div className="relative aspect-video overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                    {compressing ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 size={24} className="animate-spin text-green-600" />
                      </div>
                    ) : previewUrl ? (
                      <img alt="Preview" className="h-full w-full object-cover" src={previewUrl} />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
                        <ImagePlus size={32} />
                        <p className="text-sm font-semibold">Click to select image</p>
                        <p className="text-xs">JPG, PNG — max 5 MB</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </div>
                {imageInfo && (
                  <p className={`mt-1.5 flex items-center gap-1.5 text-xs font-semibold ${imageInfo.startsWith("✓") ? "text-green-600" : imageInfo.startsWith("❌") ? "text-red-500" : "text-amber-600"}`}>
                    <UploadCloud size={12} /> {imageInfo}
                  </p>
                )}
              </div>

              {/* Title */}
              <label className="label">
                Title *
                <input
                  className="field"
                  name="title"
                  required
                  placeholder="e.g. Winter 2025 Collection"
                />
              </label>

              {/* Description */}
              <label className="label">
                Description
                <textarea
                  className="field min-h-20"
                  name="description"
                  placeholder="Optional caption or description shown under the image"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Season */}
                <label className="label">
                  Season / Tag
                  <input
                    className="field"
                    name="season"
                    placeholder="e.g. Winter 2025"
                  />
                </label>

                {/* Sort order */}
                <label className="label">
                  Sort order
                  <input
                    className="field"
                    name="sort_order"
                    type="number"
                    defaultValue={0}
                    min={0}
                    placeholder="0 = first"
                  />
                </label>
              </div>

              {/* Linked product */}
              <label className="label">
                Linked product slug (optional)
                <input
                  className="field"
                  name="linked_product_slug"
                  placeholder="e.g. winter-gloves-black — shows 'View product →' link"
                />
              </label>

              {/* Visibility */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-slate-700">
                  <input
                    name="is_published"
                    type="checkbox"
                    defaultChecked
                    value="true"
                    className="accent-green-600"
                    onChange={(e) => {
                      const input = e.currentTarget.form?.querySelector('[name="is_published_value"]') as HTMLInputElement | null;
                      if (input) input.value = e.currentTarget.checked ? "true" : "false";
                    }}
                  />
                  Published (visible on public lookbook page)
                </label>
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-3">
            <Link className="btn-secondary" href="/admin/lookbook">Cancel</Link>
            <button className="btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Uploading…" : "Save image"}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
