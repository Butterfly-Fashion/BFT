"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ImagePlus, Loader2, UploadCloud } from "lucide-react";
import { updateHeroBannerAction } from "@/app/actions";
import type { HeroBanner } from "@/lib/types";

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 1920;
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

export function HeroBannerEditForm({ banner }: { banner: HeroBanner }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(banner.image_url);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [imageInfo, setImageInfo] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    setImageInfo("Compressing…");
    try {
      const compressed = await compressImage(file);
      setCompressedFile(compressed);
      setPreviewUrl(URL.createObjectURL(compressed));
      setImageInfo(`✓ ${compressed.name} — ${(compressed.size / 1024).toFixed(0)} KB`);
    } catch {
      setImageInfo("❌ Failed to process image.");
    } finally {
      setCompressing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    if (compressedFile) fd.set("image", compressedFile, compressedFile.name);
    const result = await updateHeroBannerAction(fd);
    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl grid gap-5">
      <input type="hidden" name="banner_id" value={banner.id} />

      <section className="card p-5">
        <div className="mb-5 border-b border-slate-100 pb-4">
          <p className="text-xs font-black uppercase tracking-widest text-(--primary)">Hero banner</p>
          <h1 className="mt-1 text-2xl font-black text-slate-900">Edit Banner</h1>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">Image (leave blank to keep current)</p>
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
                    <p className="text-sm font-semibold">Click to replace image</p>
                  </div>
                )}
              </div>
              <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            </div>
            {imageInfo && (
              <p className={`mt-1.5 flex items-center gap-1.5 text-xs font-semibold ${imageInfo.startsWith("✓") ? "text-green-600" : imageInfo.startsWith("❌") ? "text-red-500" : "text-amber-600"}`}>
                <UploadCloud size={12} /> {imageInfo}
              </p>
            )}
          </div>

          <label className="label">
            Title *
            <input className="field" name="title" required defaultValue={banner.title} />
          </label>

          <label className="label">
            Subtitle
            <textarea className="field min-h-20" name="subtitle" defaultValue={banner.subtitle || ""} />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="label">
              Link URL
              <input className="field" name="link_url" defaultValue={banner.link_url || ""} placeholder="e.g. /products" />
            </label>
            <label className="label">
              Sort order
              <input className="field" name="sort_order" type="number" defaultValue={banner.sort_order} min={0} />
            </label>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-slate-700">
              <input
                name="is_published"
                type="checkbox"
                defaultChecked={banner.is_published}
                value="true"
                className="accent-green-600"
              />
              Published (visible in homepage hero carousel)
            </label>
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Link className="btn-secondary" href="/admin/hero">Cancel</Link>
        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
