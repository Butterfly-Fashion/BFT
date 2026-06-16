"use client";

import { useEffect, useState } from "react";
import { ProductImage } from "@/components/store/product-image";

interface ProductGalleryProps {
  src: string;
  alt: string;
  placeholderGradient: string;
  additionalImages?: string[];
}

export function ProductGallery({ src, alt, placeholderGradient, additionalImages }: ProductGalleryProps) {
  const images = [src, ...(additionalImages ?? [])];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });

  const selectedImage = images[selectedIndex] ?? src;

  function openLightbox() {
    setZoomed(false);
    setOrigin({ x: 50, y: 50 });
    setLightboxOpen(true);
  }

  function showImage(i: number) {
    setSelectedIndex((i + images.length) % images.length);
    setZoomed(false);
    setOrigin({ x: 50, y: 50 });
  }

  // Keyboard controls + body scroll lock while the lightbox is open
  useEffect(() => {
    if (!lightboxOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
      else if (e.key === "ArrowRight") showImage(selectedIndex + 1);
      else if (e.key === "ArrowLeft") showImage(selectedIndex - 1);
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxOpen, selectedIndex, images.length]);

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!zoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  }

  return (
    <div className="space-y-3">
      {/* Main image — click to open zoomable lightbox */}
      <button
        type="button"
        onClick={openLightbox}
        aria-label="Open zoomable image viewer"
        className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-2xl shadow-sm"
        style={{ background: placeholderGradient }}
      >
        <ProductImage
          src={selectedImage}
          alt={alt}
          placeholderGradient={placeholderGradient}
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain transition-transform duration-300 group-hover:scale-105"
          priority
        />
        {/* Zoom hint */}
        <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1.5 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
          <ZoomIcon className="h-3.5 w-3.5" />
          Click to zoom
        </span>
      </button>

      {images.length > 1 && (
        <div className="flex gap-3">
          {images.map((image, i) => (
            <button
              key={image}
              type="button"
              onClick={() => showImage(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={selectedIndex === i}
              className={`relative h-20 w-20 overflow-hidden rounded-xl border-2 bg-white transition-all ${
                selectedIndex === i
                  ? "border-brand ring-2 ring-brand/40 ring-offset-2"
                  : "border-gray-200 opacity-70 hover:opacity-100 hover:border-gray-400"
              }`}
            >
              <ProductImage
                src={image}
                alt={alt}
                placeholderGradient={placeholderGradient}
                sizes="80px"
                className="object-contain"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close */}
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20"
          >
            <CloseIcon className="h-5 w-5" />
          </button>

          {/* Counter */}
          {images.length > 1 && (
            <span className="absolute left-1/2 top-5 z-10 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">
              {selectedIndex + 1} / {images.length}
            </span>
          )}

          {/* Prev / Next */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); showImage(selectedIndex - 1); }}
                aria-label="Previous image"
                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20 sm:left-6"
              >
                <ChevronIcon className="h-6 w-6 rotate-180" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); showImage(selectedIndex + 1); }}
                aria-label="Next image"
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20 sm:right-6"
              >
                <ChevronIcon className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Image stage — click toggles zoom, move to pan */}
          <div
            className={`relative h-full w-full max-w-4xl overflow-hidden ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
            onClick={(e) => { e.stopPropagation(); setZoomed((z) => !z); }}
            onMouseMove={handleMove}
          >
            <div
              className="absolute inset-0 transition-transform duration-200"
              style={{
                transform: zoomed ? "scale(2.4)" : "scale(1)",
                transformOrigin: `${origin.x}% ${origin.y}%`,
              }}
            >
              <ProductImage
                src={selectedImage}
                alt={alt}
                placeholderGradient={placeholderGradient}
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ZoomIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="M21 21l-4.3-4.3M11 8v6M8 11h6" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
    </svg>
  );
}
