"use client";

import { useState } from "react";
import { X, ZoomIn } from "lucide-react";
import { ProductImage } from "@/components/store/product-image";

export function ProductImageGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);

  const list = images.length ? images : [""];
  const index = Math.min(active, list.length - 1);
  const current = list[index] || null;
  const hasThumbs = list.length > 1;

  return (
    <div className="flex flex-col gap-3">
      <div
        className="group relative cursor-zoom-in overflow-hidden rounded-xl border border-slate-200 bg-[#f7f7f5]"
        onClick={() => setOpen(true)}
        role="button"
        aria-label="Enlarge image"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setOpen(true)}
      >
        <div className="flex aspect-square items-center justify-center p-6 sm:p-10">
          <ProductImage
            className="max-h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
            src={current}
            alt={alt}
          />
        </div>
        <div className="absolute bottom-3 right-3 rounded-lg bg-black/40 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100">
          <ZoomIn size={15} />
        </div>
      </div>

      {hasThumbs && (
        <div className="flex flex-wrap gap-2">
          {list.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === index}
              className={`grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg border bg-[#f7f7f5] p-1.5 transition-colors ${
                i === index ? "border-slate-900" : "border-slate-200 hover:border-slate-400"
              }`}
            >
              <ProductImage
                className="max-h-full w-full object-contain"
                src={src}
                alt={`${alt} thumbnail ${i + 1}`}
              />
            </button>
          ))}
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpen(false)}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/25"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            <X size={22} />
          </button>
          <div
            className="max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <ProductImage
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
              src={current}
              alt={alt}
            />
          </div>
        </div>
      )}
    </div>
  );
}
