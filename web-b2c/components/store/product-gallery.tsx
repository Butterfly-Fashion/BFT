"use client";

import { useState } from "react";
import { ProductImage } from "@/components/store/product-image";

interface ProductGalleryProps {
  src: string;
  alt: string;
  placeholderGradient: string;
}

export function ProductGallery({ src, alt, placeholderGradient }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(src);
  const images = [src];

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

      <div className="flex gap-3">
        {images.map((image) => (
          <button
            key={image}
            type="button"
            onClick={() => setSelectedImage(image)}
            className="relative h-20 w-20 overflow-hidden rounded-xl border-2 border-gray-900 bg-white"
            aria-label={`View ${alt}`}
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
    </div>
  );
}
