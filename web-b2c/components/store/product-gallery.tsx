"use client";

import { useState } from "react";
import { ProductImage } from "@/components/store/product-image";

interface ProductGalleryProps {
  src: string;
  alt: string;
  placeholderGradient: string;
  additionalImages?: string[];
}

export function ProductGallery({ src, alt, placeholderGradient, additionalImages }: ProductGalleryProps) {
  const images = [src, ...(additionalImages ?? [])];
  const [selectedImage, setSelectedImage] = useState(src);

  return (
    <div className="space-y-3">
      <div
        className="group relative aspect-square w-full overflow-hidden rounded-2xl shadow-sm"
        style={{ background: placeholderGradient }}
      >
        <ProductImage
          src={selectedImage}
          alt={alt}
          placeholderGradient={placeholderGradient}
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain transition-transform duration-300 group-hover:scale-110"
          priority
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-3">
          {images.map((image, i) => (
            <button
              key={image}
              type="button"
              onClick={() => setSelectedImage(image)}
              aria-label={`View image ${i + 1}`}
              className={`relative h-20 w-20 overflow-hidden rounded-xl border-2 bg-white transition-colors ${
                selectedImage === image ? "border-gray-900" : "border-gray-200 hover:border-gray-400"
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
    </div>
  );
}
